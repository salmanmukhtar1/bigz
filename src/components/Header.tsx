import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Globe, Shield } from "lucide-react";
import { useCart, useLang } from "@/lib/store";
import { t } from "@/lib/i18n";

export function Header({ onCartOpen }: { onCartOpen?: () => void }) {
  const { lang, setLang, hydrate } = useLang();
  const items = useCart((s) => s.items);
  const count = items.reduce((a, b) => a + b.quantity, 0);
  const dict = t[lang];

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center font-display text-xl text-primary-foreground glow">
            Z
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg tracking-wider">{dict.brand}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {dict.location}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="h-10 px-3 rounded-xl glass hover:bg-secondary text-sm flex items-center gap-1.5"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            <span className="font-medium">{lang === "ar" ? "EN" : "AR"}</span>
          </button>
          <Link
            to="/admin"
            className="h-10 w-10 grid place-items-center rounded-xl glass hover:bg-secondary"
            aria-label="Admin"
          >
            <Shield className="h-4 w-4" />
          </Link>
          {onCartOpen && (
            <button
              onClick={onCartOpen}
              className="relative h-10 px-4 rounded-xl gradient-brand text-primary-foreground font-medium flex items-center gap-2 glow"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{count}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
