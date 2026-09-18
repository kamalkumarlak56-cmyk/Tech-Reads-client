import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

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
  const [form, setForm] = useState(initialForm);
  const [imageMode, setImageMode] = useState("url");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

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
    try {
      await api.post("/products", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock)
      });
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create product");
    }
  };

  return (
    <section className="mx-auto w-[min(760px,calc(100%_-_40px))] py-16">
      <div className="mb-7">
        <h1 className="text-4xl font-black md:text-5xl">Add product</h1>
      </div>
      <form className="grid gap-4 rounded-lg border border-line bg-white p-7 shadow-soft" onSubmit={submit}>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        <select className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" value={form.category} onChange={(e) => update("category", e.target.value)}>
          <option>Book</option>
          <option>Article</option>
          <option>Newspaper</option>
        </select>
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Technology" value={form.technology} onChange={(e) => update("technology", e.target.value)} />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Author" value={form.author} onChange={(e) => update("author", e.target.value)} />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="number" placeholder="Price" value={form.price} onChange={(e) => update("price", e.target.value)} required />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="number" placeholder="Stock" value={form.stock} onChange={(e) => update("stock", e.target.value)} />
        <fieldset className="grid gap-3">
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
            <input className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500" placeholder="https://example.com/book-cover.jpg" value={form.image.startsWith("data:") ? "" : form.image} onChange={(e) => update("image", e.target.value)} />
          ) : (
            <input className="rounded-lg border border-line bg-white px-4 py-3 outline-none focus:border-blue-500" type="file" accept="image/*" onChange={handleImageUpload} />
          )}
          {form.image && <img className="h-32 w-24 rounded-lg object-cover" src={form.image} alt="Selected product preview" />}
        </fieldset>
        <textarea className="min-h-32 rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} required />
        <button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Publish product</button>
      </form>
    </section>
  );
}
