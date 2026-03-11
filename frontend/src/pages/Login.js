import React, { useState } from "react";

function Login() {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const login = async () => {

    const res = await fetch("http://127.0.0.1:5000/login",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ email,password })
    })

    const data = await res.json()

    if(data.token){
      localStorage.setItem("token",data.token)
      window.location.href="/"
    }else{
      alert("Login failed")
    }

  }

  return(

    <div className="flex items-center justify-center h-screen bg-gray-100">

      <div className="bg-white p-10 rounded-xl shadow w-96">

        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <input
        placeholder="Email"
        className="border p-3 w-full mb-4 rounded"
        onChange={(e)=>setEmail(e.target.value)}
        />

        <input
        type="password"
        placeholder="Password"
        className="border p-3 w-full mb-4 rounded"
        onChange={(e)=>setPassword(e.target.value)}
        />

        <button
        onClick={login}
        className="bg-green-500 text-white w-full py-3 rounded">
        Login
        </button>

        <p className="mt-4 text-sm">
          No account? <a href="/register" className="text-green-600">Register</a>
        </p>

      </div>

    </div>
  )
}

export default Login