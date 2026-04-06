import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiUrl } from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController
);

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login first to see your prediction history.");
          setLoading(false);
          return;
        }

        const response = await fetch(apiUrl("/history"), {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setError(data.error || "Unable to load prediction history.");
          setHistory([]);
        } else {
          setHistory(data.predictions || []);
        }
      } catch (requestError) {
        setError("Unable to reach backend. Please check server status.");
      }

      setLoading(false);
    };

    loadHistory();
  }, []);

  const summary = useMemo(() => {
    const latest = history[0] || null;
    const averageReturn = history.length
      ? history.reduce((total, item) => total + Number(item.expected_return || 0), 0) / history.length
      : 0;

    return {
      total: history.length,
      latest,
      averageReturn
    };
  }, [history]);

  const chartData = useMemo(() => {
    if (!history.length) {
      return null;
    }

    const latestEntries = history.slice(0, 10).reverse();

    return {
      labels: latestEntries.map((entry) => entry.ticker),
      datasets: [
        {
          label: "Live Price",
          data: latestEntries.map((entry) => entry.current_price),
          borderColor: "rgb(34,197,94)",
          backgroundColor: "rgba(34,197,94,0.15)",
          tension: 0.35,
          fill: true
        },
        {
          label: "Predicted Price",
          data: latestEntries.map((entry) => entry.predicted_price),
          borderColor: "rgb(59,130,246)",
          backgroundColor: "rgba(59,130,246,0.15)",
          tension: 0.35,
          fill: true
        }
      ]
    };
  }, [history]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <div className="p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-600 font-semibold mb-2">
              Personal Activity
            </p>
            <h1 className="text-4xl font-black text-slate-900">
              Prediction History
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Review your last predictions, compare live prices with predicted values, and spot the patterns over time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-6">
              <p className="text-slate-500 text-sm">Total Predictions</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-6">
              <p className="text-slate-500 text-sm">Average Return</p>
              <p className={`mt-2 text-3xl font-black ${summary.averageReturn >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {summary.averageReturn.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-3xl bg-white shadow-sm border border-slate-200 p-6">
              <p className="text-slate-500 text-sm">Latest Stock</p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {summary.latest ? summary.latest.ticker : "-"}
              </p>
            </div>
          </div>

          {loading && (
            <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
              <p className="text-slate-500 animate-pulse">Loading your prediction history...</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-3xl bg-rose-50 border border-rose-200 p-5 text-rose-700 font-medium mb-6">
              {error}
            </div>
          )}

          {!loading && !error && chartData && (
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Live vs Predicted Trend</h2>
                  <p className="text-slate-500 text-sm mt-1">Last 10 predictions</p>
                </div>
              </div>
              <Line data={chartData} />
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-10 text-center mb-8">
              <p className="text-2xl font-bold text-slate-900">No prediction history yet</p>
              <p className="text-slate-500 mt-3 max-w-xl mx-auto">
                Make your first prediction and it will appear here with live price, predicted price, and expected return.
              </p>
            </div>
          )}

          {!loading && !error && (
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Prediction Log</h2>
                <p className="text-slate-500 text-sm mt-1">All records are shown for your current account only.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-4">Ticker</th>
                      <th className="px-6 py-4">Live Price</th>
                      <th className="px-6 py-4">Predicted Price</th>
                      <th className="px-6 py-4">Expected Return</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((item, index) => {
                      const isPositive = Number(item.expected_return || 0) >= 0;

                      return (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{item.ticker}</td>
                          <td className="px-6 py-4 text-slate-700">₹ {Number(item.current_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-slate-700">₹ {Number(item.predicted_price).toFixed(2)}</td>
                          <td className={`px-6 py-4 font-semibold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {Number(item.expected_return).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 text-slate-600">{item.price_source || "-"}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;