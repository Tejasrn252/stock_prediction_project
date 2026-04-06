from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.models import Sequential

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "nifty500_features.csv"
MODEL_PATH = BASE_DIR / "lstm_model.h5"
FEATURE_SCALER_PATH = BASE_DIR / "feature_scaler.save"
TARGET_SCALER_PATH = BASE_DIR / "target_scaler.save"

FEATURE_COLUMNS = ["Close", "SMA20", "SMA50", "RSI"]
TARGET_HORIZON = 30
SEQUENCE_LENGTH = 60
MIN_ROWS_PER_TICKER = 140
MAX_TICKERS = 150
TRAIN_RATIO = 0.8


def load_dataset():
    print("Loading feature dataset...")
    df = pd.read_csv(DATA_PATH)
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(["Ticker", "Date"]).copy()
    df["Target"] = df.groupby("Ticker")["Close"].shift(-TARGET_HORIZON)
    df = df.dropna(subset=FEATURE_COLUMNS + ["Target"])

    ticker_counts = df["Ticker"].value_counts()
    selected_tickers = ticker_counts[ticker_counts >= MIN_ROWS_PER_TICKER].head(MAX_TICKERS).index
    df = df[df["Ticker"].isin(selected_tickers)].copy()

    print(f"Using {df['Ticker'].nunique()} tickers with at least {MIN_ROWS_PER_TICKER} rows.")
    return df


def fit_scalers(df):
    train_frames = []

    for _, group in df.groupby("Ticker"):
        group = group.sort_values("Date").reset_index(drop=True)
        split_idx = int(len(group) * TRAIN_RATIO)
        if split_idx <= SEQUENCE_LENGTH:
            continue
        train_frames.append(group.iloc[:split_idx])

    if not train_frames:
        raise ValueError("Insufficient data to fit scalers")

    train_df = pd.concat(train_frames, ignore_index=True)

    feature_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()

    feature_scaler.fit(train_df[FEATURE_COLUMNS].astype(float).to_numpy())
    target_scaler.fit(train_df[["Target"]].astype(float).to_numpy())

    return feature_scaler, target_scaler


def build_sequences(df, feature_scaler, target_scaler):
    X_train, y_train = [], []
    X_val, y_val = [], []

    for _, group in df.groupby("Ticker"):
        group = group.sort_values("Date").reset_index(drop=True)
        if len(group) < SEQUENCE_LENGTH + 10:
            continue

        features = group[FEATURE_COLUMNS].astype(float).to_numpy()
        targets = group[["Target"]].astype(float).to_numpy()

        features_scaled = feature_scaler.transform(features)
        targets_scaled = target_scaler.transform(targets)

        split_idx = int(len(group) * TRAIN_RATIO)
        if split_idx <= SEQUENCE_LENGTH or split_idx >= len(group):
            continue

        for i in range(SEQUENCE_LENGTH, len(group)):
            x = features_scaled[i - SEQUENCE_LENGTH:i]
            y = targets_scaled[i]
            if i < split_idx:
                X_train.append(x)
                y_train.append(y)
            else:
                X_val.append(x)
                y_val.append(y)

    if not X_train or not X_val:
        raise ValueError("Could not build enough train/validation sequences")

    return (
        np.array(X_train, dtype=np.float32),
        np.array(y_train, dtype=np.float32),
        np.array(X_val, dtype=np.float32),
        np.array(y_val, dtype=np.float32),
    )


def build_model(input_shape):
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=input_shape),
        Dropout(0.15),
        LSTM(32),
        Dense(16, activation="relu"),
        Dense(1),
    ])

    model.compile(optimizer="adam", loss="mse")
    return model


def main():
    df = load_dataset()
    feature_scaler, target_scaler = fit_scalers(df)

    X_train, y_train, X_val, y_val = build_sequences(df, feature_scaler, target_scaler)

    print(f"Train samples: {X_train.shape}")
    print(f"Validation samples: {X_val.shape}")

    model = build_model((X_train.shape[1], X_train.shape[2]))

    callbacks = [
        EarlyStopping(
            monitor="val_loss",
            patience=2,
            restore_best_weights=True,
            min_delta=1e-5,
        )
    ]

    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=8,
        batch_size=64,
        callbacks=callbacks,
        verbose=1,
    )

    model.save(MODEL_PATH)
    joblib.dump(feature_scaler, FEATURE_SCALER_PATH)
    joblib.dump(target_scaler, TARGET_SCALER_PATH)

    final_val_loss = float(min(history.history.get("val_loss", [0.0])))
    print(f"Model trained and saved. Best val_loss: {final_val_loss:.6f}")
    print("Scalers saved with current scikit-learn version.")


if __name__ == "__main__":
    main()