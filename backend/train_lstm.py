import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import joblib

print("Loading dataset...")

df = pd.read_csv("nifty500_features.csv")

# Train using one stock first
stock = "RELIANCE.NS"
df = df[df["Ticker"] == stock]

df = df.sort_values("Date")

# 30-day future target
df["Target"] = df["Close"].shift(-30)

df = df.dropna()

features = df[["Close","SMA20","SMA50","RSI"]].values
target = df["Target"].values.reshape(-1,1)

# scale features
feature_scaler = MinMaxScaler()
features_scaled = feature_scaler.fit_transform(features)

# scale target
target_scaler = MinMaxScaler()
target_scaled = target_scaler.fit_transform(target)

# save scalers for API
joblib.dump(feature_scaler, "feature_scaler.save")
joblib.dump(target_scaler, "target_scaler.save")

sequence_length = 60

X = []
y = []

for i in range(sequence_length, len(features_scaled)):
    X.append(features_scaled[i-sequence_length:i])
    y.append(target_scaled[i])

X = np.array(X)
y = np.array(y)

print("Training samples:", X.shape)

model = Sequential()

model.add(LSTM(64, return_sequences=True, input_shape=(X.shape[1],X.shape[2])))
model.add(LSTM(32))
model.add(Dense(1))

model.compile(optimizer="adam", loss="mse")

model.fit(X, y, epochs=5, batch_size=32)

# save model
model.save("lstm_model.h5")

print("Model trained and saved")
print("Scalers saved")