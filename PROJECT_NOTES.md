# Stock Prediction Project Notes

These notes are written in simple study format so you can present the project, explain the flow step by step, and revise for viva.

## 1. Project Title

AI Stock Prediction System

## 2. One-Line Summary

This is a full-stack web application that predicts future stock prices using an LSTM deep learning model, shows live market prices and charts, recommends top stocks, stores user history, and supports secure login through JWT authentication.

## 3. Main Idea of the Project

The project combines machine learning and web development.

It does four main jobs:

1. Registers and logs in users.
2. Predicts a stock price for the next 30 days.
3. Shows top 5 recommended stocks.
4. Stores prediction history and contact messages in MongoDB.

## 4. Technology Stack

### Frontend

- React.js
- React Router
- Tailwind CSS
- Chart.js and react-chartjs-2
- Framer Motion
- Axios or fetch for API calls

### Backend

- Flask
- Flask-CORS
- MongoDB
- PyJWT for authentication
- Werkzeug for password hashing
- yfinance for market data
- requests for NSE price fetch

### Machine Learning

- TensorFlow / Keras
- LSTM neural network
- Scikit-learn MinMaxScaler
- pandas and numpy
- ta library for technical indicators
- joblib for saving scalers

## 5. Folder Structure Explanation

### Backend folder

- `app.py` is the main Flask server.
- `nifty_dataset.py` downloads historical stock data.
- `feature_engineering.py` creates technical indicators.
- `train_lstm.py` trains the LSTM model.
- `model_quality_check.py` checks model and recommendation quality.
- `recommendation_engine.py` builds the top 5 stock recommendations.
- `lstm_model.h5` is the trained model.
- `feature_scaler.save` and `target_scaler.save` store scalers.
- `nifty500_dataset.csv` is the raw historical dataset.
- `nifty500_features.csv` is the feature-engineered dataset.

### Frontend folder

- `src/pages` contains screens like Login, Register, Dashboard, Prediction, Recommendations, Charts, History, and Contact.
- `src/components` contains Navbar and Sidebar.
- `src/services/api.js` manages backend URL handling.
- `src/App.js` defines the routes.

## 6. What Problem the Project Solves

Many people want a simple dashboard where they can:

- see stock price trends,
- get AI-based price predictions,
- check which stocks look attractive,
- and review their past predictions.

This project gives all of that in one place.

## 7. Overall System Flow

1. A user registers or logs in.
2. The backend creates a JWT token.
3. The frontend stores the token in localStorage.
4. The user goes to the dashboard.
5. The user enters a stock ticker like RELIANCE or TCS.
6. The backend prepares the stock features.
7. The LSTM model predicts the 30-day future price.
8. The backend calculates expected return.
9. The result is shown on the frontend.
10. The result is stored in MongoDB and shown in history.

## 8. Backend Explanation Step by Step

### 8.1 app.py is the main server

`app.py` starts the Flask application and connects the backend with the database and ML model.

It does these things:

- loads environment variables,
- connects to MongoDB,
- loads the trained model and scalers,
- enables CORS,
- defines API routes,
- and handles prediction logic.

### 8.2 Database collections

The backend uses three MongoDB collections:

- `users` for registered users,
- `predictions` for prediction history,
- `contact_messages` for contact form submissions.

### 8.3 Authentication system

The project uses JWT authentication.

How it works:

1. User registers with name, email, phone, and password.
2. Password is hashed before saving.
3. User logs in using email and password.
4. If the login is correct, the backend creates a JWT token.
5. Protected routes require this token in the Authorization header.

### 8.4 Important backend routes

#### `GET /`

- Simple health check.
- Returns a message that backend is running.

#### `POST /register`

- Creates a new user.
- Stores hashed password in MongoDB.
- Prevents duplicate email registration.

#### `POST /login`

- Checks email and password.
- Returns JWT token if credentials are correct.

#### `GET /me`

- Returns current logged-in user information.
- Requires token.

#### `POST /predict`

- Predicts future stock price for one ticker.
- Requires token.
- Saves prediction in MongoDB.

#### `GET /recommend`

- Returns top 5 recommended stocks.
- Requires token.

#### `GET /history`

- Returns the current user’s prediction history.
- Requires token.

#### `POST /contact`

- Saves user feedback or message.
- Requires token.

#### `GET /chart`

- Returns historical price data for graphs.
- Supports different periods like 1 month, 6 months, 1 year, 3 years, etc.

## 9. Backend Prediction Logic

This is the most important part of the project.

### Step 1: Normalize the ticker

The backend converts the ticker into NSE format.

Example:

- RELIANCE -> RELIANCE.NS

### Step 2: Prepare features

The backend tries to build features using:

- Close price,
- SMA20,
- SMA50,
- RSI.

It first checks the local feature CSV.
If enough local data is not available, it fetches online data using yfinance.

### Step 3: Get live price

The backend tries multiple sources in this order:

