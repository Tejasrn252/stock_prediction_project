from flask_cors import CORS
from recommendation_engine import get_top_recommendations
from flask import Flask, jsonify, request
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

import pandas as pd
import numpy as np
import joblib
import yfinance as yf
from functools import lru_cache
import time

from tensorflow.keras.models import load_model
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent
FEATURES_DATASET_PATH = BASE_DIR / "nifty500_features.csv"
LIVE_PRICE_TTL_SECONDS = 15

_live_price_cache = {}

load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("ERROR: SECRET_KEY not found in .env file! Please add SECRET_KEY=your_secret_key to backend/.env")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URI or not DB_NAME:
    raise ValueError("ERROR: MONGO_URI or DB_NAME not found in .env file!")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

users = db.users
predictions = db.predictions
contact_messages = db.contact_messages

# -------- LOAD MODEL AND SCALERS --------
model = load_model(BASE_DIR / "lstm_model.h5", compile=False)

feature_scaler = joblib.load(BASE_DIR / "feature_scaler.save")
target_scaler = joblib.load(BASE_DIR / "target_scaler.save")


@lru_cache(maxsize=1)
def _load_local_features_df():
    if not FEATURES_DATASET_PATH.exists():
        return None

    local_df = pd.read_csv(
        FEATURES_DATASET_PATH,
        usecols=["Date", "Ticker", "Close", "SMA20", "SMA50", "RSI"]
    )

    if local_df.empty:
        return None

    local_df["Ticker"] = local_df["Ticker"].astype(str).str.upper()
    local_df = local_df.sort_values("Date")

    return local_df


def _load_local_feature_rows(ticker):
    local_df = _load_local_features_df()
    if local_df is None:
        return None

    ticker = ticker.upper()
    ticker_df = local_df[local_df["Ticker"] == ticker]

    if ticker_df.empty:
        return None

    return ticker_df


def normalize_ticker(raw_ticker):
    ticker = str(raw_ticker or "").strip().upper()
    if not ticker:
        return ""

    base = ticker
    while base.endswith(".NS"):
        base = base[:-3]

    base = base.strip()
    if not base:
        return ""

    return f"{base}.NS"


def _extract_last_close(df):
    if df is None or df.empty or "Close" not in df.columns:
        return None

    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]

    close = close.dropna()
    if close.empty:
        return None

    return float(close.iloc[-1])


def _symbol_from_ticker(ticker):
    return str(ticker or "").replace(".NS", "").upper().strip()


def _get_nse_live_price(ticker):
    symbol = _symbol_from_ticker(ticker)
    if not symbol:
        return None

    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.nseindia.com/",
        "Origin": "https://www.nseindia.com",
    }

    try:
        session.get("https://www.nseindia.com", headers=headers, timeout=5)
        response = session.get(
            f"https://www.nseindia.com/api/quote-equity?symbol={symbol}",
            headers=headers,
            timeout=5,
        )
        if response.status_code != 200:
            return None

        payload = response.json()
        info = payload.get("priceInfo", {})
        last_price = info.get("lastPrice")
        if last_price is None:
            return None

        return float(last_price)
    except Exception:
        return None


def _compute_rsi(close_series, window=14):
    delta = close_series.diff()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)

    avg_gain = gains.rolling(window=window, min_periods=window).mean()
    avg_loss = losses.rolling(window=window, min_periods=window).mean()

    avg_loss = avg_loss.replace(0, np.nan)
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    return rsi


def _to_padded_sequence(feature_values, sequence_length=60):
    if feature_values is None or len(feature_values) == 0:
        return None

    if len(feature_values) >= sequence_length:
        return feature_values[-sequence_length:]

    pad_count = sequence_length - len(feature_values)
    pad_block = np.repeat(feature_values[:1], repeats=pad_count, axis=0)
    return np.vstack([pad_block, feature_values])


def _sanitize_predicted_price(
    current_price,
    raw_predicted_price,
    min_ratio=0.85,
    max_ratio=1.15,
    blend_weight=0.30,
):
    lower_bound = float(current_price) * min_ratio
    upper_bound = float(current_price) * max_ratio
    clipped_price = float(np.clip(float(raw_predicted_price), lower_bound, upper_bound))
    smoothed_price = (float(current_price) * (1.0 - blend_weight)) + (clipped_price * blend_weight)
    return float(np.clip(smoothed_price, lower_bound, upper_bound))


def _prepare_online_features(ticker):
    try:
        stock = yf.Ticker(ticker)
        history_df = stock.history(period="2y", interval="1d")
    except Exception:
        return None

    if history_df is None or history_df.empty or "Close" not in history_df.columns:
        return None

    close = history_df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]

    close = close.dropna().astype(float)
    if len(close) < 20:
        return None

    features_df = pd.DataFrame({
        "Close": close,
        "SMA20": close.rolling(window=20, min_periods=20).mean(),
        "SMA50": close.rolling(window=50, min_periods=50).mean(),
        "RSI": _compute_rsi(close, window=14)
    }).dropna()

    if features_df.empty:
        return None

    feature_values = features_df[["Close", "SMA20", "SMA50", "RSI"]].to_numpy(dtype=float)
    sequence = _to_padded_sequence(feature_values, sequence_length=60)
    if sequence is None:
        return None

    scaled_values = feature_scaler.transform(sequence)
    X = np.array([scaled_values], dtype=float)
    current_price = float(feature_values[-1, 0])

    return X, current_price


