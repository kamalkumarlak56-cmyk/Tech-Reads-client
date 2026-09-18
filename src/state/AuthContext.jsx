import { createContext, useContext, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("sellbooks_user") || "null"));

  const saveUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("sellbooks_user", JSON.stringify(nextUser));
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveUser(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    saveUser(data);
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    saveUser(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sellbooks_user");
  };

  const value = useMemo(
    () => ({ user, login, register, googleLogin, logout, isAdmin: user?.role === "admin" }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
