import React from "react";

function Navbar() {

  const logout = () => {

    // remove token
    localStorage.removeItem("token");

    // redirect to login page
    window.location.href = "/login";
  };

  return (

    <div className="flex justify-between items-center bg-white shadow px-8 py-4">

      <h1 className="text-xl font-semibold">
        AI Stock Prediction
      </h1>

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2">

          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
            U
          </div>

          <span className="text-gray-700">
            User
          </span>

        </div>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>

      </div>

    </div>

  );
}

export default Navbar;