def get_live_price(ticker, fallback_price=None, bypass_cache=False):
    now = time.time()
    cached_price = _live_price_cache.get(ticker)
    if not bypass_cache and cached_price and cached_price[0] > now:
        return cached_price[1], cached_price[2], cached_price[3]

    try:
        nse_price = _get_nse_live_price(ticker)
        if nse_price is not None and np.isfinite(nse_price):
            updated_at = datetime.datetime.utcnow().isoformat() + "Z"
            if not bypass_cache:
                _live_price_cache[ticker] = (now + LIVE_PRICE_TTL_SECONDS, nse_price, "nse", updated_at)
            return nse_price, "nse", updated_at

        stock = yf.Ticker(ticker)

        fast_info = getattr(stock, "fast_info", None)
        if fast_info:
            for key in ("lastPrice", "regularMarketPrice", "previousClose"):
                value = None
                try:
                    value = fast_info.get(key)
                except Exception:
                    try:
                        value = fast_info[key]
                    except Exception:
                        value = None

                if value is not None and np.isfinite(value):
                    price = float(value)
                    updated_at = datetime.datetime.utcnow().isoformat() + "Z"
                    if not bypass_cache:
                        _live_price_cache[ticker] = (now + LIVE_PRICE_TTL_SECONDS, price, "yfinance-fast", updated_at)
                    return price, "yfinance-fast", updated_at

        intraday = stock.history(period="1d", interval="1m")
        intraday_price = _extract_last_close(intraday)
        if intraday_price is not None:
            updated_at = datetime.datetime.utcnow().isoformat() + "Z"
            if not bypass_cache:
                _live_price_cache[ticker] = (now + LIVE_PRICE_TTL_SECONDS, intraday_price, "yfinance-intraday", updated_at)
            return intraday_price, "yfinance-intraday", updated_at

        recent_daily = stock.history(period="5d", interval="1d")
        recent_price = _extract_last_close(recent_daily)
        if recent_price is not None:
            updated_at = datetime.datetime.utcnow().isoformat() + "Z"
            if not bypass_cache:
                _live_price_cache[ticker] = (now + LIVE_PRICE_TTL_SECONDS, recent_price, "yfinance-daily", updated_at)
            return recent_price, "yfinance-daily", updated_at
    except Exception:
        pass

    if fallback_price is None:
        return None

    fallback_value = float(fallback_price)
    updated_at = datetime.datetime.utcnow().isoformat() + "Z"
    if not bypass_cache:
        _live_price_cache[ticker] = (now + LIVE_PRICE_TTL_SECONDS, fallback_value, "dataset", updated_at)
    return fallback_value, "dataset", updated_at


@app.route("/")
def home():
    return jsonify({"message": "Stock Prediction Backend Running"})