1. NSE live price API
2. yfinance fast info
3. yfinance intraday history
4. yfinance daily history
5. dataset fallback price

This makes the system more reliable.

### Step 4: Model prediction

The model predicts a scaled future value.
Then the backend inverse-transforms it using the target scaler.

### Step 5: Prediction sanitization

To avoid unrealistic outputs, the prediction is clipped within a safe range around the current price and blended with the current price.

This helps prevent extreme values.

### Step 6: Expected return

Expected return is calculated as:

`(predicted_price - current_price) / current_price * 100`

### Step 7: Save to history

The result is stored in MongoDB so the user can see it later in the history page.

## 10. Recommendation Engine Explanation

The recommendation engine is in `recommendation_engine.py`.

### What it does

- Checks a fixed list of NIFTY 50 stocks.
- Predicts future price for each stock.
- Computes expected return.
- Adds confidence score, signal, and risk level.
- Sorts stocks and returns the top 5.

### How ranking works

1. Run prediction for each stock.
2. Calculate predicted return.
3. Keep the best candidates.
4. Fetch live current price again.
5. Compute expected return using live price.
6. Assign signal like Strong Buy, Buy, Accumulate, or Watch.
7. Assign risk level like Low, Medium, or High.
8. Return the final top 5 list.

### Important formulas and rules

- Strong Buy if expected return is high.
- Buy if return is positive and decent.
- Accumulate if return is small but positive.
- Watch if return is negative.

### Caching

- Recommendation results are cached for 30 seconds.
- Live price is cached for 15 seconds.

This improves performance.

## 11. Dataset and ML Pipeline

This project has a full data pipeline.

### 11.1 Data collection: `nifty_dataset.py`

This script:

- downloads NIFTY 500 stock list from NSE,
- fetches historical OHLC data using yfinance,
- adds ticker names,
- and saves everything in `nifty500_dataset.csv`.

### 11.2 Feature engineering: `feature_engineering.py`

This script adds technical indicators to each stock:

- SMA20
- SMA50
- RSI

After removing missing values, it saves `nifty500_features.csv`.

### 11.3 Training: `train_lstm.py`

This script trains the LSTM model.

#### Input features

- Close
- SMA20
- SMA50
- RSI

#### Target

- Close price 30 days ahead

#### Important training settings

- Lookback sequence length: 60 days
- Prediction horizon: 30 days ahead
- Train/validation split: 80/20
- Loss function: Mean Squared Error
- Optimizer: Adam
- Early stopping: yes

#### Model architecture

1. LSTM with 64 units and return sequences
2. Dropout 0.15
3. LSTM with 32 units
4. Dense 16 with ReLU
5. Dense 1 output layer

#### Saved artifacts

- `lstm_model.h5`
- `feature_scaler.save`
- `target_scaler.save`

### 11.4 Model quality checking: `model_quality_check.py`

This script evaluates:

- MAE
- RMSE
- MAPE
- Direction accuracy

It also checks if top recommendation stocks perform better than the full universe average.

## 12. How the Frontend Works

### 12.1 Routing in `App.js`

The app uses React Router.

Routes:

- `/login`
- `/register`
- `/`
- `/prediction`
- `/recommend`
- `/charts`
- `/history`
- `/contact`

If there is no token in localStorage, protected pages redirect to Login.

### 12.2 API helper: `services/api.js`

This file builds the backend URL.

It helps the frontend work with either:

- local backend,
- or another backend URL through environment variable.

### 12.3 Shared layout components

#### Navbar

- Shows logo and user profile.
- Fetches current user details from `/me`.
- Has logout button.

#### Sidebar

- Shows navigation links.
- Used across protected pages.

## 13. Frontend Pages Explained

### 13.1 Login page

Purpose:

- user login.

Flow:

1. User enters email and password.
2. Frontend sends request to `/login`.
3. If login succeeds, token is saved in localStorage.
4. User is redirected to dashboard.

### 13.2 Register page

Purpose:

- create a new user account.

Fields:

- name
- email
- phone
- password

### 13.3 Dashboard page

Purpose:

- main home screen after login.

It contains cards for:

- stock prediction,
- top recommendations,
- market charts,
- prediction history.

### 13.4 Prediction page

Purpose:

- predict one stock.

Flow:

1. User enters ticker.
2. Frontend sends token and ticker to `/predict`.
3. Backend returns current price, predicted price, and expected return.
4. Frontend displays result in cards.
5. User can refresh live price.

### 13.5 Recommendations page

Purpose:

- show the top 5 AI-ranked stocks.

It displays:

- rank,
- stock name,
- live price,
- predicted price,
- expected return,
- potential upside,
- confidence score,
- risk level,
- signal.

It auto-refreshes every 30 seconds.

### 13.6 Charts page

Purpose:

- show historical stock movement.

Features:

- ticker input,
- period selector,
- line chart,
- summary cards.

