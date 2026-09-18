import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../state/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/my-orders").then(({ data }) => setOrders(data)).catch(() => setOrders([]));
  }, []);

  return (
    <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
      <div className="mb-7">
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Account</span>
        <h1 className="text-4xl font-black md:text-5xl">Hello, {user?.name}</h1>
      </div>
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-2xl font-black">My orders</h2>
        {orders.length === 0 ? <p className="text-muted">No orders yet.</p> : orders.map((order) => (
          <div className="grid gap-3 border-t border-line py-4 md:grid-cols-[1fr_auto_auto]" key={order._id}>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            <strong>₹{order.totalPrice}</strong>
            <span>{order.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
