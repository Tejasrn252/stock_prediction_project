import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Prediction from "./pages/Prediction";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recommendations from "./pages/Recommendations";
import Charts from "./pages/Charts";
import History from "./pages/History";
import Contact from "./pages/Contact";

function App() {

  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={token ? <Dashboard /> : <Login />} />
        <Route path="/prediction" element={token ? <Prediction /> : <Login />} />
        <Route path="/recommend" element={token ? <Recommendations /> : <Login />} />
        <Route path="/charts" element={token ? <Charts /> : <Login />} />
        <Route path="/history" element={token ? <History /> : <Login />} />
        <Route path="/contact" element={token ? <Contact /> : <Login />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;