import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Footer from "./components/Footer.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import About from "./pages/About.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Contact from "./pages/Contact.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Products from "./pages/Products.jsx";
import Register from "./pages/Register.jsx";
import { useAuth } from "./state/AuthContext.jsx";
import { useLocation } from "react-router-dom";

export default function App() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      {!isAuthPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
          <Route path="/admin/add-product" element={<AdminRoute><AdminLayout><AddProduct /></AdminLayout></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminLayout><AdminDashboard view="products" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminDashboard view="users" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminLayout><AdminDashboard view="payments" /></AdminLayout></AdminRoute>} />
        </Routes>
      </main>
      {!isAdmin && !isAuthPage && <Footer />}
    </div>
  );
}
