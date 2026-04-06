import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaSearchDollar, FaStar, FaChartLine, FaHistory } from "react-icons/fa";
import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="flex app-shell">

      <Sidebar />

      <main className="flex-1 min-h-screen">

        <Navbar />

        <div className="p-10">

          <div className="rounded-3xl bg-white/90 border border-slate-200 p-8 mb-8 elevated-card">
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-600 font-bold mb-3">
              Welcome Back
            </p>
            <h1 className="text-4xl font-black text-slate-900 leading-tight">
              Build Smarter Positions with
              <span className="text-emerald-600"> AI Signal Flow</span>
            </h1>
            <p className="text-slate-600 mt-4 max-w-3xl">
              Track live prices, ranked recommendations, and your personal prediction history from one unified investing workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 elevated-card">
              <p className="text-sm text-slate-500">Engine Status</p>
              <p className="text-3xl font-black text-emerald-600 mt-2">Live</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 elevated-card">
              <p className="text-sm text-slate-500">Recommendation Mode</p>
              <p className="text-3xl font-black text-slate-900 mt-2">Realtime</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 elevated-card">
              <p className="text-sm text-slate-500">Portfolio Intelligence</p>
              <p className="text-3xl font-black text-blue-600 mt-2">AI-Powered</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 text-slate-800">
            Explore Tools
          </h2>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Stock Prediction */}
            <Link to="/prediction" className="bg-white p-7 rounded-2xl shadow border border-slate-200 hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-emerald-500 block elevated-card">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-green-500 text-2xl">
                  <FaSearchDollar />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Stock Prediction
                </h2>

              </div>

              <p className="text-slate-500">
                Predict 30-day stock prices using AI model
              </p>

            </Link>


            {/* Top Recommendations */}
            <Link to="/recommend" className="bg-white p-7 rounded-2xl shadow border border-slate-200 hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-blue-500 block elevated-card">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-blue-500 text-2xl">
                  <FaStar />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Top Recommendations
                </h2>

              </div>

              <p className="text-slate-500">
                Discover AI selected top performing stocks
              </p>

            </Link>


            {/* Market Charts */}
            <Link to="/charts" className="bg-white p-7 rounded-2xl shadow border border-slate-200 hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-indigo-500 block elevated-card">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-purple-500 text-2xl">
                  <FaChartLine />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Market Charts
                </h2>

              </div>

              <p className="text-slate-500">
                Visual stock analysis and trends
              </p>

            </Link>

            <Link to="/history" className="bg-white p-7 rounded-2xl shadow border border-slate-200 hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-amber-500 block elevated-card">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-amber-500 text-2xl">
                  <FaHistory />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Prediction History
                </h2>

              </div>

              <p className="text-slate-500">
                Review your historical predictions, live prices, and return trends.
              </p>

            </Link>

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;