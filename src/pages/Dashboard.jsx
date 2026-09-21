import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Package, Plus, Trash2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../state/AuthContext.jsx";

const emptyAddress = { label: "Home", address: "", city: "", postalCode: "" };
const initialsFor = (name) => name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: "", avatar: "", addresses: [] });
  const [draftProfile, setDraftProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: "", avatar: "" });
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [recentViews, setRecentViews] = useState([]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: profileData }, { data: orderData }] = await Promise.all([api.get("/auth/profile"), api.get("/orders/my-orders")]);
        setProfile(profileData);
        setDraftProfile(profileData);
        setOrders(orderData);
      } catch {
        setStatus("We could not load all account information. Please refresh and try again.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    setRecentViews(JSON.parse(localStorage.getItem(`sellbooks_recent_views_${user?._id}`) || "[]"));
  }, [user?._id]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const { data } = await api.put("/auth/profile", { ...profile, ...draftProfile });
      setProfile(data);
      setDraftProfile(data);
      updateUser(data);
      setStatus("Profile saved successfully.");
      setIsEditing(false);
    } catch (error) {
      setStatus(error.response?.data?.message || "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    if (!newAddress.address.trim()) return;
    setProfile({ ...profile, addresses: [...profile.addresses, { ...newAddress, address: newAddress.address.trim() }] });
    setNewAddress(emptyAddress);
  };

  const chooseProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus("Please choose an image file.");
    if (file.size > 2 * 1024 * 1024) return setStatus("Choose an image smaller than 2 MB.");

    const reader = new FileReader();
    reader.onload = () => setDraftProfile({ ...draftProfile, avatar: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
      <div className="mb-8"><span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">My account</span><h1 className="text-4xl font-black md:text-5xl">Profile & dashboard</h1></div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="h-max rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            {profile.avatar ? <img className="h-20 w-20 rounded-full object-cover" src={profile.avatar} alt={`${profile.name}'s profile`} /> : <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">{initialsFor(profile.name)}</div>}
            <div className="min-w-0"><h2 className="truncate text-xl font-black">{profile.name || "Your profile"}</h2><p className="truncate text-sm text-muted">{profile.email}</p></div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 text-center"><div><strong className="block text-2xl">{orders.length}</strong><span className="text-sm text-muted">Orders</span></div><div><strong className="block text-2xl">{profile.addresses.length}</strong><span className="text-sm text-muted">Addresses</span></div></div>
        </aside>

        <form onSubmit={saveProfile} className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">Personal details</h2>{!isEditing && <button type="button" onClick={() => { setDraftProfile(profile); setStatus(""); setIsEditing(true); }} className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50">Edit profile</button>}</div>
          {isEditing ? <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">Full name<input className="rounded-lg border border-line px-4 py-3 font-normal outline-none focus:border-blue-500" value={draftProfile.name} onChange={(event) => setDraftProfile({ ...draftProfile, name: event.target.value })} required /></label>
            <label className="grid gap-1 text-sm font-bold">Email address<input className="rounded-lg border border-line bg-slate-50 px-4 py-3 font-normal text-muted" value={draftProfile.email} readOnly /></label>
            <label className="grid gap-1 text-sm font-bold">Phone number<input className="rounded-lg border border-line px-4 py-3 font-normal outline-none focus:border-blue-500" type="tel" placeholder="+91 98765 43210" value={draftProfile.phone || ""} onChange={(event) => setDraftProfile({ ...draftProfile, phone: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-bold">Profile picture<input className="rounded-lg border border-line bg-white px-3 py-2 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700" type="file" accept="image/*" onChange={chooseProfileImage} /><span className="font-normal text-xs text-muted">JPG, PNG, or WebP up to 2 MB.</span></label>
          </div> : <dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm font-bold text-muted">Full name</dt><dd className="mt-1 text-lg font-semibold">{profile.name || "Not added"}</dd></div><div><dt className="text-sm font-bold text-muted">Email address</dt><dd className="mt-1 text-lg font-semibold">{profile.email}</dd></div><div><dt className="text-sm font-bold text-muted">Phone number</dt><dd className="mt-1 text-lg font-semibold">{profile.phone || "Not added"}</dd></div><div><dt className="text-sm font-bold text-muted">Profile picture</dt><dd className="mt-1 text-lg font-semibold">{profile.avatar ? "Added" : "Not added"}</dd></div></dl>}
          {status && <p className={`mt-4 text-sm font-medium ${status.includes("successfully") ? "text-green-700" : "text-red-600"}`} role="status">{status}</p>}
          {isEditing && <div className="mt-5 flex gap-3"><button disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button><button type="button" onClick={() => { setDraftProfile(profile); setIsEditing(false); setStatus(""); }} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-5 py-2 font-bold text-muted hover:bg-slate-50">Cancel</button></div>}
        </form>
      </div>

      <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-2"><MapPin className="text-blue-600" size={21} /><h2 className="text-2xl font-black">Saved addresses</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          {profile.addresses.map((address, index) => <article className="rounded-lg border border-line p-5" key={`${address.address}-${index}`}><strong>{address.label || "Address"}</strong><p className="mt-2 text-sm leading-6 text-muted">{address.address}{address.city && `, ${address.city}`}{address.postalCode && ` — ${address.postalCode}`}</p><button type="button" onClick={() => setProfile({ ...profile, addresses: profile.addresses.filter((_, addressIndex) => addressIndex !== index) })} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700"><Trash2 size={15} /> Remove</button></article>)}
          {!profile.addresses.length && <p className="rounded-lg border border-dashed border-line p-5 text-sm text-muted">No saved addresses yet.</p>}
        </div>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-4">
          <input className="rounded-lg border border-line px-3 py-2" placeholder="Label (Home)" value={newAddress.label} onChange={(event) => setNewAddress({ ...newAddress, label: event.target.value })} />
          <input className="rounded-lg border border-line px-3 py-2" placeholder="Street address" value={newAddress.address} onChange={(event) => setNewAddress({ ...newAddress, address: event.target.value })} />
          <input className="rounded-lg border border-line px-3 py-2" placeholder="City" value={newAddress.city} onChange={(event) => setNewAddress({ ...newAddress, city: event.target.value })} />
          <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2" placeholder="Postal code" value={newAddress.postalCode} onChange={(event) => setNewAddress({ ...newAddress, postalCode: event.target.value })} /><button type="button" onClick={addAddress} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 font-bold text-white hover:bg-blue-700"><Plus size={17} /> Add</button></div>
        </div>
        <p className="mt-3 text-xs text-muted">Save profile after adding or removing addresses.</p>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-6 shadow-soft"><div className="mb-5 flex items-center gap-2"><Package className="text-blue-600" size={21} /><h2 className="text-2xl font-black">My orders</h2></div>{orders.length === 0 ? <p className="text-muted">No orders yet. Your purchases will appear here.</p> : orders.map((order) => <div className="grid gap-2 border-t border-line py-4 sm:grid-cols-[1fr_auto]" key={order._id}><div><strong>{order.items.map((item) => item.title).join(", ")}</strong><p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item{order.items.length === 1 ? "" : "s"}</p></div><div className="text-left sm:text-right"><strong>₹{order.totalPrice}</strong><span className="mt-1 block text-sm capitalize text-muted">{order.status}</span></div></div>)}</section>
        <section className="rounded-lg border border-line bg-white p-6 shadow-soft"><h2 className="mb-5 text-2xl font-black">Recently viewed</h2>{recentViews.length === 0 ? <p className="text-muted">Books you open will be saved here for quick access.</p> : <div className="grid gap-4">{recentViews.map((product) => <Link key={product._id} to={`/products/${product._id}`} className="flex items-center gap-4 rounded-lg border border-line p-3 transition hover:border-blue-300"><img className="h-16 w-16 rounded-md object-cover" src={product.image} alt="" /><div className="min-w-0"><strong className="block truncate">{product.title}</strong><span className="text-sm text-muted">{product.author || product.technology}</span></div></Link>)}</div>}</section>
      </div>
    </section>
  );
}
