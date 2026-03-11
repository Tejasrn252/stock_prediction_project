import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

function Prediction() {

  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const predictStock = async () => {

    if (!ticker) return;

    setLoading(true);

    try {

      const token = localStorage.getItem("token");

      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          ticker: ticker.toUpperCase() + ".NS"
        })
      });

      const data = await response.json();

      setResult(data);

    } catch (error) {
      console.error(error);
    }

    setLoading(false);

  };

  const isProfit = result && result.expected_return_percent > 0;

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        <Navbar />

        <div className="p-10">

          <h1 className="text-3xl font-bold mb-8">
            Stock Prediction
          </h1>

          {/* Search Box */}

          <div className="bg-white p-8 rounded-xl shadow w-96">

            <input
              type="text"
              placeholder="Enter stock (RELIANCE, TCS)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="border p-3 w-full rounded-lg mb-4"
            />

            <button
              onClick={predictStock}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 w-full transition"
            >
              Predict
            </button>

          </div>

          {/* Loading */}

          {loading && (
            <p className="mt-6 text-gray-500 animate-pulse">
              Running AI prediction...
            </p>
          )}

          {/* Results */}

          {result && (

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-3 gap-8 mt-10"
            >

              {/* Current Price */}

              <div className="bg-white p-7 rounded-xl shadow hover:shadow-xl transition">

                <h2 className="text-gray-500 mb-2">
                  Current Price
                </h2>

                <p className="text-3xl font-bold text-gray-800">
                  ₹ {result.current_price.toFixed(2)}
                </p>

              </div>


              {/* Predicted Price */}

              <div className="bg-white p-7 rounded-xl shadow hover:shadow-xl transition">

                <h2 className="text-gray-500 mb-2">
                  Predicted Price (30d)
                </h2>

                <p className="text-3xl font-bold text-blue-600">
                  ₹ {result.predicted_price_30d.toFixed(2)}
                </p>

              </div>


              {/* Expected Return */}

              <div className="bg-white p-7 rounded-xl shadow hover:shadow-xl transition">

                <h2 className="text-gray-500 mb-2">
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

      </div>

    </div>
  );
}

export default Prediction;