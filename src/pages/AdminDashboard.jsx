import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api from "../api/axios.js";

const paymentLabel = (paymentStatus) => {
  if (paymentStatus === "paid") return "Paid";
  if (paymentStatus === "failed") return "Failed";
  return "Pending";
};

const paymentStatusFor = (order) => order.paymentStatus || (order.status === "paid" || order.status === "delivered" ? "paid" : order.status === "cancelled" ? "failed" : "pending");
const paymentMethodLabel = (method) => ({ cod: "Cash on delivery", cash: "Cash", upi: "UPI", online: "Online pay", demo: "Online pay" }[method] || "Not selected");
const formatDate = (date) => date ? new Date(date).toLocaleString() : "—";

const paymentClass = (status) => {
  if (status === "Success") return "bg-green-50 text-green-700";
  if (status === "Failed") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
};

export default function AdminDashboard({ view = "dashboard" }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [productRes, orderRes, userRes, issueRes, profileRes] = await Promise.all([
        api.get("/products"),
        api.get("/orders"),
        api.get("/auth/users"),
        api.get("/issues"),
        api.get("/auth/profile")
      ]);
      setProducts(productRes.data);
      setOrders(orderRes.data);
      setUsers(userRes.data);
      setIssues(issueRes.data);
      setAdminProfile(profileRes.data);
    };

    load().catch(() => {});
  }, []);

  const removeProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts(products.filter((product) => product._id !== id));
  };

  const updateOrder = (nextOrder) => setOrders((currentOrders) => currentOrders.map((order) => order._id === nextOrder._id ? { ...order, ...nextOrder, user: order.user } : order));

  const markPaymentPaid = async (id, paymentMethod) => {
    const { data } = await api.patch(`/orders/${id}/payment`, { paymentMethod });
    updateOrder(data);
  };

  const markDelivered = async (id) => {
    const { data } = await api.patch(`/orders/${id}/deliver`);
    updateOrder(data);
  };

  const paymentRows = orders.flatMap((order) => order.items.map((item) => ({
    ...item,
    orderId: order._id,
    buyer: order.user?.name || order.shippingEmail || "Customer",
    status: paymentLabel(paymentStatusFor(order)),
    paymentMethod: order.paymentMethod,
    orderedAt: order.createdAt,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    paymentStatus: paymentStatusFor(order)
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
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[1.3fr_1fr_100px_120px_130px_180px_190px] gap-4 border-b border-line pb-3 text-xs font-extrabold uppercase text-muted"><span>Book</span><span>Buyer</span><span>Amount</span><span>Mode</span><span>Status</span><span>Dates</span><span>Action</span></div>
            {paymentRows.map((payment, index) => <div className="grid grid-cols-[1.3fr_1fr_100px_120px_130px_180px_190px] items-center gap-4 border-b border-line py-4 text-sm" key={`${payment.orderId}-${payment.product}-${index}`}><strong>{payment.title} × {payment.quantity}</strong><span>{payment.buyer}</span><span>₹{payment.price * payment.quantity}</span><span>{paymentMethodLabel(payment.paymentMethod)}</span><span className={`w-max rounded-md px-3 py-1 text-xs font-extrabold ${paymentClass(payment.status)}`}>{payment.status}</span><span className="text-xs text-muted">Ordered: {formatDate(payment.orderedAt)}<br />Paid: {formatDate(payment.paidAt)}<br />Delivered: {formatDate(payment.deliveredAt)}</span><PaymentActions order={orders.find((order) => order._id === payment.orderId)} onPaid={markPaymentPaid} /></div>)}
            {!paymentRows.length && <p className="py-6 text-muted">No payments found.</p>}
          </div>
        </div>
      </section>
    );
  }

  if (view === "orders") {
    return (
      <section>
        <PageHeading title="Orders" />
        <p className="mb-7 mt-2 text-muted">Customer orders and delivery details.</p>
        <div className="grid gap-4">
          {orders.map((order) => {
            const paymentStatus = paymentLabel(paymentStatusFor(order));
            return (
              <article key={order._id} className="rounded-lg border border-line bg-white p-6 shadow-soft">
                <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-lg font-extrabold">{order.customerName || order.user?.name || "Customer"}</h2>
                    <p className="mt-1 text-sm text-muted">{order.shippingEmail || order.user?.email || "No email"} · {order.phone || "No phone number"}</p>
                  </div>
                  <div className="md:text-right"><strong className="text-lg">₹{order.totalPrice}</strong><span className={`ml-3 inline-block rounded-md px-3 py-1 text-xs font-extrabold ${paymentClass(paymentStatus)}`}>{paymentStatus}</span><p className="mt-2 text-sm text-muted">Payment mode: {paymentMethodLabel(order.paymentMethod)}</p></div>
                </div>
                <div className="grid gap-5 pt-4 md:grid-cols-[1fr_0.9fr]">
                  <div><h3 className="mb-2 text-sm font-extrabold uppercase text-muted">Books ordered</h3>{order.items.map((item) => <div className="flex justify-between gap-3 py-1" key={`${order._id}-${item.product}`}><span>{item.title} × {item.quantity}</span><strong>₹{item.price * item.quantity}</strong></div>)}</div>
                  <div><h3 className="mb-2 text-sm font-extrabold uppercase text-muted">Delivery address</h3><p className="whitespace-pre-line leading-6 text-slate-600">{order.address || "No address provided"}{order.city && `\n${order.city}`}{order.postalCode && ` — ${order.postalCode}`}</p></div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4"><p className="text-sm text-muted">Ordered: {formatDate(order.createdAt)} · Paid: {formatDate(order.paidAt)} · Delivered: {formatDate(order.deliveredAt)}</p><div className="flex gap-2"><PaymentActions order={order} onPaid={markPaymentPaid} />{order.status !== "delivered" && <button onClick={() => markDelivered(order._id)} className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50">Mark delivered</button>}</div></div>
              </article>
            );
          })}
          {!orders.length && <p className="rounded-lg border border-line bg-white p-8 text-center text-muted">No orders have been placed yet.</p>}
        </div>
      </section>
    );
  }

  if (view === "issues") {
    return (
      <section>
        <PageHeading title="User issues" />
        <p className="mb-7 mt-2 text-muted">Messages submitted through the contact form.</p>
        <div className="grid gap-4">
          {issues.map((issue) => (
            <article key={issue._id} className="rounded-lg border border-line bg-white p-6 shadow-soft">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-extrabold text-ink">{issue.name}</h2>
                  <a className="text-sm text-blue-600 hover:text-blue-700" href={`mailto:${issue.email}`}>{issue.email}</a>
                </div>
                <time className="text-sm text-muted" dateTime={issue.createdAt}>{new Date(issue.createdAt).toLocaleString()}</time>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{issue.message}</p>
            </article>
          ))}
          {!issues.length && <p className="rounded-lg border border-line bg-white p-8 text-center text-muted">No user issues have been submitted.</p>}
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
      {view === "dashboard" && <AdminProfile profile={adminProfile} />}
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

function AdminProfile({ profile }) {
  if (!profile) return null;
  const initials = profile.name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";

  return (
    <section className="mb-6 rounded-lg border border-line bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {profile.avatar ? <img className="h-20 w-20 rounded-full object-cover" src={profile.avatar} alt={`${profile.name}'s profile`} /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">{initials}</div>}
        <div><span className="text-xs font-extrabold uppercase text-teal-600">Administrator</span><h2 className="mt-1 text-2xl font-black">{profile.name}</h2><p className="mt-1 text-slate-600">{profile.email}</p><p className="text-slate-600">{profile.phone || "Phone number not added"}</p></div>
      </div>
    </section>
  );
}

function PaymentActions({ order, onPaid }) {
  if (!order || paymentStatusFor(order) === "paid") return null;

  return (
    <span className="inline-flex flex-wrap gap-2">
      <button onClick={() => onPaid(order._id, "cash")} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:bg-slate-50">Paid cash</button>
      <button onClick={() => onPaid(order._id, "upi")} className="rounded-lg border border-blue-600 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50">Paid UPI</button>
    </span>
  );
}
