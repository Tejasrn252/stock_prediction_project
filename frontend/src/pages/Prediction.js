import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiUrl } from "../services/api";
import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown, FaSyncAlt } from "react-icons/fa";

const PREDICT_ENDPOINTS = [
  apiUrl("/predict"),
  "http://127.0.0.1:5000/predict",
  "http://localhost:5000/predict"
];

const buildPredictPayload = (targetTicker, forceRefresh) => ({
  ticker: targetTicker.toUpperCase() + ".NS",
  refresh_price: forceRefresh
});

const parseResponseSafely = (rawText) => {
  if (!rawText) return {};

  try {
    return JSON.parse(rawText);
  } catch (jsonError) {
    return { error: "Invalid backend response format." };
  }
};

const requestPrediction = async (token, targetTicker, forceRefresh) => {
  const uniqueTargets = [...new Set(PREDICT_ENDPOINTS)];
  let successPayload = null;
  let lastFailureMessage = "";

  for (const endpoint of uniqueTargets) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(buildPredictPayload(targetTicker, forceRefresh))
      });

      const rawText = await response.text();
      const data = parseResponseSafely(rawText);

      if (response.ok && !data.error) {
        successPayload = data;
        break;
      }

      lastFailureMessage = data.error || `Request failed (${response.status})`;

      if (response.status === 401) {
        break;
      }
    } catch (networkError) {
      lastFailureMessage = networkError?.message || `Unable to reach ${endpoint}`;
    }
  }

  return {
    successPayload,
    lastFailureMessage
  };
};

function Prediction() {

  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predictStock = async (forceRefresh = false) => {

    const targetTicker = forceRefresh && result?.ticker
      ? result.ticker.replace(".NS", "")
      : ticker;

    if (!targetTicker) return;

    setLoading(true);
    setError("");
    if (!forceRefresh) {
      setResult(null);
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login first to get predictions.");
      setLoading(false);
      return;
    }

    const { successPayload, lastFailureMessage } = await requestPrediction(
      token,
      targetTicker,
      forceRefresh
    );

    if (!successPayload) {
      setError(lastFailureMessage || "Unable to reach backend. Please check server status.");
    } else {
      setResult(successPayload);
      if (!forceRefresh) {
        setTicker(targetTicker);
      }
    }

    setLoading(false);

  };

  const refreshCurrentPrice = async () => {
    if (!result?.ticker) return;
    await predictStock(true);
  };

  const isProfit = result && result.expected_return_percent > 0;

  return (
    <div className="flex app-shell">

      <Sidebar />

      <main className="flex-1 min-h-screen">

        <Navbar />

        <div className="p-10">

          <div className="rounded-3xl bg-white/90 border border-slate-200 p-8 mb-8 elevated-card">
            <p className="text-sm uppercase tracking-[0.26em] text-emerald-600 font-bold mb-3">Prediction Studio</p>
            <h1 className="text-4xl font-black text-slate-900">Forecast the Next 30 Days</h1>
            <p className="text-slate-500 mt-3">Use live price context with AI model output to evaluate near-term opportunity.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow w-full max-w-xl elevated-card">

            <input
              type="text"
              placeholder="Enter stock (RELIANCE, TCS)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="border border-slate-300 bg-slate-50 p-3.5 w-full rounded-xl mb-4 outline-none focus:ring-2 focus:ring-emerald-400"
            />

            <button
              onClick={() => predictStock(false)}
              className="bg-emerald-500 text-white px-6 py-3.5 rounded-xl hover:bg-emerald-600 w-full transition font-semibold"
            >
              Predict
            </button>

          </div>

          {/* Loading */}

          {loading && (
            <p className="mt-6 text-slate-500 animate-pulse">
              Running AI prediction...
            </p>
          )}

          {error && (
            <p className="mt-6 text-red-600 font-medium">
              {error}
            </p>
          )}

          {/* Results */}

          {result && (

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10"
            >

              {/* Current Price */}

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow hover:shadow-xl transition elevated-card">

                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-slate-500 font-medium">
                    Current Price
                  </h2>

                  <button
                    type="button"
                    onClick={refreshCurrentPrice}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                  >
                    <FaSyncAlt className={loading ? "animate-spin" : ""} />
                    Refresh live price
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-3xl font-bold text-gray-800">
                    ₹ {result.current_price.toFixed(2)}
                  </p>

                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    String(result.price_source || "").toLowerCase() === "nse"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {String(result.price_source || "-").toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>
                    Source: <span className="font-semibold text-slate-700">{String(result.price_source || "-").toUpperCase()}</span>
                  </p>
                  <p>
                    Updated: <span className="font-semibold text-slate-700">
                      {result.current_price_updated_at ? new Date(result.current_price_updated_at).toLocaleString() : "-"}
                    </span>
                  </p>
                </div>

              </div>


              {/* Predicted Price */}

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow hover:shadow-xl transition elevated-card">

                <h2 className="text-slate-500 mb-2 font-medium">
                  Predicted Price (30d)
                </h2>

                <p className="text-3xl font-bold text-blue-600">
                  ₹ {result.predicted_price_30d.toFixed(2)}
                </p>

              </div>


              {/* Expected Return */}

              <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow hover:shadow-xl transition elevated-card">

                <h2 className="text-slate-500 mb-2 font-medium">
                  Expected Return
                </h2>

                <p
                  className={`text-3xl font-bold flex items-center gap-2 ${
                    isProfit ? "text-green-600" : "text-red-600"
                  }`}
                >

                  {isProfit ? <FaArrowUp /> : <FaArrowDown />}

                  {result.expected_return_percent.toFixed(2)} %

                </p>

              </div>

            </motion.div>

          )}

        </div>

      </main>

    </div>
  );
}

export default Prediction;