import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaSearchDollar, FaStar, FaChartLine } from "react-icons/fa";

function Dashboard() {
  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 bg-gray-100 min-h-screen">

        <Navbar />

        <div className="p-10">

          <h1 className="text-3xl font-bold mb-10 text-gray-800">
            Dashboard
          </h1>

          <div className="grid grid-cols-3 gap-8">

            {/* Stock Prediction */}
            <div className="bg-white p-7 rounded-xl shadow hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-green-500">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-green-500 text-2xl">
                  <FaSearchDollar />
                </div>

                <h2 className="text-xl font-semibold">
                  Stock Prediction
                </h2>

              </div>

              <p className="text-gray-500">
                Predict 30-day stock prices using AI model
              </p>

            </div>


            {/* Top Recommendations */}
            <div className="bg-white p-7 rounded-xl shadow hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-blue-500">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-blue-500 text-2xl">
                  <FaStar />
                </div>

                <h2 className="text-xl font-semibold">
                  Top Recommendations
                </h2>

              </div>

              <p className="text-gray-500">
                Discover AI selected top performing stocks
              </p>

            </div>


            {/* Market Charts */}
            <div className="bg-white p-7 rounded-xl shadow hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer border-l-4 border-purple-500">

              <div className="flex items-center gap-4 mb-4">

                <div className="text-purple-500 text-2xl">
                  <FaChartLine />
                </div>

                <h2 className="text-xl font-semibold">
                  Market Charts
                </h2>

              </div>

              <p className="text-gray-500">
                Visual stock analysis and trends
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;