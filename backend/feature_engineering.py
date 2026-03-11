import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import SMAIndicator

# load dataset
df = pd.read_csv("nifty500_dataset.csv")

print("Dataset loaded")

# sort data properly
df = df.sort_values(by=["Ticker", "Date"])

# calculate indicators for each stock separately
df["SMA20"] = df.groupby("Ticker")["Close"].transform(
    lambda x: SMAIndicator(close=x, window=20).sma_indicator()
)

df["SMA50"] = df.groupby("Ticker")["Close"].transform(
    lambda x: SMAIndicator(close=x, window=50).sma_indicator()
)

df["RSI"] = df.groupby("Ticker")["Close"].transform(
    lambda x: RSIIndicator(close=x, window=14).rsi()
)

# remove rows with NaN values
df = df.dropna()

# save dataset
df.to_csv("nifty500_features.csv", index=False)

print("Feature dataset created successfully!")