# ---------------- AUTH MIDDLEWARE ----------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = None
        auth_header = request.headers.get("Authorization")

        if auth_header:
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"error": "Invalid Authorization header format. Use: Authorization: Bearer <token>"}), 401

        if not token:
            return jsonify({"error": "Token missing. Please login first"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = users.find_one({"email": data["email"]})
            if not current_user:
                return jsonify({"error": "User not found. Please login again"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired. Please login again", "code": "TOKEN_EXPIRED"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401
        except Exception as e:
            app.logger.error(f"Token validation error: {str(e)}")
            return jsonify({"error": f"Token validation failed: {str(e)}"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)

    users.insert_one({
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_password,
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "User registered successfully"})


# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid password"}), 401

    token = jwt.encode(
        {
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "token": token,
        "name": user.get("name", "User")
    })


@app.route("/me", methods=["GET"])
@token_required
def me(current_user):
    return jsonify({
        "name": current_user.get("name", "User"),
        "email": current_user.get("email", ""),
        "phone": current_user.get("phone", "")
    })
    


# ---------------- FEATURE PREPARATION ----------------
def prepare_features(ticker):

    local_df = _load_local_feature_rows(ticker)
    if local_df is not None and len(local_df) >= 20:
        feature_slice = local_df[["Close", "SMA20", "SMA50", "RSI"]].astype(float).dropna()
        if not feature_slice.empty:
            feature_values = feature_slice.to_numpy(dtype=float)
            sequence = _to_padded_sequence(feature_values, sequence_length=60)
            if sequence is not None:
                scaled_values = feature_scaler.transform(sequence)
                X = np.array([scaled_values], dtype=float)
                current_price = float(feature_values[-1, 0])
                return X, current_price

    return _prepare_online_features(ticker)


# ---------------- PREDICTION API ----------------
@app.route("/predict", methods=["POST"])
@token_required
def predict(current_user):

    data = request.get_json()

    ticker = normalize_ticker(data.get("ticker"))
    refresh_price = bool(data.get("refresh_price", False))

    if not ticker:
        return jsonify({"error": "Ticker required"}), 400

    try:
        result = prepare_features(ticker)
    except Exception:
        return jsonify({"error": "Failed to prepare features from local or online market data"}), 500

    if result is None:
        return jsonify({"error": "Invalid ticker"}), 400

    X, dataset_price = result

    live_price, price_source, price_updated_at = get_live_price(
        ticker,
        fallback_price=dataset_price,
        bypass_cache=refresh_price
    )
    current_price = float(live_price if live_price is not None else dataset_price)

    try:
        prediction_scaled = model.predict(X)
    except Exception:
        return jsonify({"error": "Model prediction failed"}), 500

    raw_predicted_price = target_scaler.inverse_transform(prediction_scaled)[0][0]
    predicted_price = _sanitize_predicted_price(current_price, raw_predicted_price)

    expected_return = ((predicted_price - current_price) / current_price) * 100

    predictions.insert_one({
        "user_email": current_user["email"],
        "ticker": ticker,
        "current_price": float(current_price),
        "price_source": price_source,
        "dataset_price": float(dataset_price),
        "predicted_price": float(predicted_price),
        "expected_return": float(expected_return),
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({
        "ticker": ticker,
        "current_price": float(current_price),
        "price_source": price_source,
        "current_price_updated_at": price_updated_at,
        "predicted_price_30d": float(predicted_price),
        "expected_return_percent": float(expected_return)
    })

# ---------------- RECOMMENDATION API ----------------
@app.route("/recommend", methods=["GET"])
@token_required
def recommend(current_user):

    try:
        top_stocks = get_top_recommendations()

        return jsonify({
            "top_recommendations": top_stocks
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ---------------- HISTORY API ----------------
@app.route("/history", methods=["GET"])
@token_required
def history(current_user):

    try:
        user_predictions = list(
            predictions.find(
                {"user_email": current_user["email"]},
                {"_id": 0}
            ).sort("created_at", -1)
        )

        return jsonify({
            "predictions": user_predictions
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# ---------------- CONTACT API ----------------
@app.route("/contact", methods=["POST"])
@token_required
def contact(current_user):

    data = request.get_json() or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    phone = str(data.get("phone", "")).strip()
    message = str(data.get("message", "")).strip()

    if not name or not email or not phone or not message:
        return jsonify({"error": "Name, email, phone and message are required"}), 400

    contact_messages.insert_one({
        "name": name,
        "email": email,
        "phone": phone,
        "message": message,
        "user_email": current_user.get("email", ""),
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({"message": "Contact request submitted successfully"})


# ---------------- CHART API ----------------
@app.route("/chart", methods=["GET"])
@token_required
def chart(current_user):

    raw_ticker = request.args.get("ticker", "")
    period = request.args.get("period", "6mo")
    interval = request.args.get("interval", "1d")

    ticker = normalize_ticker(raw_ticker)
    if not ticker:
        return jsonify({"error": "Ticker required"}), 400

    allowed_periods = {"1mo", "3mo", "6mo", "1y", "2y", "3y", "5y", "all"}
    allowed_intervals = {"1d", "1wk"}

    if period not in allowed_periods:
        period = "6mo"

    if interval not in allowed_intervals:
        interval = "1d"

    # yfinance does not support period="3y", so fetch 5y and slice locally.
    fetch_period = period
    if period == "3y":
        fetch_period = "5y"
    elif period == "all":
        fetch_period = "max"

    try:
        df = yf.download(ticker, period=fetch_period, interval=interval, progress=False)

        if df is None or df.empty:
            return jsonify({"error": "No chart data found for this stock"}), 404

        if period == "3y":
            cutoff = pd.Timestamp.now(tz=df.index.tz) - pd.DateOffset(years=3)
            df = df[df.index >= cutoff]
            if df.empty:
                return jsonify({"error": "No chart data found for 3Y range"}), 404

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        close = df["Close"]
        if isinstance(close, pd.DataFrame):
            close = close.iloc[:, 0]

        close = close.dropna()
        if close.empty:
            return jsonify({"error": "No close-price data available"}), 404

        labels = [idx.strftime("%Y-%m-%d") for idx in close.index]
        prices = [float(value) for value in close.values]

        current_price = prices[-1]
        start_price = prices[0]
        absolute_change = current_price - start_price
        change_percent = (absolute_change / start_price) * 100 if start_price else 0.0

        return jsonify({
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "labels": labels,
            "prices": prices,
            "summary": {
                "current_price": float(current_price),
                "start_price": float(start_price),
                "absolute_change": float(absolute_change),
                "change_percent": float(change_percent)
            }
        })
    except Exception as e:
        return jsonify({"error": f"Failed to load chart: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)