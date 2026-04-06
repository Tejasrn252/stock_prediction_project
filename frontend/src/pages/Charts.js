import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController
} from "chart.js";
import { Line } from "react-chartjs-2";
import { apiUrl } from "../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController
);

function Charts() {

  const [ticker,setTicker] = useState("");
  const [period, setPeriod] = useState("6mo");
  const [chartData,setChartData] = useState(null);
  const [summary,setSummary] = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  const periods = [
    { value: "1mo", label: "1M" },
    { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "2y", label: "2Y" },
    { value: "3y", label: "3Y" },
    { value: "5y", label: "5Y" },
    { value: "all", label: "ALL" }
  ];

  const loadChart = async () => {

    if (!ticker.trim()) {
      setError("Please enter a stock symbol.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login first to view charts.");
        setLoading(false);
        return;
      }

      const encodedTicker = encodeURIComponent(ticker.trim());
      const response = await fetch(
        apiUrl("/chart?ticker=") + encodedTicker + "&period=" + period,
        {
          headers: {
            Authorization: "Bearer " + token
          }
        }
      );

      const data = await response.json();

      if (!response.ok || data.error || !data.labels?.length || !data.prices?.length) {
        setError(data.error || "No chart data found for this stock.");
        setLoading(false);
        return;
      }

      const labels = data.labels.map((item) =>
        new Date(item).toLocaleDateString()
      );

      setChartData({
        labels: labels,
        datasets: [
          {
            label: data.ticker + " Price",
            data: data.prices,
            borderColor: "rgb(22,163,74)",
            backgroundColor: "rgba(22,163,74,0.18)",
            tension: 0.3,
            fill: true
          }
        ]
      });

      setSummary(data.summary || null);
    } catch (requestError) {
      setError("Unable to load chart data. Please try again.");
    }

    setLoading(false);

  };

  return (
    <div className="flex app-shell">

      <Sidebar/>

      <main className="flex-1 min-h-screen">

        <Navbar/>

        <div className="p-10">

          <div className="rounded-3xl bg-white/90 border border-slate-200 p-8 mb-8 elevated-card">
            <p className="text-sm uppercase tracking-[0.26em] text-indigo-600 font-bold mb-3">Market Visualizer</p>
            <h1 className="text-4xl font-black text-slate-900">Interactive Stock Chart</h1>
            <p className="text-slate-500 mt-3">Track recent movement quickly and compare trends before placing prediction bets.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow w-full max-w-xl mb-8 elevated-card">

            <input
              placeholder="Enter stock (RELIANCE, TCS)"
              value={ticker}
              onChange={(e)=>setTicker(e.target.value)}
              className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <div className="flex flex-wrap gap-2 mb-4">
              {periods.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPeriod(item.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    period === item.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadChart}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl w-full hover:bg-indigo-700 transition font-semibold"
            >
              {loading ? "Loading..." : "Load Chart"}
            </button>

            {error && (
              <p className="mt-4 text-rose-600 font-medium">{error}</p>
            )}

          </div>

          {chartData && (
            <>
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow elevated-card">
                    <p className="text-sm text-slate-500">Current Price</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">₹ {Number(summary.current_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow elevated-card">
                    <p className="text-sm text-slate-500">Start Price</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">₹ {Number(summary.start_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow elevated-card">
                    <p className="text-sm text-slate-500">Period Return</p>
                    <p className={`text-2xl font-black mt-1 ${Number(summary.change_percent) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {Number(summary.change_percent).toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow elevated-card">
                <Line data={chartData}/>
              </div>
            </>
          )}

        </div>

      </main>

    </div>
  );
}

export default Charts;