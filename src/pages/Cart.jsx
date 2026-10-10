import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../state/CartContext.jsx";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, total } = useCart();

  return (
    <section className="mx-auto w-[min(1180px,calc(100%_-_40px))] py-16">
      <div className="mb-7">
        <span className="mb-3 inline-block text-xs font-extrabold uppercase text-teal-600">Basket</span>
        <h1 className="text-4xl font-black md:text-5xl">Cart</h1>
      </div>
      {items.length === 0 ? (
        <div className="grid justify-items-start gap-4 rounded-lg border border-line bg-white p-10 shadow-soft">
          <p>Your cart is empty.</p>
          <Link to="/products" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700">Browse products</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-3">
            {items.map((item) => (
              <div className="grid items-center gap-4 rounded-lg border border-line bg-white p-4 shadow-sm md:grid-cols-[84px_1fr_auto_auto]" key={item._id}>
                <img className="h-20 w-20 rounded-lg object-cover" src={item.image} alt={item.title} />
                <div>
                  <h3 className="font-extrabold">{item.title}</h3>
                  <p className="text-muted">₹{item.price}</p>
                </div>
                <div className="flex w-max overflow-hidden rounded-lg border border-line">
                  <button
                    className="grid h-9 w-9 place-items-center bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={item.quantity <= 1}
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    title="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="grid h-9 w-9 place-items-center">{item.quantity}</span>
                  <button
                    className="grid h-9 w-9 place-items-center bg-white hover:bg-slate-50"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    title="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-white hover:border-red-300 hover:text-red-600" onClick={() => removeFromCart(item._id)} title="Remove">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <aside className="rounded-lg border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black">Order summary</h2>
            <div className="my-5 flex justify-between"><span>Total</span><strong>₹{total}</strong></div>
            <Link to="/payment" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Checkout</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
