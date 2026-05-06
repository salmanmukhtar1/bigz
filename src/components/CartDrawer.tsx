import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart, useLang } from "@/lib/store";
import { t, fmtSar, splitVat, DELIVERY_FEE } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const dict = t[lang];
  const { items, inc, dec, remove, totalIncl } = useCart();
  const totalItemsIncl = totalIncl();
  const { subtotal, vat } = splitVat(totalItemsIncl);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />
          <motion.aside
            initial={{ x: lang === "ar" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: lang === "ar" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={`fixed top-0 ${lang === "ar" ? "left-0" : "right-0"} h-full w-full sm:max-w-md z-[70] glass flex flex-col`}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-2xl tracking-wide">{dict.yourOrder}</h2>
              <button onClick={onClose} className="h-9 w-9 rounded-xl bg-secondary grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full grid place-items-center text-center px-6">
                  <div>
                    <div className="text-5xl mb-3">🍔</div>
                    <p className="font-medium">{dict.empty}</p>
                    <p className="text-sm text-muted-foreground mt-1">{dict.emptyHint}</p>
                  </div>
                </div>
              ) : (
                items.map((item) => {
                  const lineUnit = item.unitPrice + item.modifiers.reduce((a, m) => a + m.price, 0);
                  return (
                    <div key={item.lineId} className="rounded-2xl bg-secondary/60 p-3 flex gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <p className="font-medium truncate">
                            {lang === "ar" ? item.name_ar : item.name_en}
                          </p>
                          <button
                            onClick={() => remove(item.lineId)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={dict.remove}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.modifiers.length > 0 && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {item.modifiers.map((m) => (lang === "ar" ? m.name_ar : m.name_en)).join(" · ")}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => dec(item.lineId)}
                              className="h-7 w-7 rounded-lg bg-background grid place-items-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => inc(item.lineId)}
                              className="h-7 w-7 rounded-lg bg-background grid place-items-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {fmtSar(lineUnit * item.quantity, lang)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-2">
                <Row label={dict.subtotal} value={fmtSar(subtotal, lang)} />
                <Row label={dict.vat} value={fmtSar(vat, lang)} />
                <Row label={dict.total} value={fmtSar(totalItemsIncl, lang)} bold />
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="block text-center w-full h-12 rounded-2xl gradient-brand text-primary-foreground font-bold leading-[3rem] glow"
                >
                  {dict.checkout} →
                </Link>
                <p className="text-[10px] text-muted-foreground text-center">
                  + {fmtSar(DELIVERY_FEE, lang)} {dict.deliveryFee.toLowerCase()}
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-bold text-base pt-1" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
