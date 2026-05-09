import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
import { detectLang } from "./i18n";

export type CartModifier = { id: string; name_en: string; name_ar: string; price: number };
export type CartItem = {
  lineId: string;
  itemId: string;
  name_en: string;
  name_ar: string;
  unitPrice: number; // including VAT, before modifiers
  image_url: string | null;
  quantity: number;
  modifiers: CartModifier[];
};

type CartState = {
  items: CartItem[];
  add: (i: Omit<CartItem, "lineId" | "quantity"> & { quantity?: number }) => void;
  inc: (lineId: string) => void;
  dec: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  totalIncl: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (i) => {
        const lineId = crypto.randomUUID();
        set({ items: [...get().items, { ...i, lineId, quantity: i.quantity ?? 1 }] });
      },
      inc: (lineId) =>
        set({ items: get().items.map((x) => (x.lineId === lineId ? { ...x, quantity: x.quantity + 1 } : x)) }),
      dec: (lineId) =>
        set({
          items: get()
            .items.map((x) => (x.lineId === lineId ? { ...x, quantity: x.quantity - 1 } : x))
            .filter((x) => x.quantity > 0),
        }),
      remove: (lineId) => set({ items: get().items.filter((x) => x.lineId !== lineId) }),
      clear: () => set({ items: [] }),
      totalIncl: () =>
        get().items.reduce(
          (sum, x) => sum + (x.unitPrice + x.modifiers.reduce((a, m) => a + m.price, 0)) * x.quantity,
          0,
        ),
    }),
    { name: "bz-cart-v1" },
  ),
);

type LangState = { lang: Lang; hydrated: boolean; setLang: (l: Lang) => void; hydrate: () => void };
export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      // Always start with "ar" so SSR and first client render match.
      lang: "ar",
      hydrated: false,
      setLang: (lang) => {
        if (typeof window !== "undefined") localStorage.setItem("bz-lang", lang);
        set({ lang, hydrated: true });
      },
      hydrate: () => {
        if (get().hydrated) return;
        const detected = detectLang();
        set({ lang: detected, hydrated: true });
      },
    }),
    { name: "bz-lang-store" },
  ),
);
