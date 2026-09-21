import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import api from "../api/axios.js";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submitContactForm = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      await api.post("/issues", form);
      setForm({ name: "", email: "", message: "" });
      setStatus({ type: "success", message: "Your message was sent to the admin team." });
    } catch (error) {
      setStatus({ type: "error", message: error.response?.data?.message || "Your message could not be sent. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto grid w-[min(1180px,calc(100%_-_40px))] gap-9 py-16 lg:grid-cols-2">
      <div>
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Contact</span>
        <h1 className="mb-5 text-4xl font-black leading-tight md:text-6xl">Talk to TechReads</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">Questions about products, admin publishing, or bulk learning material? Send us a note.</p>
        <div className="mt-6 grid gap-3">
          <p className="flex items-center gap-3 text-slate-600"><Mail size={18} /> support@techreads.example</p>
          <p className="flex items-center gap-3 text-slate-600"><Phone size={18} /> +91 90000 00000</p>
          <p className="flex items-center gap-3 text-slate-600"><MapPin size={18} /> Bengaluru, India</p>
        </div>
      </div>
      <form onSubmit={submitContactForm} className="grid gap-4 rounded-lg border border-line bg-white p-7 shadow-soft">
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <textarea className="min-h-32 rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required />
        {status.message && <p className={`text-sm font-medium ${status.type === "success" ? "text-green-700" : "text-red-600"}`} role="status">{status.message}</p>}
        <button type="submit" disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Sending..." : "Send message"}</button>
      </form>
    </section>
  );
}
