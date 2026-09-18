import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  return (
    <section className="mx-auto grid w-[min(1180px,calc(100%_-_40px))] gap-9 py-16 lg:grid-cols-2">
      <div>
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Contact</span>
        <h1 className="mb-5 text-4xl font-black leading-tight md:text-6xl">Talk to TechReads</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-600">Questions about products, admin publishing, or bulk learning material? Send us a note.</p>
        <div className="mt-6 grid gap-3">
          <p className="flex items-center gap-3 text-slate-600"><Mail size={18} /> support@techreads.example</p>
          <p className="flex items-center gap-3 text-slate-600"><Phone size={18} /> +91 90000 00000</p>
          <p className="flex items-center gap-3 text-slate-600"><MapPin size={18} /> Bengaluru, India</p>
        </div>
      </div>
      <form className="grid gap-4 rounded-lg border border-line bg-white p-7 shadow-soft">
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Name" />
        <input className="rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" type="email" placeholder="Email" />
        <textarea className="min-h-32 rounded-lg border border-line px-4 py-3 outline-none focus:border-blue-500" placeholder="Message" />
        <button type="button" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Send message</button>
      </form>
    </section>
  );
}
