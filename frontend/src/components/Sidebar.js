import React from "react";
import { FaChartLine, FaSearchDollar, FaStar, FaChartBar, FaHistory, FaEnvelope } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const navBase = "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200";

const navStyle = ({ isActive }) =>
  `${navBase} ${isActive ? "bg-emerald-500/20 text-emerald-300 shadow-sm" : "text-slate-200 hover:bg-white/10 hover:text-white"}`;

function Sidebar() {
  return (
    <aside className="w-72 bg-gradient-to-b from-slate-950 to-slate-900 text-white min-h-screen p-6 sticky top-0">

      <div className="mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center overflow-hidden">
            <img
              src="/logo192.png"
              alt="StockAI Symbol"
              className="w-8 h-8 object-contain"
            />
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tight text-emerald-400 leading-none">StockAI</h1>
            <p className="text-slate-400 text-sm mt-1">Smart investing dashboard</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">

        <NavLink to="/" className={navStyle}>
          <FaChartLine />
          Dashboard
        </NavLink>

        <NavLink to="/prediction" className={navStyle}>
          <FaSearchDollar />
          Stock Prediction
        </NavLink>

        <NavLink to="/recommend" className={navStyle}>
          <FaStar />
          Top Picks
        </NavLink>

        <NavLink to="/charts" className={navStyle}>
          <FaChartBar />
          Charts
        </NavLink>

        <NavLink to="/history" className={navStyle}>
          <FaHistory />
          Prediction History
        </NavLink>

        <NavLink to="/contact" className={navStyle}>
          <FaEnvelope />
          Contact Us
        </NavLink>

      </nav>

      <div className="mt-10 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Realtime</p>
        <p className="text-sm text-slate-200 mt-2">Live signals and AI-ranked opportunities refresh automatically.</p>
      </div>
    </aside>
  );
}

export default Sidebar;