import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || (err.code === "ERR_NETWORK" ? "Cannot reach the server. Start the backend and try again." : "Registration failed"));
    }
  };

  return (
    <section className="grid min-h-[calc(100vh_-_160px)] place-items-center px-5 py-12">
      <form className="grid w-full max-w-md gap-4 rounded-lg border border-line bg-white p-7 shadow-soft" onSubmit={submit}>
        <span className="text-xs font-extrabold uppercase text-teal-600">Join TechReads</span>
        <h1 className="text-4xl font-black">Create account</h1>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>}
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <div className="relative">
          <input className="w-full rounded-lg border border-line px-4 py-3 pr-12 outline-none focus:border-blue-500" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-blue-600" onClick={() => setShowPassword(!showPassword)} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
        </div>
        <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Register</button>
        <p className="text-muted">Already registered? <Link to="/login" className="font-bold text-blue-600">Login</Link></p>
      </form>
    </section>
  );
}
