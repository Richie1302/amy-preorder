import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PartyPopper, Camera, MapPin, Calendar, Clock as ClockIcon, Wallet, X } from "lucide-react";
import { Minus, Plus, ShoppingBag, Sparkles, Heart, Clock, Truck } from "lucide-react";
import heroBread from "@/assets/hero-bread.jpg";
// Temporary fallback since foil-cakes and parfait files are corrupted
import parfaitImg from "@/assets/hero-bread.jpg";
import foilCakesImg from "@/assets/hero-bread.jpg";

export const Route = createFileRoute("/")({
  component: AmysDelight,
});

type Item = { id: string; name: string; price: number; category: string };

const MICRO: Item[] = [
  { id: "micro-classic", name: "Classic", price: 1000, category: "Micro Banana Bread" },
  { id: "micro-choc", name: "Chocolate Chips", price: 1700, category: "Micro Banana Bread" },
  { id: "micro-coco", name: "Coconut Crunch", price: 1700, category: "Micro Banana Bread" },
  { id: "micro-oreo", name: "Oreos Crunch", price: 1700, category: "Micro Banana Bread" },
  { id: "micro-raisin", name: "Raisin Bliss", price: 1700, category: "Micro Banana Bread" },
];
const MINI: Item[] = [
  { id: "mini-classic", name: "Classic", price: 2000, category: "Mini Banana Bread" },
  { id: "mini-coco", name: "Coconut Crunch", price: 2700, category: "Mini Banana Bread" },
  { id: "mini-choc", name: "Chocolate Chips", price: 2700, category: "Mini Banana Bread" },
  { id: "mini-oreo", name: "Oreo Crunch", price: 2700, category: "Mini Banana Bread" },
  { id: "mini-raisin", name: "Raisin Bliss", price: 2700, category: "Mini Banana Bread" },
];
const MAXI: Item[] = [
  { id: "maxi-classic", name: "Classic", price: 5000, category: "Maxi Banana Bread" },
  { id: "maxi-choc", name: "Chocolate Chips", price: 6000, category: "Maxi Banana Bread" },
  { id: "maxi-coco", name: "Coconut Crunch", price: 5500, category: "Maxi Banana Bread" },
  { id: "maxi-oreo", name: "Oreos Crunch", price: 5500, category: "Maxi Banana Bread" },
  { id: "maxi-raisin", name: "Raisin Bliss", price: 6000, category: "Maxi Banana Bread" },
];
const FOIL: Item[] = [
  { id: "foil-vanilla", name: "Foil Vanilla Cake", price: 2500, category: "Foil Cakes" },
  { id: "foil-choc", name: "Foil Chocolate Cake", price: 2500, category: "Foil Cakes" },
  { id: "foil-velvet", name: "Foil Red Velvet Cake", price: 2500, category: "Foil Cakes" },
];
const PARFAITS: Item[] = [
  { id: "parfait-yog", name: "Yoghurt Parfait", price: 3500, category: "Parfaits" },
  { id: "parfait-cake", name: "Cake Parfait", price: 3000, category: "Parfaits" },
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

type Confirmation = {
  ref: string;
  name: string;
  phone: string;
  notes: string;
  lines: { name: string; category: string; qty: number; subtotal: number; price: number }[];
  total: number;
};

const PICKUP = {
  location: "Amy's Delight Stand",
  address: "School Field, Caleb University",
  window: "12:00 PM – 1:00 PM",
};

// Amy's WhatsApp number in international format, digits only (for wa.me links)
const AMY_WHATSAPP = "2349050341844";

function buildWhatsAppUrl(data: Confirmation) {
  const lines = data.lines
    .map((l) => `• ${l.name} × ${l.qty} — ₦${l.subtotal.toLocaleString()}`)
    .join("\n");
  const msg =
    `*New Pre-Order ${data.ref}*\n\n` +
    `${lines}\n\n` +
    `*Total:* ₦${data.total.toLocaleString()} (pay on collection)\n\n` +
    `*Name:* ${data.name}\n` +
    `*Phone:* ${data.phone}\n` +
    (data.notes ? `*Notes:* ${data.notes}\n` : "") +
    `\nPlease confirm pickup / delivery date with the customer.`;
  return `https://wa.me/${AMY_WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function AmysDelight() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState({ name: "", phone: "", notes: "" });
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [activeCategory, setActiveCategory] = useState("micro");

  const categories = useMemo(() => [
    { id: "micro", title: "Micro Banana Bread", items: MICRO, image: heroBread },
    { id: "mini", title: "Mini Banana Bread", items: MINI, image: heroBread },
    { id: "maxi", title: "Maxi Banana Bread", items: MAXI, image: heroBread },
    { id: "foil", title: "Foil Cakes", items: FOIL, image: foilCakesImg },
    { id: "parfaits", title: "Parfaits", items: PARFAITS, image: parfaitImg },
  ], []);
  const activeTab = categories.find(c => c.id === activeCategory)!;

  const items = useMemo(
    () => [...MICRO, ...MINI, ...MAXI, ...FOIL, ...PARFAITS],
    []
  );
  const lineItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => {
      const item = items.find((i) => i.id === id)!;
      return { ...item, qty: q, subtotal: item.price * q };
    });
  const total = lineItems.reduce((s, l) => s + l.subtotal, 0);
  const totalQty = lineItems.reduce((s, l) => s + l.qty, 0);

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: string) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }));

  const submitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      alert("Add at least one item to your basket first.");
      return;
    }
    // Globally-unique order reference: base36 timestamp + random suffix.
    // Two clients can never receive the same ref, even offline.
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
    const ref = `AMY-${stamp}${rand}`;

    setConfirmation({
      ref,
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
      lines: lineItems,
      total,
    });
  };

  const closeConfirmation = () => {
    setConfirmation(null);
    setCart({});
    setCustomer({ name: "", phone: "", notes: "" });
  };


  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[color-mix(in_oklab,var(--cream)_70%,transparent)] border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="font-script text-3xl leading-none text-primary">Amy's</span>
            <span className="font-display italic text-sm text-muted-foreground -ml-1">delight</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#menu" className="hover:text-accent transition-colors">Menu</a>
            <a href="#story" className="hover:text-accent transition-colors">Our Story</a>
            <a href="#order" className="hover:text-accent transition-colors">Pre-Order</a>
          </nav>
          <a
            href="#order"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] hover:opacity-90 transition"
          >
            <ShoppingBag className="size-4" />
            {totalQty > 0 ? `${totalQty} in basket` : "Order"}
          </a>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-accent/20 blur-[100px] pointer-events-none mix-blend-multiply opacity-70 animate-pulse duration-10000" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] rounded-full bg-primary/10 blur-[80px] pointer-events-none mix-blend-multiply opacity-50" />
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="animate-float-up">
            <span className="ornament text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Baked fresh · Made to order
            </span>
            <h1 className="mt-6 leading-[0.95]">
              <span className="block font-script text-6xl sm:text-7xl md:text-8xl text-primary">Amy's</span>
              <span className="block font-display italic text-3xl sm:text-4xl md:text-5xl -mt-1 sm:-mt-2 ml-2" style={{ color: "var(--cocoa-soft)" }}>
                delight
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
              Small-batch banana bread, foil cakes and layered parfaits — hand-mixed,
              slow-baked, and boxed with love. Reserve yours before the oven fills up.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#menu"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold shadow-[var(--shadow-warm)] hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
              >
                Browse the menu <Sparkles className="size-4 animate-pulse" />
              </a>
              <a
                href="#order"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 font-semibold hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
              >
                Start pre-order
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="size-4 text-accent shrink-0" /> 24h notice</div>
              <div className="flex items-center gap-2"><Heart className="size-4 text-accent shrink-0" /> Handmade</div>
              <div className="flex items-center gap-2"><Truck className="size-4 text-accent shrink-0" /> Local delivery</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-accent/20 to-transparent blur-2xl" />
            <div className="relative rounded-[2rem] overflow-hidden shadow-[var(--shadow-warm)] border border-border/50 animate-hover-loaf">
              <img
                src={heroBread}
                alt="Freshly baked banana bread loaves in foil tins"
                width={1600}
                height={1200}
                className="w-full h-72 sm:h-96 md:h-[520px] object-cover"
              />

            </div>
            <div className="absolute -bottom-4 left-2 sm:-bottom-6 sm:-left-4 md:-left-8 bg-[color-mix(in_oklab,var(--cream)_90%,transparent)] backdrop-blur-md rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-[var(--shadow-warm)] border border-white/40 rotate-[-4deg] animate-float-up hover:scale-110 transition-transform duration-500 cursor-default">
              <div className="font-script text-xl sm:text-2xl text-accent leading-none">Bestseller</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Maxi Chocolate Chips</div>
              <div className="text-sm font-semibold mt-0.5">₦6,000</div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-4xl px-5 py-20">
        <div className="text-center mb-8">
          <span className="ornament text-xs tracking-[0.3em] uppercase text-muted-foreground">
            The Menu
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display">
            What are you craving?
          </h2>
        </div>

        {/* Tab List */}
        <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 sm:gap-3 pb-4 mb-6 -mx-5 px-5 sm:mx-0 sm:px-0 sm:justify-center relative z-10">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-95 ${
                activeCategory === c.id
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "bg-[color-mix(in_oklab,var(--cream)_90%,transparent)] backdrop-blur-sm text-foreground hover:bg-secondary/70 border border-border/50"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div key={activeTab.id} className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/50 shadow-[var(--shadow-soft)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-20">
          <div className="relative h-48 sm:h-64 overflow-hidden">
            <img src={activeTab.image} alt={activeTab.title} className="w-full h-full object-cover animate-in fade-in duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8 text-white z-10 w-full flex justify-between items-end">
               <div>
                 <h3 className="font-display text-3xl sm:text-4xl animate-in slide-in-from-bottom-4 duration-500">{activeTab.title}</h3>
                 <p className="text-white/80 text-sm mt-1 animate-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">Baked fresh every morning</p>
               </div>
            </div>
          </div>
          
          <ul className="divide-y divide-border/60">
            {activeTab.items.map((item, index) => {
               const qty = cart[item.id] ?? 0;
               return (
                  <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>
                     <div className="flex-1 min-w-0">
                        <div className="font-display text-lg sm:text-xl truncate">{item.name}</div>
                     </div>
                     <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                        <div className="font-semibold tabular-nums text-base">₦{item.price.toLocaleString()}</div>
                        {qty > 0 ? (
                           <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md animate-in zoom-in-95 duration-200">
                             <button onClick={() => sub(item.id)} className="size-8 rounded-full bg-background/20 hover:bg-background/30 grid place-items-center active:scale-75 transition-all"><Minus className="size-4" /></button>
                             <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                             <button onClick={() => add(item.id)} className="size-8 rounded-full bg-background/20 hover:bg-background/30 grid place-items-center active:scale-75 transition-all"><Plus className="size-4" /></button>
                           </div>
                        ) : (
                           <button onClick={() => add(item.id)} className="flex items-center gap-1.5 bg-secondary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition-all active:scale-95">
                              <Plus className="size-4" /> Add
                           </button>
                        )}
                     </div>
                  </li>
               )
            })}
          </ul>
        </div>
      </section>

      <section id="story" className="relative py-24 text-primary-foreground overflow-hidden" style={{ background: "var(--gradient-cocoa)" }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,var(--gold),transparent_50%),radial-gradient(circle_at_80%_70%,var(--caramel),transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <span className="ornament text-xs tracking-[0.3em] uppercase opacity-70">Our Story</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display">
            Baked at home,<br />
            <span className="font-script text-6xl md:text-7xl" style={{ color: "var(--gold)" }}>shared with love</span>
          </h2>
          <p className="mt-8 text-lg leading-relaxed opacity-90">
            Every loaf leaves Amy's kitchen still warm — ripe bananas mashed by hand,
            butter creamed just so, and toppings folded through with care. We bake only
            what's ordered, so nothing is ever a day old.
          </p>
        </div>
      </section>

      <section id="order" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center mb-12">
          <span className="ornament text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Pre-Order
          </span>
          <h2 className="mt-4 text-4xl md:text-5xl font-display">Your basket</h2>
          <p className="mt-3 text-muted-foreground">Review your order and send it straight to Amy.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-[var(--shadow-soft)]">
            {lineItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingBag className="mx-auto size-10 mb-3 opacity-40" />
                Your basket is empty. Head back up to the menu to add something delicious.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {lineItems.map((l) => (
                  <li key={l.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex justify-between items-start sm:block sm:flex-1 min-w-0">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                          {l.category}
                        </div>
                        <div className="font-display text-lg truncate">{l.name}</div>
                        <div className="text-sm text-muted-foreground">{fmt(l.price)} each</div>
                      </div>
                      <div className="text-right font-semibold sm:hidden mt-1">{fmt(l.subtotal)}</div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:col-span-1 bg-secondary/30 sm:bg-transparent p-2 px-3 sm:p-0 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground sm:hidden uppercase tracking-wider">Qty</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => sub(l.id)}
                          className="size-8 shrink-0 rounded-full border border-border bg-background hover:bg-secondary grid place-items-center"
                        aria-label={`Remove one ${l.name}`}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-6 text-center font-semibold">{l.qty}</span>
                      <button
                        type="button"
                        onClick={() => add(l.id)}
                        className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center hover:opacity-90"
                        aria-label={`Add one ${l.name}`}
                      >
                        <Plus className="size-4" />
                      </button>
                      </div>
                    </div>
                    <div className="hidden sm:block w-24 text-right font-semibold">{fmt(l.subtotal)}</div>
                  </li>
                ))}
              </ul>
            )}
            {lineItems.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border flex items-baseline justify-between">
                <span className="text-sm uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="font-display text-3xl text-accent">{fmt(total)}</span>
              </div>
            )}
          </div>

          <form onSubmit={submitOrder} className="md:col-span-2 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-[var(--shadow-soft)] space-y-4">
            <h3 className="font-display text-2xl">Your details</h3>
            <Field label="Full name" required>
              <input
                required
                maxLength={80}
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <Field label="Phone / WhatsApp" required>
              <input
                required
                type="tel"
                maxLength={20}
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </Field>
            <div className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Pickup / delivery date:</span> Amy will contact you on WhatsApp to arrange this once she receives your order.
            </div>
            <Field label="Notes (optional)">
              <textarea
                maxLength={300}
                rows={3}
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Address, allergies, gift message…"
              />
            </Field>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3 font-semibold shadow-[var(--shadow-warm)] hover:-translate-y-0.5 transition-all"
            >
              Place pre-order <PartyPopper className="size-4" />
            </button>
            <p className="text-xs text-muted-foreground text-center">
              Please pre-order at least 24 hours ahead so everything is fresh from the oven. Pay on collection.
            </p>
          </form>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-6">
        <div>
          <div className="font-script text-3xl text-primary">Amy's delight</div>
          <div className="mt-1 italic">Baked with love · © {new Date().getFullYear()}</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 opacity-80 pt-4 border-t border-border/40 w-56 mx-auto">
          <span className="font-medium text-xs uppercase tracking-wider">Built by Forge Studio dev</span>
          <a href="https://wa.me/2349059656762?text=Hi%20Forge%20Studio%20dev%21%20I%20saw%20Amy%27s%20Delight%20and%20I%27d%20like%20to%20talk%20about%20a%20project." target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            <span className="font-medium underline underline-offset-2">Chat with me</span>
          </a>
        </div>
      </footer>

      {confirmation && (
        <ConfirmationModal data={confirmation} onClose={closeConfirmation} />
      )}

      {/* Sticky Mobile Bottom Bar */}
      {totalQty > 0 && !confirmation && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
          <div className="bg-[color-mix(in_oklab,var(--cocoa)_85%,transparent)] backdrop-blur-xl text-primary-foreground rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/10 flex items-center justify-between p-2 pl-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-center">
              <div className="text-[10px] opacity-80 uppercase tracking-widest font-semibold mb-0.5">Your Basket</div>
              <div className="font-display text-xl leading-none">{fmt(total)}</div>
            </div>
            <a
              href="#order"
              className="relative z-10 text-primary-foreground px-6 py-3 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300"
              style={{ background: "var(--gradient-gold)", color: "var(--cocoa)" }}
            >
              Checkout <ShoppingBag className="size-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmationModal({ data, onClose }: { data: Confirmation; onClose: () => void }) {


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[color-mix(in_oklab,var(--cocoa)_60%,transparent)] backdrop-blur-sm animate-float-up">
      <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-[var(--shadow-warm)] border border-border overflow-hidden max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 size-9 rounded-full bg-secondary hover:bg-muted grid place-items-center z-10"
        >
          <X className="size-4" />
        </button>

        <div className="px-6 sm:px-8 pt-10 pb-6 text-center">
          <div className="mx-auto size-16 rounded-full grid place-items-center" style={{ background: "var(--gradient-gold)" }}>
            <PartyPopper className="size-8 text-primary-foreground" />
          </div>
          <h3 className="mt-5 font-display text-3xl">Order Confirmed!</h3>
          <p className="mt-1 text-muted-foreground">
            Thank you, <span className="font-semibold text-foreground">{data.name.split(" ")[0] || "friend"}</span>!
          </p>
        </div>

        <div className="mx-4 sm:mx-6 rounded-2xl p-5 sm:p-6 text-center border border-border" style={{ background: "color-mix(in oklab, var(--caramel) 10%, var(--cream))" }}>
          <div className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground font-semibold">
            Your Order Reference
          </div>
          <div className="mt-2 font-display italic text-3xl sm:text-4xl text-accent break-all">{data.ref}</div>
          <div className="mt-2 text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Camera className="size-3.5 shrink-0" /> Screenshot this & show at pickup to collect
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6">
          <ul className="divide-y divide-border">
            {data.lines.map((l, i) => (
              <li key={i} className="py-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                <span className="text-sm min-w-0">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider mr-2">{l.category}</span>
                  {l.name} × {l.qty}
                </span>
                <span className="font-semibold tabular-nums text-sm sm:text-base">₦{l.subtotal.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
            <span className="font-display text-lg">Total Due on Collection</span>
            <span className="font-display text-2xl text-accent">₦{data.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mx-4 sm:mx-6 mb-6 rounded-2xl p-5 text-primary-foreground" style={{ background: "var(--gradient-cocoa)" }}>
          <div className="flex items-center gap-2 font-display text-lg">
            <MapPin className="size-4" /> Pick-up Details
          </div>
          <div className="mt-2 text-sm space-y-1.5 opacity-95">
            <div>{PICKUP.location} · {PICKUP.address}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5"><ClockIcon className="size-3.5" /> {PICKUP.window}</span>
            </div>
            <div className="flex items-center gap-1.5"><Calendar className="size-3.5" /> Amy will confirm your pickup / delivery date on WhatsApp</div>
            <div className="flex items-center gap-1.5"><Wallet className="size-3.5" /> Pay on collection</div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <a
            href={buildWhatsAppUrl(data)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-full py-3.5 font-semibold text-white shadow-[var(--shadow-soft)] hover:opacity-95 transition"
            style={{ background: "#25D366" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.5 0 .17 5.33.17 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.45-8.44Zm-8.46 18.3h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 1 1 8.38 4.63Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47a8.9 8.9 0 0 1-1.64-2.05c-.17-.3-.02-.46.13-.6.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z"/>
            </svg>
            Send order to Amy on WhatsApp
          </a>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Camera className="inline size-3.5 mr-1" />
            Or screenshot this screen as your proof of order
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
    </label>
  );
}

// MenuSection replaced by the new Tabbed layout
