import yfinance as yf
import numpy as np
import pandas as pd
import joblib
import time
from functools import lru_cache
import datetime
import requests

from tensorflow.keras.models import load_model
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
FEATURES_DATASET_PATH = BASE_DIR / "nifty500_features.csv"
RECOMMENDATION_CACHE_TTL_SECONDS = 30
LIVE_PRICE_TTL_SECONDS = 15
SHORTLIST_SIZE = 12

_recommendation_cache = {
    "expires_at": 0,
    "value": None,
}

_live_price_cache = {}

# -------- LOAD MODEL AND SCALERS --------
model = load_model(BASE_DIR / "lstm_model.h5", compile=False)

feature_scaler = joblib.load(BASE_DIR / "feature_scaler.save")
target_scaler = joblib.load(BASE_DIR / "target_scaler.save")


@lru_cache(maxsize=1)
def _load_local_features():
    if not FEATURES_DATASET_PATH.exists():
        return None

    df = pd.read_csv(
        FEATURES_DATASET_PATH,
        usecols=["Date", "Ticker", "Close", "SMA20", "SMA50", "RSI"]
    )

    if df.empty:
        return None

    df["Ticker"] = df["Ticker"].astype(str).str.upper()
    return df.sort_values("Date")


# -------- NIFTY STOCK LIST --------
nifty50_stocks = [
"RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS",
"HINDUNILVR.NS","ITC.NS","SBIN.NS","BHARTIARTL.NS","KOTAKBANK.NS",
"LT.NS","HCLTECH.NS","AXISBANK.NS","ASIANPAINT.NS","MARUTI.NS",
"TITAN.NS","ULTRACEMCO.NS","SUNPHARMA.NS","BAJFINANCE.NS","NESTLEIND.NS",
"TATASTEEL.NS","WIPRO.NS","POWERGRID.NS","NTPC.NS","TECHM.NS",
"JSWSTEEL.NS","ONGC.NS","ADANIENT.NS","ADANIPORTS.NS","COALINDIA.NS",
"BPCL.NS","BRITANNIA.NS","DRREDDY.NS","EICHERMOT.NS","GRASIM.NS",
"HEROMOTOCO.NS","HINDALCO.NS","INDUSINDBK.NS","IOC.NS","M&M.NS",
"SBILIFE.NS","SHREECEM.NS","TATACONSUM.NS","TATAMOTORS.NS",
"UPL.NS","BAJAJFINSV.NS","BAJAJ-AUTO.NS","CIPLA.NS","DIVISLAB.NS"
]

stock_name_map = {
    "RELIANCE.NS": "Reliance Industries",
    "TCS.NS": "Tata Consultancy Services",
    "HDFCBANK.NS": "HDFC Bank",
    "INFY.NS": "Infosys",
    "ICICIBANK.NS": "ICICI Bank",
    "HINDUNILVR.NS": "Hindustan Unilever",
    "ITC.NS": "ITC",
    "SBIN.NS": "State Bank of India",
    "BHARTIARTL.NS": "Bharti Airtel",
    "KOTAKBANK.NS": "Kotak Mahindra Bank",
    "LT.NS": "Larsen & Toubro",
    "HCLTECH.NS": "HCL Technologies",
    "AXISBANK.NS": "Axis Bank",
    "ASIANPAINT.NS": "Asian Paints",
    "MARUTI.NS": "Maruti Suzuki",
    "TITAN.NS": "Titan Company",
    "ULTRACEMCO.NS": "UltraTech Cement",
    "SUNPHARMA.NS": "Sun Pharmaceutical",
    "BAJFINANCE.NS": "Bajaj Finance",
    "NESTLEIND.NS": "Nestle India",
    "TATASTEEL.NS": "Tata Steel",
    "WIPRO.NS": "Wipro",
    "POWERGRID.NS": "Power Grid",
    "NTPC.NS": "NTPC",
    "TECHM.NS": "Tech Mahindra",
    "JSWSTEEL.NS": "JSW Steel",
    "ONGC.NS": "ONGC",
    "ADANIENT.NS": "Adani Enterprises",
    "ADANIPORTS.NS": "Adani Ports",
    "COALINDIA.NS": "Coal India",
    "BPCL.NS": "BPCL",
    "BRITANNIA.NS": "Britannia",
    "DRREDDY.NS": "Dr. Reddy's Laboratories",
    "EICHERMOT.NS": "Eicher Motors",
    "GRASIM.NS": "Grasim Industries",
    "HEROMOTOCO.NS": "Hero MotoCorp",
    "HINDALCO.NS": "Hindalco",
    "INDUSINDBK.NS": "IndusInd Bank",
    "IOC.NS": "Indian Oil Corporation",
    "M&M.NS": "Mahindra & Mahindra",
    "SBILIFE.NS": "SBI Life Insurance",
    "SHREECEM.NS": "Shree Cement",
    "TATACONSUM.NS": "Tata Consumer Products",
    "TATAMOTORS.NS": "Tata Motors",
    "UPL.NS": "UPL",
    "BAJAJFINSV.NS": "Bajaj Finserv",
    "BAJAJ-AUTO.NS": "Bajaj Auto",
    "CIPLA.NS": "Cipla",
    "DIVISLAB.NS": "Divi's Laboratories"
}


# -------- FEATURE ENGINEERING --------
def prepare_features(df):

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]

    close = close.astype(float)

    sma20 = close.rolling(20).mean()
    sma50 = close.rolling(50).mean()

    delta = close.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    feature_df = pd.DataFrame({
        "Close": close,
        "SMA20": sma20,
        "SMA50": sma50,
        "RSI": rsi
    }).dropna()

    if len(feature_df) < 60:
        return None

    features = feature_df[["Close", "SMA20", "SMA50", "RSI"]].values

    features_scaled = feature_scaler.transform(features)

    last_sequence = features_scaled[-60:]

    X = np.array([last_sequence])

    current_price = float(feature_df["Close"].iloc[-1])

    return X, current_price


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


