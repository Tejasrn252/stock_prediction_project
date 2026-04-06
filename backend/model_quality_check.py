import json
from pathlib import Path
import argparse

import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "nifty500_features.csv"
MODEL_PATH = BASE_DIR / "lstm_model.h5"
FEATURE_SCALER_PATH = BASE_DIR / "feature_scaler.save"
TARGET_SCALER_PATH = BASE_DIR / "target_scaler.save"

SEQUENCE_LENGTH = 60
FUTURE_HORIZON = 30
N_RECO_DATES = 25
DEFAULT_MAX_TICKERS = 35
DEFAULT_MAX_WINDOWS_PER_TICKER = 140


def load_artifacts():
    model = load_model(MODEL_PATH, compile=False)
    feature_scaler = joblib.load(FEATURE_SCALER_PATH)
    target_scaler = joblib.load(TARGET_SCALER_PATH)
    return model, feature_scaler, target_scaler


def build_labeled_features(df):
    df = df.copy()
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(["Ticker", "Date"])
    df["FutureClose"] = df.groupby("Ticker")["Close"].shift(-FUTURE_HORIZON)
    return df.dropna(subset=["Close", "SMA20", "SMA50", "RSI", "FutureClose"]).copy()


def _batched_predict(model, x_batch, target_scaler):
    pred_scaled = model.predict(x_batch, verbose=0)
    return target_scaler.inverse_transform(pred_scaled).reshape(-1)


def prediction_quality(labeled_df, model, feature_scaler, target_scaler, max_windows_per_ticker):
    y_true = []
    y_pred = []
    correct_direction = 0
    total_direction = 0

    for _, g in labeled_df.groupby("Ticker"):
        if len(g) < SEQUENCE_LENGTH + 1:
            continue

        feat = g[["Close", "SMA20", "SMA50", "RSI"]].astype(float).to_numpy()
        targets = g["FutureClose"].astype(float).to_numpy()
        close_now = g["Close"].astype(float).to_numpy()

        scaled = feature_scaler.transform(feat)

        start_idx = SEQUENCE_LENGTH
        indexes = list(range(start_idx, len(g)))
        if len(indexes) > max_windows_per_ticker:
            indexes = indexes[-max_windows_per_ticker:]

        x_windows = np.array([scaled[i - SEQUENCE_LENGTH:i] for i in indexes], dtype=np.float32)
        preds = _batched_predict(model, x_windows, target_scaler)

        for pred, i in zip(preds, indexes):
            actual = float(targets[i])
            y_pred.append(float(pred))
            y_true.append(actual)

            pred_return = float(pred) - float(close_now[i])
            actual_return = actual - float(close_now[i])
            if pred_return == 0 or actual_return == 0:
                continue
            total_direction += 1
            if (pred_return > 0 and actual_return > 0) or (pred_return < 0 and actual_return < 0):
                correct_direction += 1

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)

    mae = float(np.mean(np.abs(y_true - y_pred))) if len(y_true) else np.nan
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2))) if len(y_true) else np.nan
    mape = float(np.mean(np.abs((y_true - y_pred) / np.maximum(np.abs(y_true), 1e-8))) * 100) if len(y_true) else np.nan
    direction_acc = float((correct_direction / total_direction) * 100) if total_direction else np.nan

    return {
        "samples": int(len(y_true)),
        "mae": mae,
        "rmse": rmse,
        "mape_percent": mape,
        "direction_accuracy_percent": direction_acc,
    }


