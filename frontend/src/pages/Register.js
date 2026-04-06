import React,{useState} from "react"
import { Link } from "react-router-dom"
import { apiUrl } from "../services/api";

function Register(){

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [phone,setPhone]=useState("")
const [password,setPassword]=useState("")

const register = async()=>{

	await fetch(apiUrl("/register"),{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({ name,email,phone,password })
})

alert("Registered successfully")
window.location.href="/login"

}

return(

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">

<div className="bg-white/95 border border-slate-200 p-10 rounded-3xl shadow-2xl w-full max-w-md elevated-card">

<p className="text-xs uppercase tracking-[0.25em] text-blue-600 font-bold mb-2">Create Account</p>

<h1 className="text-3xl font-black mb-2 text-slate-900">Register</h1>

<p className="text-slate-500 mb-6">Start tracking AI predictions with live market data.</p>

<input
placeholder="Name"
className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
onChange={(e)=>setName(e.target.value)}
/>

<input
placeholder="Email"
className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
placeholder="Phone Number"
className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
onChange={(e)=>setPhone(e.target.value)}
/>

<input
type="password"
placeholder="Password"
className="border border-slate-300 bg-slate-50 p-3.5 w-full mb-5 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
onChange={(e)=>setPassword(e.target.value)}
/>

<button
onClick={register}
className="bg-blue-600 text-white w-full py-3 rounded-xl hover:bg-blue-700 transition font-semibold">
Register
</button>

<p className="mt-5 text-sm text-slate-600">
	Already have an account? <Link to="/login" className="text-blue-600 font-semibold">Login</Link>
</p>

</div>

</div>

)

}

export default Register