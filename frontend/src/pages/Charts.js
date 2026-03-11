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

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  LineController
);

function Charts() {

  const [ticker,setTicker] = useState("");
  const [chartData,setChartData] = useState(null);

  const loadChart = async () => {

    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/" + ticker + ".NS"
    );

    const data = await response.json();

    const prices = data.chart.result[0].indicators.quote[0].close;
    const timestamps = data.chart.result[0].timestamp;

    const labels = timestamps.map(t =>
      new Date(t * 1000).toLocaleDateString()
    );

    setChartData({
      labels: labels,
      datasets: [
        {
          label: ticker + " Price",
          data: prices,
          borderColor: "rgb(34,197,94)",
          backgroundColor: "rgba(34,197,94,0.2)"
        }
      ]
    });

  };

  return (
    <div className="flex">

      <Sidebar/>

      <div className="flex-1 bg-gray-100 min-h-screen">

        <Navbar/>

        <div className="p-10">

          <h1 className="text-3xl font-bold mb-6">
            Stock Chart
          </h1>

          <div className="bg-white p-6 rounded-xl shadow w-96 mb-8">

            <input
              placeholder="Enter stock (RELIANCE, TCS)"
              value={ticker}
              onChange={(e)=>setTicker(e.target.value)}
              className="border p-3 w-full mb-4 rounded"
            />

            <button
              onClick={loadChart}
              className="bg-green-500 text-white px-6 py-3 rounded w-full"
            >
              Load Chart
            </button>

          </div>

          {chartData && (
            <div className="bg-white p-6 rounded-xl shadow">
              <Line data={chartData}/>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default Charts;