import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("sellbooks_user") || "null");
  } catch {
    user = null;
  }

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

export default api;
