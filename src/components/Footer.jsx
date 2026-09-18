import { Link } from "react-router-dom";
import { BookOpen, Mail, MapPin, Newspaper } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-slate-950 text-slate-200">
      <div className="mx-auto grid w-[min(1180px,calc(100%_-_40px))] gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link to="/" className="mb-4 flex items-center gap-2 text-xl font-extrabold text-white">
            <BookOpen size={24} />
            <span>TechReads</span>
          </Link>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Curated books, articles, and technology newspapers for readers who want clear, current, practical knowledge.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["AI", "Cloud", "Security", "Web"].map((item) => (
              <span key={item} className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-teal-200">{item}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold uppercase text-white">Explore</h3>
          <div className="grid gap-3 text-sm text-slate-400">
            <Link to="/products" className="hover:text-white">Products</Link>
            <Link to="/about" className="hover:text-white">About us</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold uppercase text-white">Catalog</h3>
          <div className="grid gap-3 text-sm text-slate-400">
            <span>Books</span>
            <span>Articles</span>
            <span>Newspapers</span>
            <span>Admin published</span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-extrabold uppercase text-white">Stay Updated</h3>
          <p className="mb-4 flex items-center gap-2 text-sm text-slate-400"><Mail size={16} /> support@techreads.example</p>
          <p className="mb-5 flex items-center gap-2 text-sm text-slate-400"><MapPin size={16} /> Bengaluru, India</p>
          <form className="flex gap-2">
            <input className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Email address" />
            <button type="button" className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-3 py-2 text-sm font-bold text-slate-950">
              <Newspaper size={17} />
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="mx-auto flex w-[min(1180px,calc(100%_-_40px))] flex-col justify-between gap-2 text-sm text-slate-500 md:flex-row">
          <span>© 2026 TechReads Market</span>
          <span>Built with MERN, Tailwind CSS, and Google API support.</span>
        </div>
      </div>
    </footer>
  );
}
