import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
  X,
  XCircle
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";
import { readCache, writeCache } from "../utils/dataCache.js";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const cachedProfile = user?._id ? readCache(`user_profile_${user._id}`, null) : null;
  const savedAddresses = cachedProfile?.addresses || user?.addresses || [];
  const primaryAddress = savedAddresses[0] || {};

  const [form, setForm] = useState({
    name: cachedProfile?.name || user?.name || "",
    email: cachedProfile?.email || user?.email || "",
    phone: cachedProfile?.phone || user?.phone || "",
    address: primaryAddress.address || "",
    city: primaryAddress.city || "",
    postalCode: primaryAddress.postalCode || "",
    paymentMethod: "razorpay"
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Interactive Razorpay Test Modal state (used when RAZORPAY_KEY_ID is not yet set in .env)
  const [simulatedRzpOrder, setSimulatedRzpOrder] = useState(null);
  const [rzpTab, setRzpTab] = useState("upi");
  const [upiId, setUpiId] = useState("reader@okaxis");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("123");
  const [bankName, setBankName] = useState("SBI");
  const [processingGateway, setProcessingGateway] = useState(false);

  const syncOrderCaches = (newOrder) => {
    if (!newOrder) return;
    if (user?._id) {
      const userKey = `user_orders_${user._id}`;
      const existingUserOrders = readCache(userKey, []);
      writeCache(userKey, [newOrder, ...existingUserOrders]);
    }
    const existingAdminOrders = readCache("admin_orders", []);
    if (existingAdminOrders.length > 0) {
      writeCache("admin_orders", [
        { ...newOrder, user: { _id: user?._id, name: user?.name, email: user?.email } },
        ...existingAdminOrders
      ]);
    }
  };

  const selectSavedAddress = (addr) => {
    setForm((prev) => ({
      ...prev,
      address: addr.address || "",
      city: addr.city || "",
      postalCode: addr.postalCode || ""
    }));
  };

  const finalizeOrderSuccess = (orderData, customMessage) => {
    syncOrderCaches(orderData);
    clearCart();
    setCompletedOrder(orderData);
    setMessage(
      customMessage || "Payment verified & order placed! Redirecting to your dashboard..."
    );
    setTimeout(() => navigate("/dashboard"), 2200);
  };

  const verifyAndCreateOrder = async ({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    mode,
    selectedChannel = "razorpay",
    paymentFailed = false
  }) => {
    const payload = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      mode,
      paymentFailed,
      customerName: form.name,
      shippingEmail: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      paymentMethod: selectedChannel,
      items: items.map((item) => ({ product: item._id, quantity: item.quantity }))
    };

    const { data: orderData } = await api.post("/orders/razorpay/verify", payload);
    return orderData;
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!items.length) {
      setError("Your cart is empty. Add products before checking out.");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      // Cash on Delivery flow
      if (form.paymentMethod === "cod") {
        const payload = {
          customerName: form.name,
          shippingEmail: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          paymentMethod: "cod",
          items: items.map((item) => ({ product: item._id, quantity: item.quantity }))
        };
        const { data: orderData } = await api.post("/orders", payload);
        finalizeOrderSuccess(
          orderData,
          "Cash on Delivery order placed! Redirecting to your dashboard..."
        );
        return;
      }

      // Razorpay Payment Gateway flow
      const { data: rzpOrder } = await api.post("/orders/razorpay/create-order", {
        items: items.map((item) => ({ product: item._id, quantity: item.quantity }))
      });

      // If live/test Razorpay API keys are configured in server/.env, open official Razorpay Checkout
      if (rzpOrder.mode === "live" && rzpOrder.keyId) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError("Failed to load Razorpay SDK. Please check your internet connection.");
          setSubmitting(false);
          return;
        }

        const options = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || "INR",
          name: "TechReads Market",
          description: `Order of ${items.length} item${items.length === 1 ? "" : "s"}`,
          order_id: rzpOrder.orderId,
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone
          },
          notes: {
            address: `${form.address}, ${form.city} ${form.postalCode}`
          },
          theme: {
            color: "#2563eb"
          },
          handler: async (response) => {
            try {
              setSubmitting(true);
              const orderData = await verifyAndCreateOrder({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                mode: "live",
                selectedChannel: "razorpay"
              });
              finalizeOrderSuccess(orderData);
            } catch (verifyErr) {
              setError(
                verifyErr.response?.data?.message ||
                  "Payment verification failed. Please contact support."
              );
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
            }
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", async (failResponse) => {
          try {
            const failedOrder = await verifyAndCreateOrder({
              razorpay_order_id: rzpOrder.orderId,
              razorpay_payment_id: failResponse?.error?.metadata?.payment_id || "",
              razorpay_signature: "",
              mode: "live",
              selectedChannel: "razorpay",
              paymentFailed: true
            });
            syncOrderCaches(failedOrder);
          } catch {
            // Ignore secondary logging error
          }
          setError(
            failResponse?.error?.description ||
              "Payment failed on Razorpay. Your cart has been preserved so you can try again."
          );
          setSubmitting(false);
        });

        paymentObject.open();
        return;
      }

      // Otherwise open the interactive Razorpay Gateway Checkout modal
      setSimulatedRzpOrder(rzpOrder);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initialize payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatedRazorpayComplete = async (didFail = false) => {
    if (!simulatedRzpOrder) return;
    setProcessingGateway(true);
    setError("");

    try {
      const paymentId = `pay_rzp_${Date.now()}`;
      const selectedChannel = rzpTab === "upi" ? "razorpay" : "razorpay";

      const orderData = await verifyAndCreateOrder({
        razorpay_order_id: simulatedRzpOrder.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "simulated_razorpay_signature",
        mode: "test_simulated",
        selectedChannel,
        paymentFailed: didFail
      });

      setSimulatedRzpOrder(null);

      if (didFail) {
        syncOrderCaches(orderData);
        setError(
          "Payment was declined/failed on Razorpay. This failed payment attempt has been recorded, and you can retry below."
        );
        return;
      }

      finalizeOrderSuccess(
        orderData,
        `Razorpay payment (${paymentId}) successful! Redirecting to your dashboard...`
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not complete Razorpay payment.");
    } finally {
      setProcessingGateway(false);
    }
  };

  if (completedOrder) {
    return (
      <section className="mx-auto w-[min(680px,calc(100%_-_40px))] py-16">
        <div className="rounded-xl border border-green-200 bg-white p-8 text-center shadow-soft">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={36} />
          </div>
          <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold uppercase text-green-700">
            {completedOrder.paymentMethod === "cod"
              ? "Order Confirmed (COD)"
              : "Razorpay Payment Verified"}
          </span>
          <h1 className="mt-3 text-3xl font-black text-ink">Thank you for your order!</h1>
          <p className="mt-2 text-sm text-muted">{message}</p>

          <div className="mt-6 grid gap-2 rounded-lg border border-line bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Order ID</span>
              <strong className="font-mono text-ink">#{completedOrder._id?.slice(-8)}</strong>
            </div>
            {completedOrder.razorpayPaymentId && (
              <div className="flex justify-between">
                <span className="text-muted">Razorpay Payment ID</span>
                <strong className="font-mono text-blue-600">
                  {completedOrder.razorpayPaymentId}
                </strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Amount</span>
              <strong className="text-ink">₹{completedOrder.totalPrice}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Payment Status</span>
              <strong className="capitalize text-green-700">
                {completedOrder.paymentStatus}
              </strong>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
            >
              Go to My Orders
            </Link>
            <Link
              to="/products"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-5 py-2 font-bold text-ink hover:bg-slate-50"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!items.length && !message) {
    return (
      <section className="mx-auto w-[min(760px,calc(100%_-_40px))] py-16">
        <div className="rounded-lg border border-line bg-white p-10 text-center shadow-soft">
          <h1 className="mb-3 text-3xl font-black">Your cart is empty</h1>
          <p className="mb-6 text-muted">You have no items in your cart to pay for.</p>
          <Link
            to="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
          >
            Explore products
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-[min(1140px,calc(100%_-_40px))] py-12">
      <div className="mb-6">
        <Link
          to="/cart"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-2 inline-block text-xs font-extrabold uppercase text-teal-600">
              Razorpay Secure Checkout
            </span>
            <h1 className="text-4xl font-black md:text-5xl">Payment Page</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
            <ShieldCheck size={16} /> 100% Secure Payment Powered by Razorpay
          </div>
        </div>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-start"
      >
        <div className="grid gap-6">
          {message && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 font-medium text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
              {error}
            </p>
          )}

          {/* Step 1: Delivery Address */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="text-blue-600" size={20} />
                <h2 className="text-xl font-black">1. Delivery details</h2>
              </div>
              <span className="text-xs font-semibold text-muted">All fields required</span>
            </div>

            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <span className="mb-2 block text-xs font-bold uppercase text-muted">
                  Quick fill from saved addresses:
                </span>
                <div className="flex flex-wrap gap-2">
                  {savedAddresses.map((addr, idx) => (
                    <button
                      key={`${addr.label}-${idx}`}
                      type="button"
                      onClick={() => selectSavedAddress(addr)}
                      className={`rounded-lg border px-3 py-1.5 text-left text-xs font-bold transition ${
                        form.address === addr.address
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-line bg-slate-50 text-ink hover:border-blue-300"
                      }`}
                    >
                      {addr.label || "Address"}: {addr.city || addr.address?.slice(0, 22)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                Full name
                <input
                  className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Email address
                <input
                  className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold sm:col-span-2">
                Phone number (used for Razorpay & delivery updates)
                <input
                  className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold sm:col-span-2">
                Street address
                <textarea
                  className="min-h-20 rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                  placeholder="House/Flat No., Building, Street, Area"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                City
                <input
                  className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Postal code
                <input
                  className="rounded-lg border border-line px-4 py-2.5 font-normal outline-none focus:border-blue-500"
                  placeholder="PIN / Postal code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          {/* Step 2: Payment Gateway Selection */}
          <div className="rounded-xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="text-blue-600" size={20} />
              <h2 className="text-xl font-black">2. Select payment method</h2>
            </div>

            <div className="grid gap-3">
              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  form.paymentMethod === "razorpay"
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                    : "border-line hover:border-blue-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={form.paymentMethod === "razorpay"}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-base text-ink">
                      Razorpay Payment Gateway (UPI, Cards, NetBanking, Wallets)
                    </strong>
                    <span className="rounded-md bg-blue-600 px-2.5 py-0.5 text-xs font-extrabold text-white">
                      Razorpay
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Pay instantly using Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards, or
                    NetBanking via Razorpay.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded border border-line bg-white px-2.5 py-1">
                      <Smartphone size={13} className="text-blue-600" /> UPI / QR
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-line bg-white px-2.5 py-1">
                      <CreditCard size={13} className="text-blue-600" /> Visa / MasterCard / RuPay
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-line bg-white px-2.5 py-1">
                      <Building2 size={13} className="text-blue-600" /> NetBanking
                    </span>
                    <span className="inline-flex items-center gap-1 rounded border border-line bg-white px-2.5 py-1">
                      <Wallet size={13} className="text-blue-600" /> Wallets
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  form.paymentMethod === "cod"
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
                    : "border-line hover:border-blue-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={form.paymentMethod === "cod"}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-base text-ink">Cash on Delivery (COD)</strong>
                    <Truck size={18} className="text-slate-500" />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Pay in cash or UPI at the time of doorstep delivery.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Pay Action */}
        <aside className="sticky top-24 rounded-xl border border-line bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-black text-ink">Order summary</h2>
          <p className="mt-1 text-xs text-muted">
            {items.length} item{items.length === 1 ? "" : "s"} in your basket
          </p>

          <div className="mt-4 max-h-64 divide-y divide-line overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-3 py-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-14 w-11 shrink-0 rounded object-cover border border-line"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                  <p className="text-xs text-muted">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <strong className="text-sm font-extrabold text-ink">
                  ₹{item.price * item.quantity}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery charges</span>
              <span className="font-bold text-green-700">FREE</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-black text-ink">
              <span>Total Payable</span>
              <span>₹{total}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!items.length || submitting}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock size={17} />
            {submitting
              ? "Opening Razorpay..."
              : form.paymentMethod === "razorpay"
              ? `Pay ₹${total} with Razorpay`
              : `Place COD Order (₹${total})`}
          </button>

          <p className="mt-3 text-center text-xs text-muted">
            256-bit SSL encrypted payment powered by Razorpay
          </p>
        </aside>
      </form>

      {/* Interactive Razorpay Checkout Gateway Modal (when running in local test mode without live keys) */}
      {simulatedRzpOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Razorpay Checkout Gateway"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
            {/* Razorpay Header */}
            <div className="flex items-center justify-between bg-[#1e40af] px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white font-black text-blue-700 shadow-xs">
                  TR
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base leading-tight">TechReads Market</h3>
                    <span className="rounded bg-blue-500/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Razorpay
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 font-mono">{simulatedRzpOrder.orderId}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs text-blue-100">Amount</span>
                <strong className="text-xl font-black">₹{total}</strong>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 border-b border-line bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRzpTab("upi")}
                className={`flex items-center justify-center gap-1.5 py-3 transition ${
                  rzpTab === "upi"
                    ? "border-b-2 border-blue-600 bg-white text-blue-600"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Smartphone size={14} /> UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setRzpTab("card")}
                className={`flex items-center justify-center gap-1.5 py-3 transition ${
                  rzpTab === "card"
                    ? "border-b-2 border-blue-600 bg-white text-blue-600"
                    : "text-muted hover:text-ink"
                }`}
              >
                <CreditCard size={14} /> Card
              </button>
              <button
                type="button"
                onClick={() => setRzpTab("netbanking")}
                className={`flex items-center justify-center gap-1.5 py-3 transition ${
                  rzpTab === "netbanking"
                    ? "border-b-2 border-blue-600 bg-white text-blue-600"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Building2 size={14} /> NetBanking
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span>Customer: {form.name}</span>
                <span>{form.phone}</span>
              </div>

              {rzpTab === "upi" && (
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    {["Google Pay", "PhonePe", "Paytm"].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() =>
                          setUpiId(`${form.name.toLowerCase().replace(/\s+/g, "") || "user"}@okaxis`)
                        }
                        className="rounded-lg border border-line bg-slate-50 py-2.5 text-ink hover:border-blue-500 hover:bg-blue-50"
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                  <label className="grid gap-1 text-xs font-bold text-muted">
                    UPI ID / VPA
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      className="rounded-lg border border-line px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
              )}

              {rzpTab === "card" && (
                <div className="grid gap-3">
                  <label className="grid gap-1 text-xs font-bold text-muted">
                    Card Number
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4111 2222 3333 4444"
                      className="rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-blue-500"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-xs font-bold text-muted">
                      Expiry
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-blue-500"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-muted">
                      CVV
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {rzpTab === "netbanking" && (
                <div className="grid gap-2">
                  <span className="text-xs font-bold text-muted">Select your bank</span>
                  <div className="grid grid-cols-2 gap-2">
                    {["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setBankName(bank)}
                        className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition ${
                          bankName === bank
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-line bg-white text-ink hover:border-blue-300"
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-2.5">
                <button
                  type="button"
                  disabled={processingGateway}
                  onClick={() => handleSimulatedRazorpayComplete(false)}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={17} />
                  {processingGateway ? "Verifying payment..." : `Pay ₹${total} Now`}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={processingGateway}
                    onClick={() => handleSimulatedRazorpayComplete(true)}
                    className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Simulate Failure
                  </button>
                  <button
                    type="button"
                    disabled={processingGateway}
                    onClick={() => setSimulatedRzpOrder(null)}
                    className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted hover:bg-slate-50"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] text-muted">
                Secured by <strong>Razorpay</strong> · Add <code className="rounded bg-slate-100 px-1">RAZORPAY_KEY_ID</code> in <code className="rounded bg-slate-100 px-1">server/.env</code> for live Razorpay popup
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
