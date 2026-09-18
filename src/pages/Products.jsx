import { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import { sampleProducts } from "../data/sampleProducts.js";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "", sort: "latest" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await api.get("/products", { params: filters });
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters]);

  const catalogProducts = useMemo(() => {
    const productsByTitle = new Map(sampleProducts.map((product) => [product.title, product]));
    products.forEach((product) => productsByTitle.set(product.title, product));
    return [...productsByTitle.values()];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    const matchingProducts = catalogProducts.filter((product) => {
      const matchesSearch = !searchTerm || [product.title, product.author, product.technology]
        .some((value) => value?.toLowerCase().includes(searchTerm));
      const matchesCategory = !filters.category || product.category === filters.category;
      return matchesSearch && matchesCategory;
    });

    return [...matchingProducts].sort((a, b) => {
      if (filters.sort === "priceLow") return a.price - b.price;
      if (filters.sort === "priceHigh") return b.price - a.price;
      if (filters.sort === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [catalogProducts, filters]);
  const rankingBooks = catalogProducts.filter((product) => product.category === "Book");
  const mostPurchasedBooks = [...rankingBooks].sort((a, b) => (b.purchasedCount || 0) - (a.purchasedCount || 0)).slice(0, 3);
  const mostRatedBooks = [...rankingBooks].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
  const hasActiveFilters = Boolean(filters.search.trim() || filters.category);

  return (
    <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
      <div className="mb-7">
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Catalog</span>
        <h1 className="text-4xl font-black text-ink md:text-5xl">Products</h1>
      </div>
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Search title, author, or technology"
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />
        <select
          className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500"
          value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}
        >
          <option value="">All categories</option>
          <option value="Book">Books</option>
          <option value="Article">Articles</option>
          <option value="Newspaper">Newspapers</option>
        </select>
        <select
          className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500"
          value={filters.sort}
          onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
        >
          <option value="latest">Latest</option>
          <option value="priceLow">Price low</option>
          <option value="priceHigh">Price high</option>
          <option value="rating">Top rated</option>
        </select>
      </div>
      {loading ? <p className="text-muted">Loading products...</p> : null}
      {!loading && visibleProducts.length === 0 ? (
        <p className="rounded-lg border border-line bg-white p-8 text-center text-muted">No books found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      )}

      {!hasActiveFilters && rankingBooks.length >= 3 && (
        <>
          <div className="mt-16 mb-7">
            <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Reader favorites</span>
            <h2 className="text-3xl font-black text-ink md:text-4xl">Top rated books</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mostRatedBooks.map((product) => <ProductCard key={`rated-${product._id}`} product={product} />)}
          </div>

          <div className="mt-16 mb-7">
            <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Trending now</span>
            <h2 className="text-3xl font-black text-ink md:text-4xl">Most purchased books</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mostPurchasedBooks.map((product) => <ProductCard key={`purchased-${product._id}`} product={product} />)}
          </div>
        </>
      )}
    </section>
  );
}
