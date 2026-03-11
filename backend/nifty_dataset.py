import yfinance as yf
import pandas as pd
import time

print("Loading NIFTY 500 stock list...")

# Official NSE NIFTY 500 list
url = "https://archives.nseindia.com/content/indices/ind_nifty500list.csv"
stocks_df = pd.read_csv(url)

symbols = stocks_df["Symbol"]

print("Total stocks:", len(symbols))

all_data = []

for symbol in symbols:

    ticker = symbol + ".NS"
    print("Downloading:", ticker)

    try:
        df = yf.download(
            ticker,
            start="2015-01-01",
            end="2026-01-01",
            progress=False
        )

        if df.empty:
            print("No data:", ticker)
            continue

        # flatten columns if needed
        df.columns = [col[0] if isinstance(col, tuple) else col for col in df.columns]

        df.reset_index(inplace=True)

        df["Ticker"] = ticker

        all_data.append(df)

        # small delay to avoid rate limits
        time.sleep(0.5)

    except Exception as e:
        print("Error downloading:", ticker)

# combine all data
dataset = pd.concat(all_data, ignore_index=True)

# save dataset
dataset.to_csv("nifty500_dataset.csv", index=False)

print("Dataset created successfully!")
print("Total rows:", len(dataset))