def recommendation_quality(labeled_df, model, feature_scaler, target_scaler, max_windows_per_ticker):
    eligible = []

    for ticker, g in labeled_df.groupby("Ticker"):
        g = g.sort_values("Date").reset_index(drop=True)
        if len(g) < SEQUENCE_LENGTH + 1:
            continue

        feat = g[["Close", "SMA20", "SMA50", "RSI"]].astype(float).to_numpy()
        future = g["FutureClose"].astype(float).to_numpy()
        close_now = g["Close"].astype(float).to_numpy()

        scaled = feature_scaler.transform(feat)

        indexes = list(range(SEQUENCE_LENGTH, len(g)))
        if len(indexes) > max_windows_per_ticker:
            indexes = indexes[-max_windows_per_ticker:]

        x_windows = np.array([scaled[i - SEQUENCE_LENGTH:i] for i in indexes], dtype=np.float32)
        preds = _batched_predict(model, x_windows, target_scaler)

        rows = []
        for pred, i in zip(preds, indexes):
            actual = float(future[i])
            curr = float(close_now[i])
            rows.append({
                "Date": g.loc[i, "Date"],
                "Ticker": ticker,
                "PredRet": (float(pred) - curr) / max(curr, 1e-8),
                "ActRet": (actual - curr) / max(curr, 1e-8),
            })

        if rows:
            eligible.append(pd.DataFrame(rows))

    if not eligible:
        return {
            "dates_tested": 0,
            "avg_top5_actual_return_percent": np.nan,
            "avg_universe_actual_return_percent": np.nan,
            "top5_outperformance_percent": np.nan,
            "top5_positive_hit_rate_percent": np.nan,
        }

    pred_df = pd.concat(eligible, ignore_index=True)
    common_dates = pred_df["Date"].value_counts()
    common_dates = common_dates[common_dates >= 10].index.sort_values()

    if len(common_dates) == 0:
        return {
            "dates_tested": 0,
            "avg_top5_actual_return_percent": np.nan,
            "avg_universe_actual_return_percent": np.nan,
            "top5_outperformance_percent": np.nan,
            "top5_positive_hit_rate_percent": np.nan,
        }

    sampled_dates = list(common_dates[-N_RECO_DATES:])
    top5_returns = []
    universe_returns = []
    top5_hits = []

    for d in sampled_dates:
        day = pred_df[pred_df["Date"] == d].copy()
        if len(day) < 5:
            continue

        top5 = day.sort_values("PredRet", ascending=False).head(5)
        top5_returns.append(float(top5["ActRet"].mean() * 100))
        universe_returns.append(float(day["ActRet"].mean() * 100))
        top5_hits.append(float((top5["ActRet"] > 0).mean() * 100))

    return {
        "dates_tested": int(len(top5_returns)),
        "avg_top5_actual_return_percent": float(np.mean(top5_returns)) if top5_returns else np.nan,
        "avg_universe_actual_return_percent": float(np.mean(universe_returns)) if universe_returns else np.nan,
        "top5_outperformance_percent": float(np.mean(top5_returns) - np.mean(universe_returns)) if top5_returns else np.nan,
        "top5_positive_hit_rate_percent": float(np.mean(top5_hits)) if top5_hits else np.nan,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-tickers", type=int, default=DEFAULT_MAX_TICKERS)
    parser.add_argument("--max-windows-per-ticker", type=int, default=DEFAULT_MAX_WINDOWS_PER_TICKER)
    args = parser.parse_args()

    model, feature_scaler, target_scaler = load_artifacts()
    raw_df = pd.read_csv(DATA_PATH)
    labeled_df = build_labeled_features(raw_df)

    ticker_counts = labeled_df["Ticker"].value_counts()
    selected = ticker_counts.head(max(1, args.max_tickers)).index
    labeled_df = labeled_df[labeled_df["Ticker"].isin(selected)].copy()

    pred_metrics = prediction_quality(
        labeled_df,
        model,
        feature_scaler,
        target_scaler,
        max_windows_per_ticker=max(30, args.max_windows_per_ticker),
    )
    reco_metrics = recommendation_quality(
        labeled_df,
        model,
        feature_scaler,
        target_scaler,
        max_windows_per_ticker=max(30, args.max_windows_per_ticker),
    )

    output = {
        "config": {
            "max_tickers": int(args.max_tickers),
            "max_windows_per_ticker": int(args.max_windows_per_ticker),
        },
        "prediction": pred_metrics,
        "recommendation": reco_metrics,
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
