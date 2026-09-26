import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import api from "../api/axios.js";

const TECHNOLOGY_OPTIONS = [
  "AI",
  "ML",
  "AI & ML",
  "Web Development",
  "Full Stack Development",
  "Data Structures & Algorithms",
  "MERN Stack",
  "Software Development",
  "React",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Express.js",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "Database",
  "DBMS",
  "Data Science",
  "Data Analytics",
  "Deep Learning",
  "Microprocessor",
  "Computer Networks",
  "System Design",
  "Cybersecurity",
  "Hacking",
  "Ethical Hacking",
  "Python",
  "Java",
  "C / C++",
  "Next.js",
  "Cloud Computing",
  "DevOps",
  "Docker & Kubernetes",
  "Blockchain",
  "Mobile App Development",
  "Operating Systems",
  "Git & GitHub"
];

const initialForm = {
  title: "",
  category: "Book",
  technology: "",
  author: "",
  price: "",
  stock: 1,
  image: "",
  description: ""
};

export default function AddProduct() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [techSearch, setTechSearch] = useState("");
  const [customTech, setCustomTech] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then(({ data }) => {
      const loadedTechs = data.technology
        ? data.technology.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      setSelectedTechs(loadedTechs);
      setForm({
        title: data.title || "",
        category: data.category || "Book",
        technology: data.technology || "",
        author: data.author || "",
        price: data.price ?? "",
        stock: data.stock ?? 0,
        image: data.image || "",
        description: data.description || ""
      });
      if (data.image?.startsWith("data:") || data.image?.includes("cloudinary")) setImageMode("upload");
    }).catch((err) => setError(err.response?.data?.message || "Could not load product"));
  }, [id]);

  const handleTechToggle = (tech) => {
    const exists = selectedTechs.includes(tech);
    const updated = exists
      ? selectedTechs.filter((item) => item !== tech)
      : [...selectedTechs, tech];
    setSelectedTechs(updated);
    update("technology", updated.join(", "));
  };

  const handleAddCustomTech = (event) => {
    event?.preventDefault();
    const trimmed = customTech.trim();
    if (!trimmed || selectedTechs.includes(trimmed)) return;
    const updated = [...selectedTechs, trimmed];
    setSelectedTechs(updated);
    update("technology", updated.join(", "));
    setCustomTech("");
  };

  const handleClearAllTechs = () => {
    setSelectedTechs([]);
    update("technology", "");
  };

  const allAvailableTechs = useMemo(() => {
    const customList = selectedTechs.filter((tech) => !TECHNOLOGY_OPTIONS.includes(tech));
    return [...TECHNOLOGY_OPTIONS, ...customList];
  }, [selectedTechs]);

  const filteredTechs = useMemo(() => {
    const q = techSearch.trim().toLowerCase();
    if (!q) return allAvailableTechs;
    return allAvailableTechs.filter((tech) => tech.toLowerCase().includes(q));
  }, [techSearch, allAvailableTechs]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((currentForm) => ({ ...currentForm, image: reader.result }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setUploading(true);
    try {
      let finalImageUrl = form.image;

      if (imageMode === "upload" && imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const { data: uploadRes } = await api.post("/upload?folder=products", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        finalImageUrl = uploadRes.url;
      }

      const payload = {
        ...form,
        image: finalImageUrl,
        technology: selectedTechs.join(", "),
        price: Number(form.price),
        stock: Number(form.stock)
      };
      if (isEditing) {
        await api.put(`/products/${id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="mx-auto w-[min(760px,calc(100%_-_40px))] py-16">
      <div className="mb-7">
        <h1 className="text-4xl font-black md:text-5xl">{isEditing ? "Edit product" : "Add product"}</h1>
      </div>
      <form className="grid grid-cols-1 gap-4 rounded-lg border border-line bg-white p-7 shadow-soft sm:grid-cols-2" onSubmit={submit}>
        {error && <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        
        <input
          className="col-span-full rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
            <input
          className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Author"
          value={form.author}
          onChange={(e) => update("author", e.target.value)}
        />
        <select
          className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
        >
          <option>Book</option>
          <option>Article</option>
          <option>Newspaper</option>
        </select>

        <div className="col-span-full grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm font-bold">
            Price
            <input
              className="rounded-lg border border-line px-4 py-3 font-normal outline-none focus:border-blue-500"
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Stock quantity
            <input
              className="rounded-lg border border-line px-4 py-3 font-normal outline-none focus:border-blue-500"
              type="number"
              min="0"
              step="1"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => update("stock", e.target.value)}
              required
            />
          </label>
        </div>

        {/* Technology Checkbox Section */}
        <fieldset className="col-span-full rounded-lg border border-line bg-slate-50/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-extrabold text-ink">
              Select Technologies <span className="ml-1 text-xs font-semibold text-blue-600">({selectedTechs.length} selected)</span>
            </legend>
            {selectedTechs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllTechs}
                className="text-xs font-bold text-red-600 transition hover:text-red-700 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search/filter bar */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Filter technologies (e.g. AI, React, Hacking, SQL)..."
              value={techSearch}
              onChange={(e) => setTechSearch(e.target.value)}
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Checkboxes grid */}
          <div className="max-h-52 overflow-y-auto rounded-lg border border-line bg-white p-3 shadow-inner">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {filteredTechs.map((tech) => {
                const isChecked = selectedTechs.includes(tech);
                return (
                  <label
                    key={tech}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition select-none ${
                      isChecked
                        ? "border-blue-500 bg-blue-50 font-bold text-blue-700"
                        : "border-line bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-line text-blue-600 focus:ring-blue-500"
                      checked={isChecked}
                      onChange={() => handleTechToggle(tech)}
                    />
                    <span className="truncate" title={tech}>{tech}</span>
                  </label>
                );
              })}
              {filteredTechs.length === 0 && (
                <p className="col-span-full py-4 text-center text-xs text-muted">
                  No technologies matching &ldquo;{techSearch}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Selected badges display */}
          {selectedTechs.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-muted">Selected:</span>
              {selectedTechs.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleTechToggle(tech)}
                    className="ml-0.5 hover:text-red-600"
                    title={`Remove ${tech}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom technology input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Other technology (e.g. Kotlin, Rust, Flutter)..."
              value={customTech}
              onChange={(e) => setCustomTech(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTech(e);
                }
              }}
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddCustomTech}
              disabled={!customTech.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </fieldset>

        {/* Product image */}
        <fieldset className="col-span-full grid gap-3">
          <legend className="text-sm font-extrabold text-ink">Product image</legend>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="radio" name="imageMode" value="url" checked={imageMode === "url"} onChange={() => setImageMode("url")} />
              Use image URL
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="radio" name="imageMode" value="upload" checked={imageMode === "upload"} onChange={() => setImageMode("upload")} />
              Upload image file
            </label>
          </div>
          {imageMode === "url" ? (
            <input
              className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500"
              placeholder="https://example.com/book-cover.jpg"
              value={form.image.startsWith("data:") ? "" : form.image}
              onChange={(e) => update("image", e.target.value)}
            />
          ) : (
            <input
              className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          )}
          {form.image && <img className="h-32 w-24 rounded-lg object-cover" src={form.image} alt="Selected product preview" />}
        </fieldset>

        <textarea
          className="col-span-full min-h-32 rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500"
          placeholder="Description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          required
        />

        <div className="col-span-full grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading to Cloudinary..." : isEditing ? "Save changes" : "Publish product"}
          </button>
          <Link
            to="/admin/products"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line px-4 py-2 font-bold text-ink hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

