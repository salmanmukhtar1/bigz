import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuCard } from "@/components/MenuCard";
import { useMenu } from "@/hooks/useMenu";
import { useLang } from "@/lib/store";
import { t } from "@/lib/i18n";
import heroImg from "@/assets/menu/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Big Z Burger — Smashed. Stacked. Signature. | Madinah" },
      {
        name: "description",
        content:
          "Order Big Z Burger in Madinah (Mudhainib). Smashed Black Angus burgers, loaded fries, and signature sauces. Pickup or delivery via WhatsApp.",
      },
      { property: "og:title", content: "Big Z Burger" },
      { property: "og:description", content: "Smashed. Stacked. Signature." },
      { property: "og:image", content: "https://puvhqxutwprhmddiosve.supabase.co/storage/v1/object/public/menu-images/z-burger.jpg" },
    ],
  }),
  component: Index,
});

const CATS = ["burgers", "fries", "sauces", "drinks"] as const;

function Index() {
  const { items, modifiers, loading } = useMenu();
  const { lang } = useLang();
  const dict = t[lang];
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<(typeof CATS)[number]>("burgers");
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const grouped = useMemo(() => {
    const g: Record<string, typeof items> = {};
    for (const c of CATS) g[c] = [];
    for (const i of items) (g[i.category] ||= []).push(i);
    return g;
  }, [items]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveCat(e.target.id as (typeof CATS)[number]);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const c of CATS) {
      const el = refs.current[c];
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [loading]);

  const scrollTo = (c: string) => {
    refs.current[c]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen">
      <Header onCartOpen={() => setCartOpen(true)} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-primary mb-4">@bigz.sa · {dict.location}</p>
            <h1 className="font-display text-5xl sm:text-7xl tracking-wide text-glow">{dict.brand}</h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">{dict.tagline}</p>
            <button
              onClick={() => scrollTo("burgers")}
              className="mt-8 inline-flex items-center gap-2 h-12 px-8 rounded-2xl gradient-brand text-primary-foreground font-bold glow"
            >
              {dict.orderNow} →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Sticky cat tabs */}
      <div className="sticky top-[64px] z-40 glass border-y border-border">
        <div className="mx-auto max-w-6xl px-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2 min-w-max">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => scrollTo(c)}
                className={`px-4 h-10 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCat === c
                    ? "gradient-brand text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {dict.categories[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          CATS.map((c) => (
            <section
              key={c}
              id={c}
              ref={(el: HTMLDivElement | null) => {
                refs.current[c] = el;
              }}
              className="scroll-mt-32"
            >
              <h2 className="font-display text-3xl tracking-wide mb-5 flex items-center gap-3">
                <span className="h-1 w-8 gradient-brand rounded-full" />
                {dict.categories[c]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[c]?.map((it) => (
                  <MenuCard key={it.id} item={it} modifiers={modifiers} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-muted-foreground border-t border-border mt-10">
        <p className="font-display tracking-widest text-base text-foreground">{dict.brand}</p>
        <p className="mt-2">{dict.location} · @bigz.sa</p>
      </footer>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
