import React,{useEffect,useState} from "react"
import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"

function Recommendations(){

const [stocks,setStocks]=useState([])

useEffect(()=>{

const fetchData = async()=>{

const token = localStorage.getItem("token")

const res = await fetch("http://127.0.0.1:5000/recommend",{
headers:{
Authorization:"Bearer "+token
}
})

const data = await res.json()

setStocks(data.top_recommendations)

}

fetchData()

},[])

return(

<div className="flex">

<Sidebar/>

<div className="flex-1 bg-gray-100 min-h-screen">

<Navbar/>

<div className="p-10">

<h1 className="text-3xl font-bold mb-8">
Top AI Recommendations
</h1>

<div className="grid grid-cols-3 gap-6">

{stocks.map((s,i)=>(
<div key={i} className="bg-white p-6 rounded-xl shadow">

<h2 className="text-xl font-bold">
{s.ticker}
</h2>

<p className="text-green-600 text-lg">
{s.expected_return.toFixed(2)} %
</p>

</div>
))}

</div>

</div>

</div>

</div>

)

}

export default Recommendations