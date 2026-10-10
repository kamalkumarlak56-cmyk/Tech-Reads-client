import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Package, Plus, Trash2 } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../state/AuthContext.jsx";
import { readCache, writeCache } from "../utils/dataCache.js";

const emptyAddress = { label: "Home", address: "", city: "", postalCode: "" };
const initialsFor = (name) =>
  name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const profileCacheKey = user?._id ? `user_profile_${user._id}` : "user_profile";
  const ordersCacheKey = user?._id ? `user_orders_${user._id}` : "user_orders";

  const [orders, setOrders] = useState(() => readCache(ordersCacheKey, []));
  const [profile, setProfile] = useState(() => {
    const cached = readCache(profileCacheKey, null);
    return {
      name: cached?.name ?? user?.name ?? "",
      email: cached?.email ?? user?.email ?? "",
      phone: cached?.phone ?? user?.phone ?? "",
      avatar: cached?.avatar ?? user?.avatar ?? "",
      addresses: cached?.addresses ?? user?.addresses ?? []
    };
  });
  const [draftProfile, setDraftProfile] = useState(() => {
    const cached = readCache(profileCacheKey, null);
    return {
      name: cached?.name ?? user?.name ?? "",
      email: cached?.email ?? user?.email ?? "",
      phone: cached?.phone ?? user?.phone ?? "",
      avatar: cached?.avatar ?? user?.avatar ?? ""
    };
  });
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [recentViews, setRecentViews] = useState([]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressStatus, setAddressStatus] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/auth/profile")
      .then(({ data: profileData }) => {
        if (!active || !profileData) return;
        setProfile(profileData);
        setDraftProfile((prev) => (isEditing ? prev : profileData));
        writeCache(profileCacheKey, profileData);
      })
      .catch(() => {});

    api
      .get("/orders/my-orders")
      .then(({ data: orderData }) => {
        if (!active) return;
        const nextOrders = orderData || [];
        setOrders(nextOrders);
        writeCache(ordersCacheKey, nextOrders);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [profileCacheKey, ordersCacheKey]);

  useEffect(() => {
    if (!user?._id) {
      setRecentViews([]);
      return;
    }
    try {
      setRecentViews(JSON.parse(localStorage.getItem(`sellbooks_recent_views_${user._id}`) || "[]"));
    } catch {
      setRecentViews([]);
    }
  }, [user?._id]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      let finalAvatarUrl = draftProfile.avatar;

      // 1. If user selected a new avatar file, upload first
      if (avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);
        const { data: uploadRes } = await api.post("/upload?folder=avatars", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        finalAvatarUrl = uploadRes.url;
      }

      // 2. Persist updated profile to MongoDB (addresses are preserved)
      const { data } = await api.put("/auth/profile", {
        ...profile,
        ...draftProfile,
        avatar: finalAvatarUrl
      });

      setProfile(data);
      setDraftProfile(data);
      writeCache(profileCacheKey, data);
      updateUser(data);
      setAvatarFile(null);
      setStatus("Profile saved successfully.");
      setIsEditing(false);
    } catch (error) {
      setStatus(error.response?.data?.message || "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  // Add address directly to MongoDB database
  const handleAddAddress = async (event) => {
    event?.preventDefault();
    if (!newAddress.address.trim()) {
      setAddressStatus("Please enter a street address.");
      return;
    }

    const newEntry = {
      label: newAddress.label.trim() || "Home",
      address: newAddress.address.trim(),
      city: newAddress.city.trim(),
      postalCode: newAddress.postalCode.trim()
    };
    const updatedAddresses = [...(profile.addresses || []), newEntry];

    setAddressSaving(true);
    setAddressStatus("");
    try {
      const { data } = await api.put("/auth/profile", {
        addresses: updatedAddresses
      });
      setProfile((prev) => {
        const next = { ...prev, addresses: data.addresses || [] };
        writeCache(profileCacheKey, next);
        return next;
      });
      updateUser({ addresses: data.addresses || [] });
      setNewAddress(emptyAddress);
      setAddressStatus("Address added and saved successfully!");
      setTimeout(() => setAddressStatus(""), 3500);
    } catch (err) {
      setAddressStatus(err.response?.data?.message || "Failed to save address. Please try again.");
    } finally {
      setAddressSaving(false);
    }
  };

  // Delete address permanently from MongoDB database
  const handleRemoveAddress = async (indexToRemove) => {
    const updatedAddresses = (profile.addresses || []).filter((_, idx) => idx !== indexToRemove);
    setAddressSaving(true);
    setAddressStatus("");
    try {
      const { data } = await api.put("/auth/profile", {
        addresses: updatedAddresses
      });
      setProfile((prev) => {
        const next = { ...prev, addresses: data.addresses || [] };
        writeCache(profileCacheKey, next);
        return next;
      });
      updateUser({ addresses: data.addresses || [] });
      setAddressStatus("Address deleted successfully.");
      setTimeout(() => setAddressStatus(""), 3000);
    } catch (err) {
      setAddressStatus(err.response?.data?.message || "Failed to delete address. Please try again.");
    } finally {
      setAddressSaving(false);
    }
  };

  const chooseProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus("Please choose an image file.");
    if (file.size > 5 * 1024 * 1024) return setStatus("Choose an image smaller than 5 MB.");

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setDraftProfile((prev) => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  return (
    <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
      <div className="mb-8">
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">
          My account
        </span>
        <h1 className="text-4xl font-black md:text-5xl">Profile & dashboard</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="h-max rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            {profile.avatar ? (
              <img
                className="h-20 w-20 rounded-full object-cover"
                src={profile.avatar}
                alt={`${profile.name}'s profile`}
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">
                {initialsFor(profile.name)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black">{profile.name || "Your profile"}</h2>
              <p className="truncate text-sm text-muted">{profile.email}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5 text-center">
            <div>
              <strong className="block text-2xl">{orders.length}</strong>
              <span className="text-sm text-muted">Orders</span>
            </div>
            <div>
              <strong className="block text-2xl">{(profile.addresses || []).length}</strong>
              <span className="text-sm text-muted">Addresses</span>
            </div>
          </div>
        </aside>

        <form onSubmit={saveProfile} className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Personal details</h2>
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setDraftProfile(profile);
                  setStatus("");
                  setIsEditing(true);
                }}
                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50"
              >
                Edit profile
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                Full name
                <input
                  className="rounded-lg border border-line px-4 py-3 font-normal outline-none focus:border-blue-500"
                  value={draftProfile.name}
                  onChange={(event) =>
                    setDraftProfile({ ...draftProfile, name: event.target.value })
                  }
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Email address
                <input
                  className="rounded-lg border border-line bg-slate-50 px-4 py-3 font-normal text-muted"
                  value={draftProfile.email}
                  readOnly
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Phone number
                <input
                  className="rounded-lg border border-line px-4 py-3 font-normal outline-none focus:border-blue-500"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={draftProfile.phone || ""}
                  onChange={(event) =>
                    setDraftProfile({ ...draftProfile, phone: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Profile picture
                <input
                  className="rounded-lg border border-line bg-white px-3 py-2 font-normal file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
                  type="file"
                  accept="image/*"
                  onChange={chooseProfileImage}
                />
                <span className="font-normal text-xs text-muted">
                  JPG, PNG, or WebP up to 5 MB.
                </span>
              </label>
              {draftProfile.avatar && (
                <div className="col-span-full flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-muted">Preview:</span>
                  <img
                    className="h-12 w-12 rounded-full object-cover border border-line"
                    src={draftProfile.avatar}
                    alt="Preview"
                  />
                </div>
              )}
            </div>
          ) : (
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-bold text-muted">Full name</dt>
                <dd className="mt-1 text-lg font-semibold">{profile.name || "Not added"}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-muted">Email address</dt>
                <dd className="mt-1 text-lg font-semibold">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-muted">Phone number</dt>
                <dd className="mt-1 text-lg font-semibold">{profile.phone || "Not added"}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-muted">Profile picture</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {profile.avatar ? "Added" : "Not added"}
                </dd>
              </div>
            </dl>
          )}
          {status && (
            <p
              className={`mt-4 text-sm font-medium ${
                status.includes("successfully") ? "text-green-700" : "text-red-600"
              }`}
              role="status"
            >
              {status}
            </p>
          )}
          {isEditing && (
            <div className="mt-5 flex gap-3">
              <button
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Uploading..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftProfile(profile);
                  setAvatarFile(null);
                  setIsEditing(false);
                  setStatus("");
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-5 py-2 font-bold text-muted hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Saved addresses section - directly saved to and removed from MongoDB */}
      <section className="mt-8 rounded-lg border border-line bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="text-blue-600" size={21} />
            <h2 className="text-2xl font-black">Saved addresses</h2>
          </div>
          <span className="text-xs font-semibold text-muted">
            {(profile.addresses || []).length} saved
          </span>
        </div>

        {addressStatus && (
          <p
            className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
              addressStatus.includes("successfully") || addressStatus.includes("deleted")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="status"
          >
            {addressStatus}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {(profile.addresses || []).map((address, index) => (
            <article
              className="flex flex-col justify-between rounded-lg border border-line p-5 shadow-sm"
              key={`${address.address}-${index}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-base text-ink">{address.label || "Address"}</strong>
                  <button
                    type="button"
                    disabled={addressSaving}
                    onClick={() => handleRemoveAddress(index)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                    title="Delete address"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {address.address}
                  {address.city && `, ${address.city}`}
                  {address.postalCode && ` — ${address.postalCode}`}
                </p>
              </div>
            </article>
          ))}
          {(!profile.addresses || profile.addresses.length === 0) && (
            <p className="col-span-full rounded-lg border border-dashed border-line p-5 text-sm text-muted">
              No saved addresses yet. Add your delivery address below.
            </p>
          )}
        </div>

        <form
          onSubmit={handleAddAddress}
          className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-4"
        >
          <input
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Label (e.g. Home, Office)"
            value={newAddress.label}
            onChange={(event) => setNewAddress({ ...newAddress, label: event.target.value })}
          />
          <input
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Street address *"
            required
            value={newAddress.address}
            onChange={(event) => setNewAddress({ ...newAddress, address: event.target.value })}
          />
          <input
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="City"
            value={newAddress.city}
            onChange={(event) => setNewAddress({ ...newAddress, city: event.target.value })}
          />
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Postal code"
              value={newAddress.postalCode}
              onChange={(event) =>
                setNewAddress({ ...newAddress, postalCode: event.target.value })
              }
            />
            <button
              type="submit"
              disabled={addressSaving || !newAddress.address.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} /> {addressSaving ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <Package className="text-blue-600" size={21} />
            <h2 className="text-2xl font-black">My orders</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-muted">No orders yet. Your purchases will appear here.</p>
          ) : (
            orders.map((order) => (
              <div
                className="grid gap-2 border-t border-line py-4 sm:grid-cols-[1fr_auto]"
                key={order._id}
              >
                <div>
                  <strong>{(order.items || []).map((item) => item.title).filter(Boolean).join(", ") || "Order items"}</strong>
                  <p className="mt-1 text-sm text-muted">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""} · {(order.items || []).length} item
                    {(order.items || []).length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <strong>₹{order.totalPrice}</strong>
                  <span className="mt-1 block text-sm capitalize text-muted">{order.status}</span>
                </div>
              </div>
            ))
          )}
        </section>
        <section className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <h2 className="mb-5 text-2xl font-black">Recently viewed</h2>
          {recentViews.length === 0 ? (
            <p className="text-muted">Books you open will be saved here for quick access.</p>
          ) : (
            <div className="grid gap-4">
              {recentViews.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="flex items-center gap-4 rounded-lg border border-line p-3 transition hover:border-blue-300"
                >
                  <img className="h-16 w-16 rounded-md object-cover" src={product.image} alt="" />
                  <div className="min-w-0">
                    <strong className="block truncate">{product.title}</strong>
                    <span className="text-sm text-muted">
                      {product.author || product.technology}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

