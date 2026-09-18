import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/axios.js";

const paymentLabel = (status) => {
  if (status === "paid" || status === "delivered") return "Success";
  if (status === "cancelled") return "Failed";
  return "Pending";
};

const paymentClass = (status) => {
  if (status === "Success") return "bg-green-50 text-green-700";
  if (status === "Failed") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
};

export default function AdminDashboard({ view = "dashboard" }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [productRes, orderRes, userRes] = await Promise.all([
        api.get("/products"),
        api.get("/orders"),
        api.get("/auth/users")
      ]);
      setProducts(productRes.data);
      setOrders(orderRes.data);
      setUsers(userRes.data);
    };

    load().catch(() => {});
  }, []);

  const removeProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts(products.filter((product) => product._id !== id));
  };

  const paymentRows = orders.flatMap((order) => order.items.map((item) => ({
    ...item,
    orderId: order._id,
    buyer: order.user?.name || order.shippingEmail || "Customer",
    status: paymentLabel(order.status),
    date: order.createdAt
  })));

  if (view === "users") {
    return (
      <section>
        <PageHeading title="Users" />
        <div className="overflow-x-auto rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-[1fr_1fr_120px_140px] gap-4 border-b border-line pb-3 text-xs font-extrabold uppercase text-muted"><span>Name</span><span>Email</span><span>Role</span><span>Joined</span></div>
            {users.map((user) => <div className="grid grid-cols-[1fr_1fr_120px_140px] gap-4 border-b border-line py-4 text-sm" key={user._id}><strong>{user.name}</strong><span>{user.email}</span><span className="capitalize">{user.role}</span><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>)}
            {!users.length && <p className="py-6 text-muted">No users found.</p>}
          </div>
        </div>
      </section>
    );
  }

  if (view === "payments") {
    return (
      <section>
        <PageHeading title="Payments" />
        <div className="overflow-x-auto rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.4fr_1fr_100px_120px_140px] gap-4 border-b border-line pb-3 text-xs font-extrabold uppercase text-muted"><span>Book</span><span>Buyer</span><span>Qty</span><span>Amount</span><span>Status</span></div>
            {paymentRows.map((payment, index) => <div className="grid grid-cols-[1.4fr_1fr_100px_120px_140px] items-center gap-4 border-b border-line py-4 text-sm" key={`${payment.orderId}-${payment.product}-${index}`}><strong>{payment.title}</strong><span>{payment.buyer}</span><span>{payment.quantity}</span><span>₹{payment.price * payment.quantity}</span><span className={`w-max rounded-md px-3 py-1 text-xs font-extrabold ${paymentClass(payment.status)}`}>{payment.status}</span></div>)}
            {!paymentRows.length && <p className="py-6 text-muted">No payments found.</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PageHeading title={view === "products" ? "All products" : "Dashboard"} />
        <Link to="/admin/add-product" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700"><Plus size={18} /> Add product</Link>
      </div>
      {view === "dashboard" && <div className="mb-6 grid gap-4 md:grid-cols-3"><Stat value={products.length} label="Products" /><Stat value={orders.length} label="Orders" /><Stat value={`₹${orders.reduce((sum, order) => sum + order.totalPrice, 0)}`} label="Revenue" /></div>}
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-2xl font-black">{view === "products" ? "All products" : "Manage products"}</h2>
        {products.map((product) => (
          <div className="grid items-center gap-3 border-t border-line py-4 md:grid-cols-[1fr_auto_auto_auto]" key={product._id}>
            <span>{product.title}</span><span>{product.category}</span><strong>₹{product.price}</strong>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white hover:border-red-300 hover:text-red-600" onClick={() => removeProduct(product._id)} title="Delete product"><Trash2 size={17} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PageHeading({ title }) {
  return <div><h1 className="text-4xl font-black md:text-5xl">{title}</h1></div>;
}

function Stat({ value, label }) {
  return <div className="grid gap-1 rounded-lg border border-line bg-white p-5 shadow-sm"><strong className="text-3xl">{value}</strong><span className="text-muted">{label}</span></div>;
}
