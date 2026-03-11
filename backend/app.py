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

import yfinance as yf
import pandas as pd
import numpy as np
import joblib

from tensorflow.keras.models import load_model

load_dotenv()

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.getenv("SECRET_KEY")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

users = db.users
predictions = db.predictions

# -------- LOAD MODEL AND SCALERS --------
model = load_model("lstm_model.h5", compile=False)

feature_scaler = joblib.load("feature_scaler.save")
target_scaler = joblib.load("target_scaler.save")


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
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = users.find_one({"email": data["email"]})
        except:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# ---------------- REGISTER ----------------
@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)

    users.insert_one({
        "name": name,
        "email": email,
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
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({"token": token})


# ---------------- FEATURE PREPARATION ----------------
def prepare_features(ticker):

    df = yf.download(ticker, period="120d")

    if df.empty:
        return None

    df["SMA20"] = df["Close"].rolling(20).mean()
    df["SMA50"] = df["Close"].rolling(50).mean()

    delta = df["Close"].diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()

    rs = avg_gain / avg_loss
    df["RSI"] = 100 - (100 / (1 + rs))

    df = df.dropna()

    features = df[["Close", "SMA20", "SMA50", "RSI"]].values

    features_scaled = feature_scaler.transform(features)

    last_sequence = features_scaled[-60:]

    X = np.array([last_sequence])

    current_price = float(df["Close"].iloc[-1])

    return X, current_price


# ---------------- PREDICTION API ----------------
@app.route("/predict", methods=["POST"])
@token_required
def predict(current_user):

    data = request.get_json()

    ticker = data.get("ticker")

    if not ticker:
        return jsonify({"error": "Ticker required"}), 400

    result = prepare_features(ticker)

    if result is None:
        return jsonify({"error": "Invalid ticker"}), 400

    X, current_price = result

    prediction_scaled = model.predict(X)

    predicted_price = target_scaler.inverse_transform(prediction_scaled)[0][0]

    expected_return = ((predicted_price - current_price) / current_price) * 100

    predictions.insert_one({
        "user_email": current_user["email"],
        "ticker": ticker,
        "current_price": float(current_price),
        "predicted_price": float(predicted_price),
        "expected_return": float(expected_return),
        "created_at": datetime.datetime.utcnow()
    })

    return jsonify({
        "ticker": ticker,
        "current_price": float(current_price),
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)