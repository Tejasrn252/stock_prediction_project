import React, { useEffect, useRef, useState } from "react";
import { apiUrl } from "../services/api";

function Navbar() {

  const [profile, setProfile] = useState({
    name: localStorage.getItem("user_name") || "User",
    email: "",
    phone: ""
  });
  const [showProfileCard, setShowProfileCard] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const loadUserName = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(apiUrl("/me"), {
          headers: {
            Authorization: "Bearer " + token
          }
        });

        const data = await response.json();

        if (response.ok) {
          setProfile({
            name: data.name || "User",
            email: data.email || "",
            phone: data.phone || ""
          });
          if (data.name) {
            localStorage.setItem("user_name", data.name);
          }
        }
      } catch (error) {
        // Keep the fallback name if the profile request fails.
      }
    };

    loadUserName();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const userInitial = profile.name ? profile.name.charAt(0).toUpperCase() : "U";

  const logout = () => {

    // remove token
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");

    // redirect to login page
    window.location.href = "/login";
  };

  return (

    <header className="flex justify-between items-center bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4">

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-200 flex items-center justify-center overflow-hidden">
          <img
            src="/logo192.png"
            alt="StockAI Symbol"
            className="w-6 h-6 object-contain"
          />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          StockAI
        </h1>
      </div>

      <div className="flex items-center gap-4">

        <div className="relative" ref={profileRef}>

          <button
            type="button"
            onClick={() => setShowProfileCard((prev) => !prev)}
            className="flex items-center gap-3 rounded-full px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition"
          >

            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold">
              {userInitial}
            </div>

            <span className="text-slate-700 font-semibold">
              {profile.name}
            </span>

          </button>

          {showProfileCard && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">Profile Details</p>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-slate-800 font-semibold">{profile.name || "--"}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-slate-800 font-semibold break-all">{profile.email || "--"}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Phone Number</p>
                  <p className="text-slate-800 font-semibold">{profile.phone || "--"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="bg-rose-500 text-white px-4 py-2 rounded-xl hover:bg-rose-600 transition font-semibold"
        >
          Logout
        </button>

      </div>

    </header>

  );
}

export default Navbar;