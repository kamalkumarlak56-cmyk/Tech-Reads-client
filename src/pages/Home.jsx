import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import { sampleProducts } from "../data/sampleProducts.js";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await api.get("/products", { params: { sort: "latest" } });
        setProducts(data);
      } catch {
        // The sample catalog keeps the homepage useful when the API is unavailable.
        setProducts([]);
      }
    };

    loadProducts();
  }, []);

  const catalogProducts = useMemo(() => {
    const productsByTitle = new Map(sampleProducts.map((product) => [product.title, product]));
    products.forEach((product) => productsByTitle.set(product.title, product));
    return [...productsByTitle.values()];
  }, [products]);

  const books = catalogProducts.filter((product) => product.category === "Book");
  const newArrivalBooks = [...books]
    .sort((a, b) => {
      const newestFirst = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return newestFirst || sampleProducts.indexOf(b) - sampleProducts.indexOf(a);
    })
    .slice(0, 3);
  const mostPurchasedBooks = [...books].sort((a, b) => b.purchasedCount - a.purchasedCount).slice(0, 3);
  const mostRatedBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return (
    <>
      <section className="flex min-h-[620px] items-center bg-[linear-gradient(90deg,rgba(13,22,38,0.82),rgba(13,22,38,0.42)),url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center px-5 py-20 text-white lg:px-20">
        <div className="max-w-3xl">
          <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-200">Books. Articles. Newspapers.</span>
          <h1 className="mb-5 max-w-4xl text-5xl font-black leading-none md:text-7xl lg:text-8xl">Read the future of technology.</h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-200">
            A curated marketplace for AI, web development, cybersecurity, cloud,
            blockchain, and the ideas shaping modern software.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700">
              Browse products <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/50 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20">About us</Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-[min(1180px,calc(100%_-_40px))]">
          <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Just in</span>
              <h2 className="text-3xl font-black text-ink md:text-4xl">New arrival books</h2>
              <p className="mt-2 text-muted">Fresh reads for your technology bookshelf.</p>
            </div>
            <Link to="/products" className="font-bold text-blue-600 hover:text-blue-700">View all books</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newArrivalBooks.map((product) => <ProductCard key={`new-${product._id}`} product={product} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
        <div className="mb-7">
          <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Featured</span>
          <h2 className="text-3xl font-black tracking-normal text-ink md:text-4xl">Latest technology picks</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {catalogProducts.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-[min(1180px,calc(100%_-_40px))]">
          <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Trending</span>
              <h2 className="text-3xl font-black text-ink md:text-4xl">Most purchased books</h2>
            </div>
            <Link to="/products" className="font-bold text-blue-600 hover:text-blue-700">View all products</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mostPurchasedBooks.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
        <div className="mb-7">
          <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Reader favorites</span>
          <h2 className="text-3xl font-black text-ink md:text-4xl">Most rated books</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mostRatedBooks.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

    </>
  );
}
