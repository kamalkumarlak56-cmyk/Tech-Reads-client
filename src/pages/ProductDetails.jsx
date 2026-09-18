import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingBag, Star } from "lucide-react";
import api from "../api/axios.js";
import { useCart } from "../state/CartContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { sampleProducts } from "../data/sampleProducts.js";
import { sampleReviews } from "../data/sampleReviews.js";

const getSampleReviews = (product) => {
  const sampleProduct = sampleProducts.find((item) => item.title === product.title);
  return sampleReviews.filter((review) => review.product === sampleProduct?._id);
};

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: productData }, { data: reviewData }] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/${id}`)
        ]);
        setProduct(productData);
        setReviews(reviewData.length ? reviewData : getSampleReviews(productData));
      } catch {
        const fallbackProduct = sampleProducts.find((item) => item._id === id) || sampleProducts[0];
        setProduct(fallbackProduct);
        setReviews(getSampleReviews(fallbackProduct));
      }
    };

    setShowAllReviews(false);
    load();
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    const { data } = await api.post(`/reviews/${id}`, form);
    setReviews([data, ...reviews]);
    setForm({ rating: 5, comment: "" });
  };

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 5);
  const handleAddToCart = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    addToCart(product);
  };

  if (!product) return <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16"><p>Loading...</p></section>;

  const relatedBooks = sampleProducts
    .filter((item) => item.category === "Book" && item.title !== product.title)
    .sort((a, b) => Number(b.technology === product.technology) - Number(a.technology === product.technology))
    .slice(0, 3);

  return (
    <section className="mx-auto grid w-[min(1180px,calc(100%_-_40px))] gap-9 py-16 lg:grid-cols-[0.9fr_1.1fr]">
      <img className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft" src={product.image} alt={product.title} />
      <div>
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">{product.category} / {product.technology}</span>
        <h1 className="mb-5 text-4xl font-black leading-tight md:text-6xl">{product.title}</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">{product.description}</p>
        <p className="mt-3 text-muted">By {product.author || "TechReads Editorial"}</p>
        <div className="my-5 flex items-center gap-5 text-2xl">
          <strong>₹{product.price}</strong>
          <span className="inline-flex items-center gap-1 text-base font-bold text-amber-700"><Star size={17} fill="currentColor" /> {product.rating?.toFixed?.(1) || "0.0"}</span>
        </div>
        <p className="mb-5 text-sm text-muted">{reviews.length} people rated this book · {reviews.length} reviews</p>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700" onClick={handleAddToCart}>
          <ShoppingBag size={18} />
          Add to cart
        </button>
      </div>

      <div className="mt-2 lg:col-span-2">
        <h2 className="mb-4 text-2xl font-black">Reviews for {product.title} ({reviews.length})</h2>
        {user && (
          <form onSubmit={submitReview} className="mb-6 grid gap-3 rounded-lg border border-line bg-white p-6 shadow-sm">
            <select className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
            </select>
            <textarea
              className="min-h-28 rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Share your review"
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              required
            />
            <button className="inline-flex min-h-10 w-max items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Post review</button>
          </form>
        )}
        {reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {visibleReviews.map((review, index) => (
            <article className="rounded-lg border border-line bg-white p-5 shadow-sm" key={review._id || `${review.product}-${review.user?.name}-${index}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong>{review.user?.name || "Reader"}</strong>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700"><Star size={16} fill="currentColor" /> {review.rating}/5</span>
              </div>
              <p className="text-muted">{review.comment}</p>
            </article>
          ))}
        </div>
        {reviews.length > 5 && (
          <button
            type="button"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-600 px-5 py-2 font-bold text-blue-600 transition hover:bg-blue-50"
            onClick={() => setShowAllReviews(!showAllReviews)}
          >
            {showAllReviews ? "Show less" : "See more"}
          </button>
        )}
      </div>

      <section className="border-t border-line pt-10 lg:col-span-2">
        <div className="mb-7">
          <span className="mb-2 inline-block text-xs font-extrabold uppercase text-teal-600">Keep exploring</span>
          <h2 className="text-3xl font-black text-ink md:text-4xl">Related books</h2>
          <p className="mt-2 text-muted">More books on {product.technology || "related technology topics"}.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {relatedBooks.map((book) => <ProductCard key={book._id} product={book} />)}
        </div>
      </section>
    </section>
  );
}
