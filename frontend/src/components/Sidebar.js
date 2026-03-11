import React from "react";
import { FaChartLine, FaSearchDollar, FaStar, FaChartBar } from "react-icons/fa";

function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white h-screen p-6">

      <h1 className="text-2xl font-bold text-green-400 mb-12">
        StockAI
      </h1>

      <nav className="space-y-8">

        <a href="/" className="flex items-center gap-3 hover:text-green-400 transition">
          <FaChartLine />
          Dashboard
        </a>

        <a href="/prediction" className="flex items-center gap-3 hover:text-green-400 transition">
          <FaSearchDollar />
          Stock Prediction
        </a>

        <a href="/recommend" className="flex items-center gap-3 hover:text-green-400 transition">
          <FaStar />
          Top Picks
        </a>

        <a href="/charts" className="flex items-center gap-3 hover:text-green-400 transition">
          <FaChartBar />
          Charts
        </a>

      </nav>
    </div>
  );
}

export default Sidebar;