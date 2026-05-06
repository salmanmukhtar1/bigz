import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { useCart, useLang } from "@/lib/store";
import { t, fmtSar, splitVat, DELIVERY_FEE, WHATSAPP_NUMBER } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Big Z Burger" },
      { name: "description", content: "Complete your Big Z Burger order." },
    ],
  }),
  component: Checkout,
});

const phoneRe = /^[+0-9\s-]{8,}$/;

function Checkout() {
  const { lang } = useLang();
  const dict = t[lang];
  const { items, totalIncl, clear } = useCart();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const itemsTotalIncl = totalIncl();
  const deliveryFee = type === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = itemsTotalIncl + deliveryFee;
  const { subtotal: itemsSubtotal, vat } = splitVat(itemsTotalIncl);
  // include delivery fee in vat calc as well
  const finalSplit = splitVat(grandTotal);

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-2xl mb-3">🍔</p>
          <p className="text-muted-foreground">{dict.empty}</p>
          <Link to="/" className="mt-6 inline-block px-6 h-11 leading-[2.75rem] rounded-2xl gradient-brand text-primary-foreground font-bold">
            {dict.menu}
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().trim().min(2, dict.requiredField).max(80),
      phone: z.string().trim().regex(phoneRe, dict.invalidPhone).max(20),
      address: type === "delivery" ? z.string().trim().min(5, dict.requiredField).max(300) : z.string().optional(),
    });
    const r = schema.safeParse({ name, phone, address });
    if (!r.success) {
      const errs: Record<string, string> = {};
      for (const i of r.error.issues) errs[String(i.path[0])] = i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const orderItems = items.map((i) => ({
      itemId: i.itemId,
      name_en: i.name_en,
      name_ar: i.name_ar,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      modifiers: i.modifiers,
    }));

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: name.trim(),
        phone: phone.trim(),
        order_type: type,
        address: type === "delivery" ? address.trim() : null,
        items: orderItems,
        subtotal: finalSplit.subtotal,
        vat_amount: finalSplit.vat,
        delivery_fee: deliveryFee,
        total: grandTotal,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !data) {
      alert("Order failed: " + (error?.message ?? "Unknown"));
      return;
    }

    // Build WhatsApp message
    const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const lines = [
      "🔥 Big Z Burger Order",
      "",
      `Order ID: ${data.id}`,
      `Time: ${time}`,
      "",
      `Customer: ${name}`,
      `Phone: ${phone}`,
      `Type: ${type === "pickup" ? "Pickup" : "Delivery"}`,
      ...(type === "delivery" ? [`Address: ${address}`] : []),
      "",
      "Items:",
      ...items.map((i) => {
        const mods = i.modifiers.map((m) => `  + ${m.name_en}`).join("\n");
        return `- ${i.name_en} x${i.quantity}${mods ? "\n" + mods : ""}`;
      }),
      "",
      `Subtotal: ${finalSplit.subtotal.toFixed(2)} SAR`,
      `VAT (15%): ${finalSplit.vat.toFixed(2)} SAR`,
      ...(deliveryFee ? [`Delivery: ${deliveryFee.toFixed(2)} SAR`] : []),
      `Total: ${grandTotal.toFixed(2)} SAR`,
    ];
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;

    clear();
    // Open WhatsApp in new tab; navigate to confirmation page with link fallback
    window.open(waUrl, "_blank");
    nav({ to: "/order/$orderId", params: { orderId: data.id }, search: { wa: encodeURIComponent(waUrl) } });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {dict.menu}
        </Link>
        <h1 className="font-display text-3xl tracking-wide mb-6">{dict.checkout}</h1>

        <form onSubmit={submit} className="space-y-4">
          <Field label={dict.name} error={errors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className="w-full h-12 rounded-2xl bg-secondary border border-border px-4 outline-none focus:border-primary"
            />
          </Field>
          <Field label={dict.phone} error={errors.phone}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              maxLength={20}
              placeholder="+966 5XX XXX XXX"
              className="w-full h-12 rounded-2xl bg-secondary border border-border px-4 outline-none focus:border-primary"
            />
          </Field>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">{dict.checkout}</label>
            <div className="grid grid-cols-2 gap-2">
              {(["pickup", "delivery"] as const).map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setType(opt)}
                  className={`h-14 rounded-2xl border-2 font-medium transition-all ${
                    type === opt
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  {dict[opt]}
                </button>
              ))}
            </div>
          </div>

          {type === "delivery" && (
            <Field label={dict.address} error={errors.address}>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                maxLength={300}
                rows={3}
                className="w-full rounded-2xl bg-secondary border border-border p-4 outline-none focus:border-primary resize-none"
              />
            </Field>
          )}

          <div className="rounded-3xl glass p-4 space-y-1.5 text-sm">
            <Row label={dict.subtotal} value={fmtSar(finalSplit.subtotal, lang)} />
            <Row label={dict.vat} value={fmtSar(finalSplit.vat, lang)} />
            {deliveryFee > 0 && <Row label={dict.deliveryFee} value={fmtSar(deliveryFee, lang)} />}
            <div className="h-px bg-border my-1" />
            <Row label={dict.total} value={fmtSar(grandTotal, lang)} bold />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-2xl gradient-brand text-primary-foreground font-bold glow disabled:opacity-50"
          >
            {submitting ? "..." : dict.placeOrder}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-base" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={bold ? "text-primary" : ""}>{value}</span>
    </div>
  );
}
