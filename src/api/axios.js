import axios from "axios";

// Automatically normalize the backend API base URL so that both
// "https://your-server.onrender.com" and "https://your-server.onrender.com/api" work seamlessly.
const getBaseURL = () => {
  let envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || !envUrl.trim()) {
    return "http://localhost:5000/api";
  }

  // Remove trailing slashes
  envUrl = envUrl.trim().replace(/\/+$/, "");

  // Ensure /api path is present for API routes
  if (!envUrl.endsWith("/api")) {
    envUrl = `${envUrl}/api`;
  }

  return envUrl;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use(
  (config) => {
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
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

