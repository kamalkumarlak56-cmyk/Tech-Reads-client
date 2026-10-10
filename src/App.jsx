import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Footer from "./components/Footer.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
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
import Reviews from "./pages/Reviews.jsx";
import { useAuth } from "./state/AuthContext.jsx";

const ROUTE_SEO = {
  "/": {
    title: "TechReads Market — Curated Tech Books, Articles & Newspapers",
    description:
      "Discover curated technology books, programming guides, articles, and newspapers for AI, web development, cloud, and software engineering."
  },
  "/products": {
    title: "Browse Tech Books & Publications | TechReads Market",
    description:
      "Explore our catalog of engineering books, developer articles, and tech newspapers with instant filtering and ratings."
  },
  "/reviews": {
    title: "Reader Reviews & Ratings | TechReads Market",
    description: "Read verified community reviews and ratings on top technology books and publications."
  },
  "/about": {
    title: "About Us | TechReads Market",
    description: "Learn how TechReads curates the best technology books and publications for software builders."
  },
  "/contact": {
    title: "Contact Support | TechReads Market",
    description: "Get in touch with the TechReads team for order support, catalog inquiries, or feedback."
  },
  "/dashboard": {
    title: "My Account & Orders | TechReads Market",
    description: "Manage your TechReads profile, delivery addresses, and order history."
  },
  "/payment": {
    title: "Razorpay Secure Payment | TechReads Market",
    description: "Complete your TechReads order securely via Razorpay UPI, Card, NetBanking, or Cash on Delivery."
  },
  "/checkout": {
    title: "Razorpay Secure Payment | TechReads Market",
    description: "Complete your TechReads order securely via Razorpay UPI, Card, NetBanking, or Cash on Delivery."
  },
  "/admin": {
    title: "Admin Dashboard | TechReads Market",
    description: "Manage products, customer orders, payments, and registered users on TechReads Market."
  }
};

export default function App() {
  const { isAdmin, isLoggingOut } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const baseRoute = location.pathname.startsWith("/admin") ? "/admin" : location.pathname;
    const seo = ROUTE_SEO[baseRoute] || ROUTE_SEO["/"];
    document.title = seo.title;
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", seo.description);
  }, [location.pathname]);

  if (isLoggingOut) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 px-6 text-center text-ink"
        role="status"
        aria-live="polite"
      >
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/30" />
          <span className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-ink">Signing you out...</h2>
        <p className="mt-2 text-sm font-medium text-muted">
          Redirecting you to the home page, please wait a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
          <Route path="/admin/add-product" element={<AdminRoute><AdminLayout><AddProduct /></AdminLayout></AdminRoute>} />
          <Route path="/admin/products/:id/edit" element={<AdminRoute><AdminLayout><AddProduct /></AdminLayout></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminLayout><AdminDashboard view="products" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminDashboard view="users" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/users/:userId" element={<AdminRoute><AdminLayout><AdminDashboard view="users" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminLayout><AdminDashboard view="orders" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminLayout><AdminDashboard view="payments" /></AdminLayout></AdminRoute>} />
          <Route path="/admin/user-issues" element={<AdminRoute><AdminLayout><AdminDashboard view="issues" /></AdminLayout></AdminRoute>} />
        </Routes>
      </main>
      {!isAdmin && !isAuthPage && <Footer />}
    </div>
  );
}
