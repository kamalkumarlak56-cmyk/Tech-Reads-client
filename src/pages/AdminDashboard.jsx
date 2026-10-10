import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  XCircle
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../state/AuthContext.jsx";
import { readCache, writeCache } from "../utils/dataCache.js";

const paymentLabel = (paymentStatus) => {
  if (paymentStatus === "paid") return "Paid";
  if (paymentStatus === "failed") return "Failed";
  return "Pending";
};

const paymentStatusFor = (order) =>
  order.paymentStatus ||
  (order.status === "paid" || order.status === "delivered"
    ? "paid"
    : order.status === "cancelled"
    ? "failed"
    : "pending");

const paymentMethodLabel = (method) =>
  ({
    cod: "Cash on delivery",
    cash: "Cash",
    upi: "UPI",
    online: "Online pay",
    razorpay: "Razorpay",
    demo: "Online pay"
  }[method] || "Not selected");

const formatDate = (date) => (date ? new Date(date).toLocaleString() : "—");
const formatShortDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

const paymentClass = (status) => {
  if (status === "Success" || status === "Paid" || status === "paid")
    return "bg-green-50 text-green-700 border border-green-200";
  if (status === "Failed" || status === "failed" || status === "cancelled")
    return "bg-red-50 text-red-700 border border-red-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
};

const orderStatusClass = (status) => {
  if (status === "delivered") return "bg-teal-50 text-teal-700 border border-teal-200";
  if (status === "paid") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (status === "cancelled") return "bg-red-50 text-red-700 border border-red-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
};

const initialsFor = (name, fallback = "U") =>
  name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || fallback;

