import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import {
  clearUserCache,
  prefetchAccountData,
  prefetchCatalog,
  writeCache
} from "../utils/dataCache.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sellbooks_user") || "null");
    } catch {
      return null;
    }
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    prefetchCatalog();
    if (user?.token) {
      prefetchAccountData(user);
    }
  }, [user?.token, user?.role, user?._id]);

  const saveUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("sellbooks_user", JSON.stringify(nextUser));

    if (nextUser) {
      const profileSnapshot = {
        _id: nextUser._id,
        name: nextUser.name || "",
        email: nextUser.email || "",
        role: nextUser.role || "user",
        phone: nextUser.phone || "",
        avatar: nextUser.avatar || "",
        addresses: nextUser.addresses || [],
        createdAt: nextUser.createdAt
      };
      if (nextUser.role === "admin") {
        writeCache("admin_profile", profileSnapshot);
      } else if (nextUser._id) {
        writeCache(`user_profile_${nextUser._id}`, profileSnapshot);
      }
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveUser(data);
    prefetchAccountData(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    saveUser(data);
    prefetchAccountData(data);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    saveUser(data);
    prefetchAccountData(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sellbooks_user");
    clearUserCache();
  };

  const logoutWithDelay = (onRedirect, delayMs = 1400) => {
    setIsLoggingOut(true);
    prefetchCatalog();
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem("sellbooks_user");
      clearUserCache();
      onRedirect?.();
      setIsLoggingOut(false);
    }, delayMs);
  };

  const updateUser = (profile) => {
    saveUser({ ...user, ...profile, token: user?.token });
  };

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      googleLogin,
      logout,
      logoutWithDelay,
      isLoggingOut,
      updateUser,
      isAdmin: user?.role === "admin"
    }),
    [user, isLoggingOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
