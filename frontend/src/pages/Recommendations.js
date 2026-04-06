import React,{useEffect,useState} from "react"
import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"
import { apiUrl } from "../services/api"

function Recommendations(){

const [stocks,setStocks]=useState([])
const [loading,setLoading]=useState(true)
const [error,setError]=useState("")
const [lastUpdated, setLastUpdated] = useState("")

useEffect(()=>{

const fetchData = async(isBackgroundRefresh = false)=>{

try{

const token = localStorage.getItem("token")

if(!token){
setError("Please login first to see recommendations.")
setLoading(false)
return
}

if(!isBackgroundRefresh){
setLoading(true)
}

const res = await fetch(apiUrl("/recommend"),{
headers:{
Authorization:"Bearer "+token
}
})

const data = await res.json()

if(!res.ok || data.error){
setError(data.error || "Failed to load recommendations")
setStocks([])
}else{
setStocks((data.top_recommendations || []).slice(0,5))
setError("")
const serverTime = data.top_recommendations?.[0]?.as_of
setLastUpdated(serverTime ? new Date(serverTime).toLocaleTimeString() : new Date().toLocaleTimeString())
}

}catch(e){
setError("Unable to reach backend. Please check server status.")
setStocks([])
}

setLoading(false)

}

fetchData()

const refreshTimer = setInterval(() => {
fetchData(true)
}, 30000)

return () => clearInterval(refreshTimer)

},[])

const signalClass = (signal) => {
if(signal === "Strong Buy") return "bg-emerald-100 text-emerald-700"
if(signal === "Buy") return "bg-blue-100 text-blue-700"
if(signal === "Accumulate") return "bg-amber-100 text-amber-700"
return "bg-slate-100 text-slate-700"
}

const riskClass = (risk) => {
if(risk === "Low") return "bg-emerald-50 text-emerald-700"
if(risk === "Medium") return "bg-amber-50 text-amber-700"
return "bg-rose-50 text-rose-700"
}

const refreshNow = () => {
setLoading(true)
setError("")
const token = localStorage.getItem("token")
if(!token){
setError("Please login first to see recommendations.")
setLoading(false)
return
}

fetch(apiUrl("/recommend"),{
headers:{ Authorization:"Bearer "+token }
})
.then((res)=>res.json().then((data)=>({ok:res.ok,data})))
.then(({ok,data})=>{
if(!ok || data.error){
setError(data.error || "Failed to load recommendations")
setStocks([])
}else{
setStocks((data.top_recommendations || []).slice(0,5))
const serverTime = data.top_recommendations?.[0]?.as_of
setLastUpdated(serverTime ? new Date(serverTime).toLocaleTimeString() : new Date().toLocaleTimeString())
}
})
.catch(()=>{
setError("Unable to reach backend. Please check server status.")
setStocks([])
})
.finally(()=>setLoading(false))
}

return(

<div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">

<Sidebar/>

<div className="flex-1 min-h-screen">

<Navbar/>

<div className="p-10">

<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
<div>
<p className="text-sm uppercase tracking-[0.25em] text-blue-600 font-semibold mb-2">Live Engine</p>
<h1 className="text-4xl font-black text-slate-900">Top 5 AI Recommendations</h1>
<p className="text-slate-500 mt-2">Ranked using model output, live market price, confidence, and risk profile.</p>
</div>

<div className="flex items-center gap-3">
<p className="text-sm text-slate-500">Updated: {lastUpdated || "--"}</p>
<button
onClick={refreshNow}
className="bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition"
>
Refresh
</button>
</div>
</div>

{loading && (
<p className="text-slate-500 mb-6 animate-pulse">Loading top recommendations...</p>
)}

{error && (
<p className="text-red-600 font-medium mb-6">{error}</p>
)}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

{stocks.map((s,i)=>(
<div key={i} className="bg-white p-6 rounded-2xl shadow border border-slate-200 hover:shadow-lg transition">

<div className="flex items-center justify-between mb-4">
<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rank #{s.rank || i + 1}</p>
<span className={`text-xs px-3 py-1 rounded-full font-semibold ${signalClass(s.signal)}`}>
{s.signal || "Watch"}
</span>
</div>

<h2 className="text-2xl font-bold text-slate-900">
{s.stock_name || s.symbol || s.ticker}
</h2>

<p className="text-sm text-slate-500 mb-4">{s.symbol || s.ticker}</p>

<div className="grid grid-cols-2 gap-4 mb-4">
<div>
<p className="text-xs text-slate-500">Live Price</p>
<p className="text-lg font-semibold text-slate-900">₹ {Number(s.current_price).toFixed(2)}</p>
</div>

<div>
<p className="text-xs text-slate-500">Predicted Price</p>
<p className="text-lg font-semibold text-blue-700">₹ {Number(s.predicted_price).toFixed(2)}</p>
</div>

<div>
<p className="text-xs text-slate-500">Expected Return</p>
<p className={`text-lg font-bold ${Number(s.expected_return) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
{Number(s.expected_return).toFixed(2)}%
</p>
</div>

<div>
<p className="text-xs text-slate-500">Potential Upside</p>
<p className={`text-lg font-semibold ${Number(s.potential_upside) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
₹ {Number(s.potential_upside || 0).toFixed(2)}
</p>
</div>
</div>

<div className="flex items-center justify-between pt-3 border-t border-slate-100">
<p className="text-sm text-slate-600">Confidence: <span className="font-semibold">{Number(s.confidence_score || 0).toFixed(1)}%</span></p>
<span className={`text-xs px-3 py-1 rounded-full font-semibold ${riskClass(s.risk_level)}`}>{s.risk_level || "Medium"} risk</span>
</div>

</div>
))}

</div>

</div>

</div>

</div>

)

}

export default Recommendations