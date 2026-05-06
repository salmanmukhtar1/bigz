import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/store";
import { t, fmtSar } from "@/lib/i18n";
import { CheckCircle2, Clock, ChefHat, PackageCheck } from "lucide-react";

type Search = { wa?: string };

export const Route = createFileRoute("/order/$orderId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    wa: typeof s.wa === "string" ? s.wa : undefined,
  }),
  head: ({ params }) => ({
    meta: [{ title: `Order ${params.orderId} — Big Z Burger` }],
  }),
  component: OrderPage,
});

const STEPS = ["pending", "preparing", "ready", "completed"] as const;
const ICONS = { pending: Clock, preparing: ChefHat, ready: PackageCheck, completed: CheckCircle2 };

function OrderPage() {
  const { orderId } = Route.useParams();
  const { wa } = Route.useSearch();
  const { lang } = useLang();
  const dict = t[lang];
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (active) {
        setOrder(data);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (p) => {
        setOrder(p.new);
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="text-center py-20">
          <p className="text-muted-foreground">Order not found</p>
          <Link to="/" className="text-primary mt-2 inline-block">← {dict.menu}</Link>
        </div>
      </div>
    );
  }

  const stepIdx = STEPS.indexOf(order.status as any);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto rounded-full gradient-brand grid place-items-center glow mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl tracking-wide">{dict.orderConfirmed}</h1>
          <p className="text-muted-foreground text-sm mt-1">{dict.trackHint}</p>
          <div className="mt-4 inline-block px-6 py-2 rounded-2xl glass">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{dict.orderId}</span>
            <p className="font-display text-2xl tracking-widest text-primary">{order.id}</p>
          </div>
        </div>

        {wa && (
          <div className="mb-6 text-center">
            <a
              href={decodeURIComponent(wa)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 px-6 items-center rounded-2xl bg-[#25D366] text-white font-bold"
            >
              {dict.continueWA}
            </a>
            <p className="text-[11px] text-muted-foreground mt-2">{dict.waFallback}</p>
          </div>
        )}

        {/* Status tracker */}
        <div className="glass rounded-3xl p-5 mb-6">
          <div className="flex justify-between items-center">
            {STEPS.map((s, i) => {
              const Icon = ICONS[s];
              const active = i <= stepIdx;
              return (
                <div key={s} className="flex flex-col items-center flex-1 relative">
                  <div
                    className={`h-10 w-10 rounded-full grid place-items-center z-10 ${
                      active ? "gradient-brand text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] mt-2 uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {dict.status[s as keyof typeof dict.status]}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 ${lang === "ar" ? "right-1/2" : "left-1/2"} h-0.5 w-full ${
                        i < stepIdx ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass rounded-3xl p-5 space-y-3">
          <h2 className="font-display text-xl tracking-wide">{dict.yourOrder}</h2>
          {order.items.map((it: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm">
              <div>
                <p>
                  {(lang === "ar" ? it.name_ar : it.name_en) || it.name_en} ×{it.quantity}
                </p>
                {it.modifiers?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {it.modifiers.map((m: any) => (lang === "ar" ? m.name_ar : m.name_en)).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{dict.subtotal}</span>
            <span>{fmtSar(Number(order.subtotal), lang)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{dict.vat}</span>
            <span>{fmtSar(Number(order.vat_amount), lang)}</span>
          </div>
          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{dict.deliveryFee}</span>
              <span>{fmtSar(Number(order.delivery_fee), lang)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base">
            <span>{dict.total}</span>
            <span className="text-primary">{fmtSar(Number(order.total), lang)}</span>
          </div>
        </div>

        <Link to="/" className="block text-center mt-6 text-sm text-muted-foreground">
          ← {dict.menu}
        </Link>
      </div>
    </div>
  );
}
