import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import type { MenuItem, Modifier } from "@/hooks/useMenu";
import { useCart, useLang } from "@/lib/store";
import { t, fmtSar } from "@/lib/i18n";

export function MenuCard({ item, modifiers }: { item: MenuItem; modifiers: Modifier[] }) {
  const { lang } = useLang();
  const dict = t[lang];
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [justAdded, setJustAdded] = useState(false);

  const name = lang === "ar" ? item.name_ar : item.name_en;
  const desc = lang === "ar" ? item.description_ar : item.description_en;
  const canModify = item.category === "burgers" || item.category === "fries";

  const handleAdd = () => {
    const mods = modifiers.filter((m) => selectedMods.includes(m.id));
    add({
      itemId: item.id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      unitPrice: Number(item.price),
      image_url: item.image_url,
      modifiers: mods.map((m) => ({ id: m.id, name_en: m.name_en, name_ar: m.name_ar, price: Number(m.price) })),
    });
    setSelectedMods([]);
    setOpen(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="glass rounded-3xl overflow-hidden flex flex-col group"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
              !item.is_available ? "grayscale opacity-50" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="px-4 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
              {dict.soldOut}
            </span>
          </div>
        )}
        {item.calories != null && item.calories > 0 && (
          <span className="absolute top-3 end-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-background/70 backdrop-blur text-foreground/80">
            {item.calories} {dict.cal}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl tracking-wide">{name}</h3>
          <span className="text-primary font-bold whitespace-nowrap">{fmtSar(Number(item.price), lang)}</span>
        </div>
        {desc && <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>}

        <div className="mt-auto pt-3">
          {canModify && modifiers.length > 0 && item.is_available ? (
            <button
              onClick={() => setOpen((v) => !v)}
              disabled={!item.is_available}
              className="w-full h-11 rounded-2xl bg-secondary hover:bg-accent transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {open ? "—" : <Plus className="h-4 w-4" />} {dict.addToCart}
            </button>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!item.is_available}
              className="w-full h-11 rounded-2xl gradient-brand text-primary-foreground text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {justAdded ? dict.added : dict.addToCart}
            </button>
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{dict.addons}</div>
                {modifiers.map((m) => {
                  const sel = selectedMods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        setSelectedMods((s) => (sel ? s.filter((x) => x !== m.id) : [...s, m.id]))
                      }
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                        sel ? "border-primary bg-primary/10" : "border-border bg-secondary/50"
                      }`}
                    >
                      <span className="text-sm">{lang === "ar" ? m.name_ar : m.name_en}</span>
                      <span className="text-xs text-primary font-bold">+{fmtSar(Number(m.price), lang)}</span>
                    </button>
                  );
                })}
                <button
                  onClick={handleAdd}
                  className="w-full h-11 rounded-2xl gradient-brand text-primary-foreground text-sm font-bold mt-2"
                >
                  {dict.addToCart} →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
