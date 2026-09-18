import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: ""
  });
  const [message, setMessage] = useState("");

  const placeOrder = async (event) => {
    event.preventDefault();
    const payload = {
      customerName: form.name,
      shippingEmail: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      paymentMethod: "demo",
      items: items.map((item) => ({ product: item._id, quantity: item.quantity }))
    };
    await api.post("/orders", payload);
    clearCart();
    setMessage("Order placed successfully.");
    setTimeout(() => navigate("/dashboard"), 700);
  };

  return (
    <section className="mx-auto w-[min(760px,calc(100%_-_40px))] py-16">
      <div className="mb-7">
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Demo payment</span>
        <h1 className="text-4xl font-black md:text-5xl">Checkout</h1>
      </div>
      <form className="grid gap-4 rounded-lg border border-line bg-white p-7 shadow-soft" onSubmit={placeOrder}>
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-green-700">{message}</p>}
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="email" placeholder="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="tel" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
        <textarea className="min-h-24 rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
          <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Postal code" value={form.postalCode} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} required />
        </div>
        <div className="flex justify-between"><span>Items</span><strong>{items.length}</strong></div>
        <div className="flex justify-between"><span>Total</span><strong>₹{total}</strong></div>
        <button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!items.length}>Place order</button>
      </form>
    </section>
  );
}
