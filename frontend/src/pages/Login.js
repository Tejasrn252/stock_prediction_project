import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../services/api";

function Login() {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const login = async () => {

    const res = await fetch(apiUrl("/login"),{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ email,password })
    })

    const data = await res.json()

    if(data.token){
      localStorage.setItem("token",data.token)
      if(data.name){
        localStorage.setItem("user_name", data.name)
      }
      window.location.href="/"
    }else{
      alert("Login failed")
    }

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6">

      <div className="bg-white/95 border border-slate-200 p-10 rounded-3xl shadow-2xl w-full max-w-md elevated-card">

        <p className="text-xs uppercase tracking-[0.25em] text-emerald-600 font-bold mb-2">Welcome Back</p>

        <h1 className="text-3xl font-black mb-2 text-slate-900">Login</h1>

        <p className="text-slate-500 mb-6">Access your live recommendations and prediction history.</p>

        <input
        placeholder="Email"
        className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300"
        onChange={(e)=>setEmail(e.target.value)}
        />

        <input
        type="password"
        placeholder="Password"
        className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300"
        onChange={(e)=>setPassword(e.target.value)}
        />

        <button
        onClick={login}
        className="bg-emerald-500 hover:bg-emerald-600 text-white w-full py-3 rounded-xl font-semibold transition">
        Login
        </button>

        <p className="mt-5 text-sm text-slate-600">
          No account? <Link to="/register" className="text-emerald-600 font-semibold">Register</Link>
        </p>

      </div>

    </div>
  )
}

export default Login