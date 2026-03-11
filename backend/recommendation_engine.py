import yfinance as yf
import numpy as np
import pandas as pd
import joblib

from tensorflow.keras.models import load_model


# -------- LOAD MODEL AND SCALERS --------
model = load_model("lstm_model.h5", compile=False)

feature_scaler = joblib.load("feature_scaler.save")
target_scaler = joblib.load("target_scaler.save")


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


# -------- FEATURE ENGINEERING --------
def prepare_features(df):

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


# -------- RECOMMENDATION ENGINE --------
def get_top_recommendations():

    results = []

    for ticker in nifty50_stocks:

        try:

            df = yf.download(ticker, period="120d", progress=False)

            if df.empty:
                continue

            X, current_price = prepare_features(df)

            prediction = model.predict(X, verbose=0)

            predicted_price = target_scaler.inverse_transform(prediction)[0][0]

            expected_return = ((predicted_price - current_price) / current_price) * 100

            results.append({
                "ticker": ticker,
                "current_price": float(current_price),
                "predicted_price": float(predicted_price),
                "expected_return": float(expected_return)
            })

        except Exception as e:
            continue


    # Sort by highest return
    results = sorted(results, key=lambda x: x["expected_return"], reverse=True)

    return results[:5]