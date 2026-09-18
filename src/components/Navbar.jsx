import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, ShoppingCart, UserCircle } from "lucide-react";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";

const navLinkClass = ({ isActive }) =>
  `whitespace-nowrap text-sm font-medium transition ${isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-line/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur lg:px-16">
      <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-blue-600">
        <BookOpen size={24} />
        <span>TechReads</span>
      </Link>
      <nav className="order-3 flex w-full gap-5 overflow-x-auto pb-1 lg:order-none lg:w-auto lg:pb-0">
        {isAdmin ? (
          <NavLink to="/admin" className={navLinkClass}>Admin panel</NavLink>
        ) : (
          <>
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Products</NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
          </>
        )}
      </nav>
      <div className="flex items-center gap-2">
        {!isAdmin && <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-ink transition hover:border-blue-300 hover:text-blue-600" title="Cart">
          <ShoppingCart size={19} />
          {items.length > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-teal-600 px-1 text-xs font-bold text-white">{items.length}</span>}
        </Link>}
        {user ? (
          <>
            {!isAdmin && <Link to="/dashboard" className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-ink transition hover:border-blue-300 hover:text-blue-600" title="Dashboard">
              <UserCircle size={20} />
            </Link>}
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white text-ink transition hover:border-blue-300 hover:text-blue-600" onClick={handleLogout} title="Logout">
              <LogOut size={19} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">Login</Link>
            <Link to="/register" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-600 px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
