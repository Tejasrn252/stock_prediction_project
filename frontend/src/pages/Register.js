import React,{useState} from "react"

function Register(){

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [password,setPassword]=useState("")

const register = async()=>{

await fetch("http://127.0.0.1:5000/register",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({ name,email,password })
})

alert("Registered successfully")
window.location.href="/login"

}

return(

<div className="flex items-center justify-center h-screen bg-gray-100">

<div className="bg-white p-10 rounded-xl shadow w-96">

<h1 className="text-2xl font-bold mb-6">Register</h1>

<input
placeholder="Name"
className="border p-3 w-full mb-4 rounded"
onChange={(e)=>setName(e.target.value)}
/>

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
onClick={register}
className="bg-green-500 text-white w-full py-3 rounded">
Register
</button>

</div>

</div>

)

}

export default Register