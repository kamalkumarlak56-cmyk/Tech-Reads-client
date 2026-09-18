import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
}