def _get_live_price(ticker, fallback_price):
    now = time.time()
    cached = _live_price_cache.get(ticker)
    if cached and cached[0] > now:
        return cached[1], "live-cache"

    price = None

    try:
        nse_price = _get_nse_live_price(ticker)
        if nse_price is not None and np.isfinite(nse_price):
            price = nse_price

        stock = yf.Ticker(ticker)

        if price is None:
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
                        break

        if price is None:
            intraday = stock.history(period="1d", interval="1m")
            intraday_price = _extract_last_close(intraday)
            if intraday_price is not None:
                price = intraday_price

        if price is None:
            recent_daily = stock.history(period="5d", interval="1d")
            recent_price = _extract_last_close(recent_daily)
            if recent_price is not None:
                price = recent_price
    except Exception:
        price = None

    if price is None:
        price = float(fallback_price)
        source = "dataset"
    else:
        source = "live"

    _live_price_cache[ticker] = (now + LIVE_PRICE_TTL_SECONDS, price)
    return price, source


def _confidence_score(expected_return, rsi, trend_strength):
    base = 55.0
    return_component = min(25.0, abs(expected_return) * 1.2)
    trend_component = min(12.0, abs(trend_strength) * 1000)
    rsi_penalty = min(10.0, abs(rsi - 50.0) * 0.2)
    score = base + return_component + trend_component - rsi_penalty
    return float(max(35.0, min(95.0, score)))


def _risk_level(volatility):
    if volatility >= 0.03:
        return "High"
    if volatility >= 0.015:
        return "Medium"
    return "Low"


def _signal_from_return(expected_return):
    if expected_return >= 8:
        return "Strong Buy"
    if expected_return >= 3:
        return "Buy"
    if expected_return >= 0:
        return "Accumulate"
    return "Watch"


# -------- RECOMMENDATION ENGINE --------
def get_top_recommendations():

    now = time.time()
    if _recommendation_cache["value"] is not None and _recommendation_cache["expires_at"] > now:
        return _recommendation_cache["value"]

    candidates = []
    local_features = _load_local_features()

    for ticker in nifty50_stocks:

        try:

            if local_features is not None:
                ticker_df = local_features[local_features["Ticker"] == ticker.upper()]
                if len(ticker_df) >= 60:
                    feature_slice = ticker_df[["Close", "SMA20", "SMA50", "RSI"]].astype(float).tail(60)
                    X = np.array([feature_scaler.transform(feature_slice.values)])
                    dataset_price = float(feature_slice["Close"].iloc[-1])
                    latest_row = feature_slice.iloc[-1]
                    recent_close = feature_slice["Close"].astype(float)
                else:
                    continue
            else:
                df = yf.download(ticker, period="120d", progress=False)

                if df.empty:
                    continue

                prepared = prepare_features(df)
                if prepared is None:
                    continue

                X, dataset_price = prepared
                latest_row = {
                    "SMA20": dataset_price,
                    "SMA50": dataset_price,
                    "RSI": 50,
                    "Close": dataset_price
                }
                recent_close = pd.Series([dataset_price] * 30)

            prediction = model.predict(X, verbose=0)

            raw_predicted_price = target_scaler.inverse_transform(prediction)[0][0]
            predicted_price = _sanitize_predicted_price(dataset_price, raw_predicted_price)

            dataset_return = ((predicted_price - dataset_price) / dataset_price) * 100

            volatility = float(recent_close.pct_change().dropna().tail(20).std()) if len(recent_close) > 20 else 0.0

            candidates.append({
                "ticker": ticker,
                "symbol": ticker.replace(".NS", ""),
                "stock_name": stock_name_map.get(ticker, ticker.replace(".NS", "")),
                "predicted_price": float(predicted_price),
                "dataset_price": float(dataset_price),
                "dataset_return": float(dataset_return),
                "rsi": float(latest_row["RSI"]),
                "trend_strength": float((latest_row["SMA20"] - latest_row["SMA50"]) / max(dataset_price, 1e-6)),
                "volatility": volatility
            })

        except Exception as e:
            continue

    if not candidates:
        return []

    candidates = sorted(candidates, key=lambda x: x["dataset_return"], reverse=True)
    shortlist = candidates[:SHORTLIST_SIZE]

    results = []
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    for item in shortlist:
        live_price, price_source = _get_live_price(item["ticker"], item["dataset_price"])
        expected_return = ((item["predicted_price"] - live_price) / live_price) * 100
        confidence = _confidence_score(expected_return, item["rsi"], item["trend_strength"])

        results.append({
            "ticker": item["ticker"],
            "symbol": item["symbol"],
            "stock_name": item["stock_name"],
            "current_price": float(live_price),
            "dataset_price": float(item["dataset_price"]),
            "predicted_price": float(item["predicted_price"]),
            "expected_return": float(expected_return),
            "expected_return_percent": float(expected_return),
            "potential_upside": float(item["predicted_price"] - live_price),
            "confidence_score": float(confidence),
            "signal": _signal_from_return(expected_return),
            "risk_level": _risk_level(item["volatility"]),
            "price_source": price_source,
            "as_of": timestamp
        })

    results = sorted(results, key=lambda x: (x["expected_return"], x["confidence_score"]), reverse=True)
    top_results = results[:5]

    for index, row in enumerate(top_results, start=1):
        row["rank"] = index

    _recommendation_cache["value"] = top_results
    _recommendation_cache["expires_at"] = now + RECOMMENDATION_CACHE_TTL_SECONDS

    return top_results