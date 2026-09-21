import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { useCart } from "../state/CartContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    addToCart(product);
  };

  const handleOpenDetails = (event) => {
    // Links and the cart button have their own actions. Clicking anywhere else
    // on the card opens this book's detail page.
    if (event.target.closest("a, button")) return;
    navigate(`/products/${product._id}`);
  };

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-lg border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={handleOpenDetails}
    >
      <Link to={`/products/${product._id}`}>
        <img
          className="aspect-[4/3] w-full object-cover"
          src={product.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"}
          alt={product.title}
        />
      </Link>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-soft px-2 py-1 text-xs font-bold text-blue-700">{product.category}</span>
          <span className="rounded-md bg-soft px-2 py-1 text-xs font-bold text-blue-700">{product.technology || "Technology"}</span>
        </div>
        <Link to={`/products/${product._id}`} className="mb-2 block min-h-14 text-lg font-extrabold leading-7 text-ink hover:text-blue-600">{product.title}</Link>
        <p className="line-clamp-3 min-h-[72px] text-sm leading-6 text-muted">{product.description}</p>
        <Link
          to={`/products/${product._id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          View details <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <div className="my-4 flex items-center justify-between gap-3">
          <strong className="text-lg">₹{product.price}</strong>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700"><Star size={16} /> {product.rating?.toFixed?.(1) || "0.0"}</span>
        </div>
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700" onClick={handleAddToCart}>
          <ShoppingBag size={18} />
          Add to cart
        </button>
      </div>
    </article>
  );
}
