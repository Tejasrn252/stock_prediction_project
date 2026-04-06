import React, { useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { apiUrl } from "../services/api";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const canSubmit = useMemo(() => {
    return !!name.trim() && !!email.trim() && !!phone.trim() && !!message.trim();
  }, [name, email, phone, message]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      setStatus({ type: "error", text: "Please fill all fields before submitting." });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus({ type: "error", text: "Please login first to submit contact details." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch(apiUrl("/contact"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setStatus({ type: "error", text: data.error || "Failed to submit. Please try again." });
      } else {
        setStatus({ type: "success", text: "Submitted successfully. Our team will contact you soon." });
        resetForm();
      }
    } catch (error) {
      setStatus({ type: "error", text: "Unable to reach backend. Please check server status." });
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <Sidebar />

      <div className="flex-1 min-h-screen">
        <Navbar />

        <div className="p-8 lg:p-10">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 mb-8 elevated-card">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-600 font-semibold mb-2">Support Desk</p>
            <h1 className="text-4xl font-black text-slate-900">Contact Us</h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Share your feedback, issue, or partnership request. We store your message securely and get back quickly.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm elevated-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Tell us how we can help..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-white font-semibold hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <FaPaperPlane />
                {loading ? "Submitting..." : "Submit Message"}
              </button>

              {status.text && (
                <div
                  className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
                    status.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}
                >
                  {status.type === "success" && <FaCheckCircle className="inline mr-2" />}
                  {status.text}
                </div>
              )}
            </form>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-7 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Why Contact?</p>
              <h2 className="text-2xl font-black mt-3">We are listening.</h2>
              <p className="text-slate-300 mt-3 leading-relaxed">
                Use this form for feature requests, account support, data correction requests, or business queries.
              </p>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                  <p className="text-emerald-300 text-xs uppercase tracking-wider">Response Window</p>
                  <p className="text-white font-semibold mt-1">Usually within 24 hours</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
                  <p className="text-emerald-300 text-xs uppercase tracking-wider">Data Safety</p>
                  <p className="text-white font-semibold mt-1">Stored securely in your backend database</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