export default function AdminDashboard({ view = "dashboard" }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [products, setProducts] = useState(() => readCache("products", []));
  const [orders, setOrders] = useState(() => readCache("admin_orders", []));
  const [users, setUsers] = useState(() => readCache("admin_users", []));
  const [issues, setIssues] = useState(() => readCache("admin_issues", []));
  const [adminProfile, setAdminProfile] = useState(() => readCache("admin_profile", user || null));
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/products")
      .then(({ data }) => {
        if (!active) return;
        const next = data || [];
        setProducts(next);
        writeCache("products", next);
      })
      .catch(() => {});

    api
      .get("/orders")
      .then(({ data }) => {
        if (!active) return;
        const next = data || [];
        setOrders(next);
        writeCache("admin_orders", next);
      })
      .catch(() => {});

    api
      .get("/auth/users")
      .then(({ data }) => {
        if (!active) return;
        const next = data || [];
        setUsers(next);
        writeCache("admin_users", next);
      })
      .catch(() => {});

    api
      .get("/issues")
      .then(({ data }) => {
        if (!active) return;
        const next = data || [];
        setIssues(next);
        writeCache("admin_issues", next);
      })
      .catch(() => {});

    api
      .get("/auth/profile")
      .then(({ data }) => {
        if (!active || !data) return;
        setAdminProfile(data);
        writeCache("admin_profile", data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleAdminProfileUpdated = (updatedProfile) => {
    setAdminProfile(updatedProfile);
    writeCache("admin_profile", updatedProfile);
    updateUser(updatedProfile);
    setUsers((prev) => {
      const next = prev.map((u) => (u._id === updatedProfile._id ? { ...u, ...updatedProfile } : u));
      writeCache("admin_users", next);
      return next;
    });
  };

  const removeProduct = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => {
      const next = prev.filter((product) => product._id !== id);
      writeCache("products", next);
      return next;
    });
  };

  const updateOrder = (nextOrder) =>
    setOrders((currentOrders) => {
      const next = currentOrders.map((order) =>
        order._id === nextOrder._id ? { ...order, ...nextOrder, user: order.user } : order
      );
      writeCache("admin_orders", next);
      return next;
    });

  const markPaymentPaid = async (id, paymentMethod) => {
    const { data } = await api.patch(`/orders/${id}/payment`, { paymentMethod });
    updateOrder(data);
  };

  const markDelivered = async (id) => {
    const { data } = await api.patch(`/orders/${id}/deliver`);
    updateOrder(data);
  };

  const paymentRows = (orders || []).flatMap((order) =>
    (order.items || []).map((item) => ({
      ...item,
      orderId: order._id,
      buyer: order.user?.name || order.customerName || order.shippingEmail || "Customer",
      buyerId: order.user?._id || order.user,
      status: paymentLabel(paymentStatusFor(order)),
      paymentMethod: order.paymentMethod,
      orderedAt: order.createdAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      paymentStatus: paymentStatusFor(order)
    }))
  );

  if (view === "users") {
    if (userId) {
      const selectedUserFromList = users.find((u) => u._id === userId);
      return (
        <UserDetailsView
          userId={userId}
          initialUser={selectedUserFromList}
          allOrders={orders}
          onBack={() => navigate("/admin/users")}
          onPaid={markPaymentPaid}
          onDelivered={markDelivered}
          isSelfAdmin={adminProfile?._id === userId}
          onAdminProfileUpdated={handleAdminProfileUpdated}
        />
      );
    }

    const q = userSearch.trim().toLowerCase();
    const filteredUsers = (users || []).filter((u) => {
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    });

    return (
      <section>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <PageHeading title="Users" />
            <p className="mt-2 text-muted">
              Click on any user to view their full profile, orders, and payment history.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search name, email, or phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="min-w-[780px]">
            <div className="grid grid-cols-[1.4fr_1.3fr_1fr_90px_90px_120px_110px] gap-4 border-b border-line pb-3 text-xs font-extrabold uppercase text-muted">
              <span>User</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Role</span>
              <span>Orders</span>
              <span>Created</span>
              <span>Action</span>
            </div>
            {filteredUsers.map((u) => {
              const userOrdersCount = (orders || []).filter(
                (o) => String(o.user?._id || o.user) === String(u._id)
              ).length;

              return (
                <div
                  key={u._id}
                  onClick={() => navigate(`/admin/users/${u._id}`)}
                  className="grid cursor-pointer grid-cols-[1.4fr_1.3fr_1fr_90px_90px_120px_110px] items-center gap-4 border-b border-line py-4 text-sm transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-10 w-10 flex-none rounded-full object-cover border border-line"
                      />
                    ) : (
                      <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-blue-100 text-xs font-black text-blue-700">
                        {initialsFor(u.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <strong className="block truncate text-ink hover:text-blue-600">
                        {u.name}
                      </strong>
                    </div>
                  </div>
                  <span className="truncate text-slate-600">{u.email}</span>
                  <span className="truncate text-slate-600">{u.phone || "—"}</span>
                  <span>
                    <span
                      className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-bold capitalize ${
                        u.role === "admin"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </span>
                  <span className="font-bold text-ink">{userOrdersCount}</span>
                  <span className="text-muted">{formatShortDate(u.createdAt)}</span>
                  <span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/users/${u._id}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
                    >
                      <Eye size={14} /> Details
                    </button>
                  </span>
                </div>
              );
            })}
            {!filteredUsers.length && (
              <p className="py-6 text-center text-muted">No users found.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (view === "payments") {
    return (
      <section>
        <PageHeading title="Payments" />
        <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="min-w-[1050px]">
            <div className="grid grid-cols-[1.3fr_1fr_100px_120px_130px_180px_190px] gap-4 border-b border-line pb-3 text-xs font-extrabold uppercase text-muted">
              <span>Book</span>
              <span>Buyer</span>
              <span>Amount</span>
              <span>Mode</span>
              <span>Status</span>
              <span>Dates</span>
              <span>Action</span>
            </div>
            {paymentRows.map((payment, index) => (
              <div
                className="grid grid-cols-[1.3fr_1fr_100px_120px_130px_180px_190px] items-center gap-4 border-b border-line py-4 text-sm"
                key={`${payment.orderId}-${payment.product}-${index}`}
              >
                <strong>
                  {payment.title} × {payment.quantity}
                </strong>
                <span>
                  {payment.buyerId ? (
                    <Link
                      to={`/admin/users/${payment.buyerId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {payment.buyer}
                    </Link>
                  ) : (
                    payment.buyer
                  )}
                </span>
                <span>₹{(payment.price || 0) * (payment.quantity || 1)}</span>
                <span>{paymentMethodLabel(payment.paymentMethod)}</span>
                <span
                  className={`w-max rounded-md px-3 py-1 text-xs font-extrabold ${paymentClass(
                    payment.status
                  )}`}
                >
                  {payment.status}
                </span>
                <span className="text-xs text-muted">
                  Ordered: {formatDate(payment.orderedAt)}
                  <br />
                  Paid: {formatDate(payment.paidAt)}
                  <br />
                  Delivered: {formatDate(payment.deliveredAt)}
                </span>
                <PaymentActions
                  order={orders.find((order) => order._id === payment.orderId)}
                  onPaid={markPaymentPaid}
                />
              </div>
            ))}
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
            const buyerUserId = order.user?._id || order.user;
            return (
              <article
                key={order._id}
                className="rounded-lg border border-line bg-white p-6 shadow-soft"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-lg font-extrabold">
                      {buyerUserId ? (
                        <Link
                          to={`/admin/users/${buyerUserId}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {order.customerName || order.user?.name || "Customer"}
                        </Link>
                      ) : (
                        order.customerName || order.user?.name || "Customer"
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {order.shippingEmail || order.user?.email || "No email"} ·{" "}
                      {order.phone || "No phone number"}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <strong className="text-lg">₹{order.totalPrice}</strong>
                    <span
                      className={`ml-3 inline-block rounded-md px-3 py-1 text-xs font-extrabold ${paymentClass(
                        paymentStatus
                      )}`}
                    >
                      {paymentStatus}
                    </span>
                    <p className="mt-2 text-sm text-muted">
                      Payment mode: {paymentMethodLabel(order.paymentMethod)}
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 pt-4 md:grid-cols-[1fr_0.9fr]">
                  <div>
                    <h3 className="mb-2 text-sm font-extrabold uppercase text-muted">
                      Books ordered
                    </h3>
                    {(order.items || []).map((item) => (
                      <div
                        className="flex justify-between gap-3 py-1"
                        key={`${order._id}-${item.product}`}
                      >
                        <span>
                          {item.title} × {item.quantity}
                        </span>
                        <strong>₹{(item.price || 0) * (item.quantity || 1)}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-extrabold uppercase text-muted">
                      Delivery address
                    </h3>
                    <p className="whitespace-pre-line leading-6 text-slate-600">
                      {order.address || "No address provided"}
                      {order.city && `\n${order.city}`}
                      {order.postalCode && ` — ${order.postalCode}`}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <p className="text-sm text-muted">
                    Ordered: {formatDate(order.createdAt)} · Paid: {formatDate(order.paidAt)} ·
                    Delivered: {formatDate(order.deliveredAt)}
                  </p>
                  <div className="flex gap-2">
                    <PaymentActions order={order} onPaid={markPaymentPaid} />
                    {order.status !== "delivered" && (
                      <button
                        onClick={() => markDelivered(order._id)}
                        className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"
                      >
                        Mark delivered
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {!orders.length && (
            <p className="rounded-lg border border-line bg-white p-8 text-center text-muted">
              No orders have been placed yet.
            </p>
          )}
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
            <article
              key={issue._id}
              className="rounded-lg border border-line bg-white p-6 shadow-soft"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-extrabold text-ink">{issue.name}</h2>
                  <a
                    className="text-sm text-blue-600 hover:text-blue-700"
                    href={`mailto:${issue.email}`}
                  >
                    {issue.email}
                  </a>
                </div>
                <time className="text-sm text-muted" dateTime={issue.createdAt}>
                  {issue.createdAt ? new Date(issue.createdAt).toLocaleString() : "—"}
                </time>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{issue.message}</p>
            </article>
          ))}
          {!issues.length && (
            <p className="rounded-lg border border-line bg-white p-8 text-center text-muted">
              No user issues have been submitted.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PageHeading title={view === "products" ? "All products" : "Dashboard"} />
        <Link
          to="/admin/add-product"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add product
        </Link>
      </div>
      {view === "dashboard" && (
        <AdminProfile profile={adminProfile} onProfileUpdated={handleAdminProfileUpdated} />
      )}
      {view === "dashboard" && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Stat value={products.length} label="Products" />
          <Stat value={orders.length} label="Orders" />
          <Stat
            value={`₹${(orders || []).reduce((sum, order) => sum + (order.totalPrice || 0), 0)}`}
            label="Revenue"
          />
        </div>
      )}
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-2xl font-black">
          {view === "products" ? "All products" : "Manage products"}
        </h2>
        {products.map((product) => (
          <div
            className="grid items-center gap-3 border-t border-line py-4 md:grid-cols-[1fr_auto_auto_auto_auto_auto]"
            key={product._id}
          >
            <div className="flex min-w-0 items-center gap-3">
              <img
                className="h-14 w-12 rounded object-cover"
                src={
                  product.image ||
                  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=160&q=70"
                }
                alt=""
              />
              <div className="min-w-0">
                <Link
                  className="block truncate font-bold text-ink hover:text-blue-600"
                  to={`/products/${product._id}`}
                >
                  {product.title}
                </Link>
                <span className="text-xs text-muted">Stock: {product.stock}</span>
              </div>
            </div>
            <span>{product.category}</span>
            <strong>₹{product.price}</strong>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-bold hover:bg-slate-50"
              to={`/products/${product._id}`}
              title="View product"
            >
              <Eye size={16} /> View
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"
              to={`/admin/products/${product._id}/edit`}
              title="Edit product"
            >
              <Pencil size={16} /> Edit
            </Link>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white hover:border-red-300 hover:text-red-600"
              onClick={() => removeProduct(product._id)}
              title="Delete product"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PageHeading({ title }) {
  return (
    <div>
      <h1 className="text-4xl font-black md:text-5xl">{title}</h1>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="grid gap-1 rounded-lg border border-line bg-white p-5 shadow-sm">
      <strong className="text-3xl">{value}</strong>
      <span className="text-muted">{label}</span>
    </div>
  );
}

function AdminProfile({ profile, onProfileUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    avatar: ""
  });
  const [avatarMode, setAvatarMode] = useState("upload");
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (profile) {
      setDraft({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        password: "",
        avatar: profile.avatar || ""
      });
    }
  }, [profile]);

  if (!profile) return null;
  const initials = initialsFor(profile.name, "A");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ type: "error", message: "Please select a valid image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: "error", message: "Please choose an image smaller than 5 MB." });
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({ ...prev, avatar: reader.result }));
      setStatus({ type: "", message: "" });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      let finalAvatarUrl = draft.avatar;

      if (avatarMode === "upload" && avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);
        const { data: uploadRes } = await api.post("/upload?folder=avatars", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        finalAvatarUrl = uploadRes.url;
      }

      const payload = {
        name: draft.name.trim(),
        email: draft.email.trim().toLowerCase(),
        phone: draft.phone.trim(),
        avatar: finalAvatarUrl
      };

      if (draft.password.trim()) {
        payload.password = draft.password;
      }

      const { data } = await api.put("/auth/profile", payload);
      onProfileUpdated?.(data);
      setAvatarFile(null);
      setDraft((prev) => ({ ...prev, password: "", avatar: data.avatar || "" }));
      setIsEditing(false);
      setStatus({ type: "success", message: "Admin account details updated successfully." });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to update admin profile."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-line bg-white p-6 shadow-soft">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {profile.avatar ? (
            <img
              className="h-20 w-20 rounded-full object-cover border border-line"
              src={profile.avatar}
              alt={`${profile.name}'s profile`}
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">
              {initials}
            </div>
          )}
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase text-teal-600">
              <Shield size={14} /> Administrator
            </span>
            <h2 className="mt-1 text-2xl font-black">{profile.name}</h2>
            <p className="mt-1 text-slate-600">{profile.email}</p>
            <p className="text-slate-600">{profile.phone || "Phone number not added"}</p>
          </div>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={() => {
              setDraft({
                name: profile.name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                password: "",
                avatar: profile.avatar || ""
              });
              setAvatarFile(null);
              setStatus({ type: "", message: "" });
              setIsEditing(true);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50 sm:self-center"
          >
            <Pencil size={16} /> Edit account
          </button>
        )}
      </div>

      {status.message && !isEditing && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.message}
        </p>
      )}

      {isEditing && (
        <form onSubmit={handleSave} className="mt-6 border-t border-line pt-6">
          <h3 className="mb-4 text-lg font-extrabold text-ink">Edit Admin Account</h3>

          {status.message && (
            <p
              className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {status.message}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">
              Admin name
              <input
                type="text"
                className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Administrator name"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-bold">
              Email ID
              <input
                type="email"
                className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-bold">
              Phone number
              <input
                type="tel"
                className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold">
              New login password
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-line px-4 py-2.5 pr-11 font-normal outline-none focus:border-blue-500"
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-blue-600"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="col-span-full grid gap-2 rounded-lg border border-line bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink">Profile image</span>
                <div className="flex gap-4 text-xs font-bold">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="adminAvatarMode"
                      checked={avatarMode === "upload"}
                      onChange={() => setAvatarMode("upload")}
                    />
                    Upload file
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="adminAvatarMode"
                      checked={avatarMode === "url"}
                      onChange={() => setAvatarMode("url")}
                    />
                    Image URL
                  </label>
                </div>
              </div>

              {avatarMode === "upload" ? (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:font-bold file:text-blue-700"
                />
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={draft.avatar.startsWith("data:") ? "" : draft.avatar}
                  onChange={(e) => {
                    setAvatarFile(null);
                    setDraft({ ...draft, avatar: e.target.value });
                  }}
                  className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              )}

              {draft.avatar && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={draft.avatar}
                    alt="Avatar preview"
                    className="h-14 w-14 rounded-full object-cover border border-line"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setDraft({ ...draft, avatar: "" });
                    }}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Uploading..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setAvatarFile(null);
                setStatus({ type: "", message: "" });
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line px-5 py-2 text-sm font-bold text-muted hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function UserDetailsView({
  userId,
  initialUser,
  allOrders,
  onBack,
  onPaid,
  onDelivered,
  isSelfAdmin,
  onAdminProfileUpdated
}) {
  const userCacheKey = `admin_user_${userId}`;
  const [userDetail, setUserDetail] = useState(
    () => readCache(userCacheKey, initialUser || null)
  );
  const [loading, setLoading] = useState(() => !readCache(userCacheKey, initialUser || null));
  const [paymentFilter, setPaymentFilter] = useState("all");

  useEffect(() => {
    if (initialUser) {
      setUserDetail((prev) => ({ ...prev, ...initialUser }));
    }
  }, [initialUser]);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/auth/users/${userId}`);
        if (active && data?.user) {
          setUserDetail(data.user);
          writeCache(userCacheKey, data.user);
        }
      } catch {
        // Fallback to initialUser if already present
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, [userId, userCacheKey]);

  const userOrders = (allOrders || []).filter(
    (order) => String(order.user?._id || order.user) === String(userId)
  );

  const paidOrders = userOrders.filter((o) => paymentStatusFor(o) === "paid");
  const pendingOrders = userOrders.filter((o) => paymentStatusFor(o) === "pending");
  const failedOrders = userOrders.filter((o) => paymentStatusFor(o) === "failed");

  const totalOrderAmount = userOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const paidAmount = paidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const failedAmount = failedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const userPaymentRows = userOrders.flatMap((order) =>
    (order.items || []).map((item) => {
      const pStatus = paymentStatusFor(order);
      return {
        ...item,
        orderId: order._id,
        orderStatus: order.status,
        paymentStatus: pStatus,
        paymentLabel: paymentLabel(pStatus),
        paymentMethod: order.paymentMethod,
        orderedAt: order.createdAt,
        paidAt: order.paidAt,
        deliveredAt: order.deliveredAt
      };
    })
  );

  const filteredPayments = userPaymentRows.filter((row) => {
    if (paymentFilter === "all") return true;
    return row.paymentStatus === paymentFilter;
  });

  if (loading && !userDetail) {
    return (
      <section className="py-12">
        <p className="text-muted">Loading user details...</p>
      </section>
    );
  }

  if (!userDetail) {
    return (
      <section className="py-12">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} /> Back to all users
        </button>
        <div className="rounded-lg border border-line bg-white p-8 text-center shadow-soft">
          <p className="text-muted">User not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm transition hover:border-blue-300 hover:text-blue-600"
        >
          <ArrowLeft size={16} /> Back to all users
        </button>
        <PageHeading title="User Details" />
      </div>

      {isSelfAdmin ? (
        <AdminProfile
          profile={userDetail}
          onProfileUpdated={(updated) => {
            setUserDetail(updated);
            onAdminProfileUpdated?.(updated);
          }}
        />
      ) : (
        <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {userDetail.avatar ? (
                <img
                  src={userDetail.avatar}
                  alt={userDetail.name}
                  className="h-24 w-24 flex-none rounded-full object-cover border-2 border-blue-100 shadow-sm"
                />
              ) : (
                <div className="grid h-24 w-24 flex-none place-items-center rounded-full bg-blue-100 text-3xl font-black text-blue-700">
                  {initialsFor(userDetail.name)}
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-black text-ink">{userDetail.name}</h2>
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold capitalize ${
                      userDetail.role === "admin"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-teal-50 text-teal-700 border border-teal-200"
                    }`}
                  >
                    {userDetail.role}
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={15} className="text-blue-600" />
                  <a href={`mailto:${userDetail.email}`} className="hover:text-blue-600 hover:underline">
                    {userDetail.email}
                  </a>
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={15} className="text-blue-600" />
                  <span>{userDetail.phone || "Phone number not added"}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={15} className="text-blue-600" />
                  <span>
                    Account created: <strong className="text-ink">{formatDate(userDetail.createdAt)}</strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 text-xs text-muted border border-line">
              <div className="mb-1 flex items-center gap-1.5 font-bold text-ink">
                <UserIcon size={14} className="text-blue-600" /> Account ID
              </div>
              <code className="select-all font-mono text-xs text-slate-700">{userDetail._id}</code>
            </div>
          </div>

          {userDetail.addresses?.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase text-muted">
                <MapPin size={15} className="text-blue-600" /> Saved Addresses ({userDetail.addresses.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {userDetail.addresses.map((addr, idx) => (
                  <div
                    key={`${addr.address}-${idx}`}
                    className="rounded-lg border border-line bg-slate-50/60 p-3.5 text-sm"
                  >
                    <strong className="block text-ink">{addr.label || "Address"}</strong>
                    <p className="mt-1 text-slate-600">
                      {addr.address}
                      {addr.city ? `, ${addr.city}` : ""}
                      {addr.postalCode ? ` — ${addr.postalCode}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-extrabold uppercase">Total Orders</span>
            <Package size={18} className="text-blue-600" />
          </div>
          <strong className="mt-2 block text-3xl font-black text-ink">{userOrders.length}</strong>
          <span className="mt-1 block text-xs text-muted">Total value: ₹{totalOrderAmount}</span>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-green-700">
            <span className="text-xs font-extrabold uppercase">Payments Completed</span>
            <CheckCircle2 size={18} />
          </div>
          <strong className="mt-2 block text-3xl font-black text-green-700">
            {paidOrders.length}
          </strong>
          <span className="mt-1 block text-xs font-semibold text-green-700">
            Paid amount: ₹{paidAmount}
          </span>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-extrabold uppercase">Payments Pending</span>
            <Clock size={18} />
          </div>
          <strong className="mt-2 block text-3xl font-black text-amber-700">
            {pendingOrders.length}
          </strong>
          <span className="mt-1 block text-xs font-semibold text-amber-700">
            Pending amount: ₹{pendingAmount}
          </span>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-xs font-extrabold uppercase">Payments Failed</span>
            <XCircle size={18} />
          </div>
          <strong className="mt-2 block text-3xl font-black text-red-700">
            {failedOrders.length}
          </strong>
          <span className="mt-1 block text-xs font-semibold text-red-700">
            Failed amount: ₹{failedAmount}
          </span>
        </div>
      </div>

      {/* User Payments Breakdown Section */}
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" />
            <h3 className="text-2xl font-black text-ink">
              Payments by {userDetail.name} ({userPaymentRows.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", `All (${userPaymentRows.length})`],
              ["paid", `Completed (${userPaymentRows.filter((r) => r.paymentStatus === "paid").length})`],
              ["pending", `Pending (${userPaymentRows.filter((r) => r.paymentStatus === "pending").length})`],
              ["failed", `Failed (${userPaymentRows.filter((r) => r.paymentStatus === "failed").length})`]
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPaymentFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  paymentFilter === key
                    ? "bg-blue-600 text-white"
                    : "border border-line bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
            No {paymentFilter !== "all" ? paymentFilter : ""} payments found for this user.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              <div className="grid grid-cols-[1.4fr_100px_130px_120px_180px_170px] gap-4 border-b border-line pb-3 text-xs font-extrabold uppercase text-muted">
                <span>Item / Book</span>
                <span>Amount</span>
                <span>Payment Mode</span>
                <span>Status</span>
                <span>Dates</span>
                <span>Action</span>
              </div>
              {filteredPayments.map((payment, idx) => (
                <div
                  key={`${payment.orderId}-${payment.product}-${idx}`}
                  className="grid grid-cols-[1.4fr_100px_130px_120px_180px_170px] items-center gap-4 border-b border-line py-3.5 text-sm"
                >
                  <div>
                    <strong className="block text-ink">
                      {payment.title} × {payment.quantity}
                    </strong>
                    <span className="text-xs text-muted">
                      Order #{String(payment.orderId).slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <strong className="text-ink">
                    ₹{(payment.price || 0) * (payment.quantity || 1)}
                  </strong>
                  <span>{paymentMethodLabel(payment.paymentMethod)}</span>
                  <span
                    className={`w-max rounded-md px-2.5 py-1 text-xs font-extrabold ${paymentClass(
                      payment.paymentLabel
                    )}`}
                  >
                    {payment.paymentLabel}
                  </span>
                  <span className="text-xs text-muted">
                    Ordered: {formatDate(payment.orderedAt)}
                    <br />
                    Paid: {formatDate(payment.paidAt)}
                  </span>
                  <PaymentActions
                    order={userOrders.find((o) => o._id === payment.orderId)}
                    onPaid={onPaid}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All Orders by User Section */}
      <div className="rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-2">
          <Package size={20} className="text-blue-600" />
          <h3 className="text-2xl font-black text-ink">
            Orders by {userDetail.name} ({userOrders.length})
          </h3>
        </div>

        {userOrders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-8 text-center text-muted">
            This user has not placed any orders yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {userOrders.map((order) => {
              const pStatus = paymentStatusFor(order);
              const pLabel = paymentLabel(pStatus);

              return (
                <article
                  key={order._id}
                  className="rounded-lg border border-line bg-slate-50/40 p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 md:flex-row md:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base text-ink">
                          Order #{String(order._id).slice(-6).toUpperCase()}
                        </strong>
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold capitalize ${orderStatusClass(
                            order.status
                          )}`}
                        >
                          Order: {order.status}
                        </span>
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-xs font-extrabold ${paymentClass(
                            pLabel
                          )}`}
                        >
                          Payment: {pLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Recipient: {order.customerName || userDetail.name} ·{" "}
                        {order.shippingEmail || userDetail.email} ·{" "}
                        {order.phone || userDetail.phone || "No phone"}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <strong className="text-xl font-black text-ink">₹{order.totalPrice}</strong>
                      <p className="text-xs text-muted">
                        Mode: {paymentMethodLabel(order.paymentMethod)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 py-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <h4 className="mb-2 text-xs font-extrabold uppercase text-muted">
                        Items Ordered ({(order.items || []).length})
                      </h4>
                      <div className="grid gap-2">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={`${order._id}-${item.product}-${idx}`}
                            className="flex items-center justify-between gap-3 rounded-md border border-line bg-white p-2.5 text-sm"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-10 w-8 flex-none rounded object-cover"
                                />
                              )}
                              <div className="min-w-0">
                                <Link
                                  to={`/products/${item.product}`}
                                  className="block truncate font-bold text-ink hover:text-blue-600"
                                >
                                  {item.title}
                                </Link>
                                <span className="text-xs text-muted">
                                  Qty: {item.quantity} × ₹{item.price}
                                </span>
                              </div>
                            </div>
                            <strong className="text-ink">
                              ₹{(item.price || 0) * (item.quantity || 1)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-xs font-extrabold uppercase text-muted">
                        Delivery Address & Timestamps
                      </h4>
                      <div className="rounded-md border border-line bg-white p-3 text-sm text-slate-600">
                        <p className="font-medium text-ink">
                          {order.address || "No street address"}
                          {order.city ? `, ${order.city}` : ""}
                          {order.postalCode ? ` — ${order.postalCode}` : ""}
                        </p>
                        <div className="mt-3 space-y-1 border-t border-line pt-2 text-xs text-muted">
                          <div>Ordered: {formatDate(order.createdAt)}</div>
                          <div>Paid: {formatDate(order.paidAt)}</div>
                          <div>Delivered: {formatDate(order.deliveredAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
                    <PaymentActions order={order} onPaid={onPaid} />
                    {order.status !== "delivered" && (
                      <button
                        type="button"
                        onClick={() => onDelivered(order._id)}
                        className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50"
                      >
                        Mark delivered
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function PaymentActions({ order, onPaid }) {
  if (!order || paymentStatusFor(order) === "paid") return null;

  return (
    <span className="inline-flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onPaid(order._id, "cash")}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-slate-50"
      >
        Paid cash
      </button>
      <button
        type="button"
        onClick={() => onPaid(order._id, "upi")}
        className="rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50"
      >
        Paid UPI
      </button>
    </span>
  );
}
