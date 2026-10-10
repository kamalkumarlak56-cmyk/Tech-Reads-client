import api from "../api/axios";

const CACHE_PREFIX = "techreads_cache_v1_";
const memoryCache = new Map();

export function readCache(key, fallback = null) {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeCache(key, value) {
  memoryCache.set(key, value);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearUserCache() {
  const keysToKeep = ["products"];
  for (const key of Array.from(memoryCache.keys())) {
    if (!keysToKeep.includes(key)) {
      memoryCache.delete(key);
    }
  }
  try {
    Object.keys(localStorage).forEach((storageKey) => {
      if (
        storageKey.startsWith(CACHE_PREFIX) &&
        storageKey !== `${CACHE_PREFIX}products`
      ) {
        localStorage.removeItem(storageKey);
      }
    });
  } catch {
    // Ignore storage errors
  }
}

export async function prefetchCatalog() {
  try {
    const { data } = await api.get("/products", { params: { sort: "latest" } });
    if (Array.isArray(data)) {
      writeCache("products", data);
    }
    return data;
  } catch {
    return readCache("products", []);
  }
}

export async function prefetchAccountData(user) {
  if (!user?.token) return;

  if (user.role === "admin") {
    await Promise.allSettled([
      api.get("/products").then(({ data }) => writeCache("products", data || [])),
      api.get("/orders").then(({ data }) => writeCache("admin_orders", data || [])),
      api.get("/auth/users").then(({ data }) => writeCache("admin_users", data || [])),
      api.get("/issues").then(({ data }) => writeCache("admin_issues", data || [])),
      api.get("/auth/profile").then(({ data }) => writeCache("admin_profile", data || null))
    ]);
  } else {
    await Promise.allSettled([
      api.get("/products", { params: { sort: "latest" } }).then(({ data }) => writeCache("products", data || [])),
      api.get("/auth/profile").then(({ data }) => writeCache(`user_profile_${user._id}`, data || null)),
      api.get("/orders/my-orders").then(({ data }) => writeCache(`user_orders_${user._id}`, data || []))
    ]);
  }
}
