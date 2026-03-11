# 📈 AI Stock Prediction System

A **Full-Stack AI Web Application** that predicts stock prices using a **Deep Learning LSTM model** and provides **Top AI Stock Recommendations**.

This project combines **Machine Learning + Web Development** to create a modern stock analytics dashboard.

---

## 🚀 Features

* 🔐 User Authentication (JWT)
* 📊 Stock Price Prediction using LSTM
* 🤖 AI Top 5 Stock Recommendations
* 📈 Interactive Dashboard
* 📉 Expected Return Calculation
* 💾 Prediction History stored in MongoDB

---

## 🛠 Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Chart.js

### Backend

* Flask (Python)
* MongoDB
* JWT Authentication

### Machine Learning

* TensorFlow / Keras
* LSTM Neural Network
* Scikit-learn
* yFinance API

---

## 📂 Project Structure

```
stock_prediction_project
│
├── backend
│   ├── app.py
│   ├── recommendation_engine.py
│   ├── train_lstm.py
│   ├── feature_scaler.save
│   ├── target_scaler.save
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   └── services
│   ├── package.json
│
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```
git clone https://github.com/Tejasrn252/stock_prediction_project.git
cd stock_prediction_project
```

---

### 2️⃣ Backend Setup

```
cd backend
pip install -r requirements.txt
python app.py
```

Backend will run on:

```
http://127.0.0.1:5000
```

---

### 3️⃣ Frontend Setup

```
cd frontend
npm install
npm start
```

Frontend will run on:

```
http://localhost:3000
```

---

## 🤖 Machine Learning Model

The system uses a **Long Short-Term Memory (LSTM) neural network** to predict future stock prices based on:

* Closing price
* 20-day moving average
* 50-day moving average
* Relative Strength Index (RSI)

The model predicts **future price trends and expected returns**.

---

## 📊 Example Workflow

1. User logs into the dashboard
2. Searches a stock ticker (e.g., `RELIANCE.NS`)
3. AI model predicts future price
4. System calculates expected return
5. Recommendation engine ranks **Top 5 stocks**

---

## 📌 Future Improvements

* Real-time stock streaming
* Portfolio tracking
* Advanced ML models (Transformer / Prophet)
* Cloud deployment

---

## 👨‍💻 Author

**Tejas R N**

GitHub
https://github.com/Tejasrn252

---

## ⭐ If you like this project

Give it a **star ⭐ on GitHub**.
