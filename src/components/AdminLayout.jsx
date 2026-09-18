import { NavLink } from "react-router-dom";
import { BarChart3, BookPlus, BookOpen, CreditCard, Users } from "lucide-react";

const links = [
  ["/admin", "Dashboard", BarChart3],
  ["/admin/add-product", "Add product", BookPlus],
  ["/admin/products", "All products", BookOpen],
  ["/admin/users", "Users", Users],
  ["/admin/payments", "Payments", CreditCard]
];

export default function AdminLayout({ children }) {
  return (
    <div className="mx-auto flex w-[min(1280px,calc(100%_-_40px))] gap-8 py-8">
      <aside className="hidden w-56 flex-none rounded-lg border border-line bg-white p-4 shadow-soft md:block">
        <nav className="grid gap-1">
          {links.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/admin"}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