### 13.7 History page

Purpose:

- show previous predictions made by the logged-in user.

It shows:

- total predictions,
- average return,
- latest stock,
- line chart comparing live and predicted prices,
- prediction table.

### 13.8 Contact page

Purpose:

- store user feedback or message in MongoDB.

Fields:

- name
- email
- phone
- message

## 14. User Journey Example

Here is how a demo user can use the app:

1. Open the app.
2. Register a new account.
3. Log in.
4. Reach the dashboard.
5. Open Prediction page.
6. Enter RELIANCE.
7. Get current price and 30-day predicted price.
8. Open History page to see saved prediction.
9. Open Recommendations page to see top AI picks.
10. Open Charts page to study the stock trend.
11. Use Contact page to send feedback.

## 15. Important Concepts to Explain in Presentation

### LSTM

LSTM stands for Long Short-Term Memory.

It is used for time-series prediction because it can remember patterns from previous days.

### SMA20 and SMA50

- SMA20 is the average closing price of the last 20 days.
- SMA50 is the average closing price of the last 50 days.

These show short-term and medium-term trend direction.

### RSI

RSI means Relative Strength Index.

It shows whether a stock is overbought or oversold.

### JWT

JWT is a token-based authentication method.

It keeps the user logged in without storing session data on the server in a traditional way.

### MongoDB

MongoDB stores users, prediction history, and contact messages in document form.

### Caching

Caching is used to reduce repeated API calls and improve speed.

## 16. Strengths of the Project

- Full-stack project with frontend and backend.
- Real-time and historical stock data.
- AI-based prediction model.
- User authentication and history tracking.
- Live recommendation system.
- Clean and modern dashboard UI.

## 17. Limitations of the Project

- Prediction accuracy is not guaranteed because stock markets are volatile.
- The model uses only a few technical indicators.
- Recommendations are limited to a fixed stock list.
- Real-time data depends on external APIs like NSE and yfinance.
- The model is trained for 30-day prediction only.

## 18. Future Scope

Possible improvements:

1. Add more features like volume, sentiment, and fundamentals.
2. Use advanced models like Transformer or Prophet.
3. Add portfolio tracking.
4. Add alerts and notifications.
5. Deploy on cloud with continuous updates.
6. Add better backtesting and confidence intervals.

## 19. Short Presentation Script

You can say this in class:

"My project is an AI-powered stock prediction system. It uses Flask, React, MongoDB, and an LSTM deep learning model. The system first collects stock data, calculates technical indicators like SMA20, SMA50, and RSI, and then trains the LSTM model to predict stock prices 30 days ahead. The frontend lets users log in, predict a stock, view recommendations, see charts, and track prediction history. The backend handles authentication, live price fetching, prediction storage, and recommendation ranking."

## 20. Viva Questions and Answers

### 1. What is the main purpose of this project?

To predict stock prices and provide AI-based recommendations through a web application.

### 2. Why did you use LSTM?

Because LSTM is suitable for time-series data and can learn patterns from previous stock prices.

### 3. What features are used in prediction?

Close price, SMA20, SMA50, and RSI.

### 4. What is SMA20?

It is the 20-day simple moving average of the closing price.

### 5. What is SMA50?

It is the 50-day simple moving average of the closing price.

### 6. What is RSI?

Relative Strength Index, which helps identify overbought or oversold conditions.

### 7. Why do you use JWT?

To secure user login and protect private routes.

### 8. Why is MongoDB used?

To store user accounts, prediction history, and contact messages.

### 9. What is the use of `feature_scaler.save`?

It stores the MinMaxScaler used for input features during training.

### 10. What is the use of `target_scaler.save`?

It stores the scaler used for the output target values.

### 11. Why are scalers saved separately?

Because the same scaling must be used during both training and inference.

### 12. Why do you use a 60-day sequence?

It gives the model enough past information to learn recent trends.

### 13. Why is the target 30 days ahead?

Because the project is designed to predict medium-term future price movement.

### 14. How do you get live stock price?

The backend tries NSE API first, then yfinance, and finally dataset fallback.

### 15. Why do you cache the live price and recommendations?

To reduce repeated API calls and make the app faster.

### 16. How is expected return calculated?

By comparing predicted price with current price and converting it into percentage.

### 17. What happens if the user is not logged in?

Protected pages send the user to the login page.

### 18. What is the role of the recommendation engine?

It ranks stocks based on predicted return, confidence, and risk.

### 19. What is the difference between prediction and recommendation?

Prediction is for one specific stock. Recommendation is a ranked list of top stocks.

### 20. What are the future improvements for this project?

Add more features, improve model accuracy, support more stocks, and deploy it in the cloud.

## 21. Final Conclusion

This project is a strong final-year project because it combines:

- machine learning,
- stock market analysis,
- secure authentication,
- database storage,
- and a clean frontend dashboard.

It shows both technical depth and practical application.