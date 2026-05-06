import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useMenu } from "@/hooks/useMenu";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/store";
import { t, fmtSar } from "@/lib/i18n";
import { LogOut, Upload, TrendingUp, ShoppingBag, Package } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Big Z Burger" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen">
        <Header />
        <div className="text-center py-20 text-muted-foreground">...</div>
      </div>
    );
  if (!user) return <AuthForm />;
  if (!isAdmin)
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-md text-center py-20">
          <p className="text-destructive">Not authorized.</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-4 px-4 h-10 rounded-xl bg-secondary"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  return <Dashboard />;
}

function AuthForm() {
  const { lang } = useLang();
  const dict = t[lang];
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    const { error } = await fn;
    setBusy(false);
    if (error) setErr(error.message);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="font-display text-3xl tracking-wide mb-1">{dict.admin}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          First account becomes admin automatically.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dict.email}
            className="w-full h-12 rounded-2xl bg-secondary border border-border px-4 outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dict.password}
            className="w-full h-12 rounded-2xl bg-secondary border border-border px-4 outline-none focus:border-primary"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            disabled={busy}
            className="w-full h-12 rounded-2xl gradient-brand text-primary-foreground font-bold disabled:opacity-50"
          >
            {mode === "signin" ? dict.signIn : dict.signUp}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-xs text-muted-foreground mt-4 underline w-full"
        >
          {mode === "signin" ? dict.signUp : dict.signIn}
        </button>
      </div>
    </div>
  );
}

const STATUS_FLOW: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

function Dashboard() {
  const { lang } = useLang();
  const dict = t[lang];
  const { items, modifiers } = useMenu();
  const [orders, setOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<"orders" | "inventory" | "analytics">("orders");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setOrders(data ?? []);
    };
    load();
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = orders.filter((o) => new Date(o.created_at) >= today).length;
  const counts: Record<string, number> = {};
  for (const o of orders)
    for (const it of o.items || []) counts[it.name_en] = (counts[it.name_en] || 0) + (it.quantity || 1);
  const popular = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  const setStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl tracking-wide">{dict.admin}</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="h-10 px-4 rounded-xl bg-secondary text-sm flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> {dict.signOut}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Stat icon={ShoppingBag} label={dict.today} value={String(todayCount)} />
          <Stat
            icon={TrendingUp}
            label={dict.popular}
            value={popular ? `${popular[0]} (${popular[1]})` : "—"}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-2xl bg-secondary w-fit">
          {(["orders", "inventory", "analytics"] as const).map((tk) => (
            <button
              key={tk}
              onClick={() => setTab(tk)}
              className={`px-4 h-9 rounded-xl text-sm ${
                tab === tk ? "gradient-brand text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {dict[tk]}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet.</p>}
            {orders.map((o) => (
              <div key={o.id} className="glass rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-display text-lg tracking-widest text-primary">{o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()} · {o.customer_name} · {o.phone}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {o.order_type} {o.address ? `· ${o.address}` : ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-primary">{fmtSar(Number(o.total), lang)}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                        o.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : o.status === "ready"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {dict.status[o.status as keyof typeof dict.status]}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {o.items.map((i: any, idx: number) => (
                    <div key={idx}>
                      • {i.name_en} ×{i.quantity}
                      {i.modifiers?.length > 0 &&
                        " (" + i.modifiers.map((m: any) => m.name_en).join(", ") + ")"}
                    </div>
                  ))}
                </div>
                {STATUS_FLOW[o.status] && (
                  <button
                    onClick={() => setStatus(o.id, STATUS_FLOW[o.status])}
                    className="mt-3 h-9 px-4 rounded-xl gradient-brand text-primary-foreground text-xs font-bold"
                  >
                    → {dict.status[STATUS_FLOW[o.status] as keyof typeof dict.status]}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "inventory" && (
          <div className="space-y-3">
            {items.map((it) => (
              <InventoryRow key={it.id} item={it} />
            ))}
            <div className="pt-4">
              <h3 className="font-display text-lg mb-2">{dict.addons}</h3>
              {modifiers.map((m) => (
                <ModifierRow key={m.id} mod={m} />
              ))}
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="space-y-3">
            <Stat icon={Package} label="Total orders" value={String(orders.length)} />
            <div className="glass rounded-3xl p-4">
              <h3 className="font-display text-lg mb-3">Top items</h3>
              {Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([n, c]) => (
                  <div key={n} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span>{n}</span>
                    <span className="text-primary font-bold">{c}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass rounded-3xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl gradient-brand grid place-items-center">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function InventoryRow({ item }: { item: any }) {
  const { lang } = useLang();
  const dict = t[lang];
  const [price, setPrice] = useState(String(item.price));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toggle = async () => {
    await supabase.from("menu_items").update({ is_available: !item.is_available }).eq("id", item.id);
  };
  const savePrice = async () => {
    setBusy(true);
    await supabase.from("menu_items").update({ price: Number(price) }).eq("id", item.id);
    setBusy(false);
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${item.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      await supabase.from("menu_items").update({ image_url: data.publicUrl }).eq("id", item.id);
    } else {
      alert(error.message);
    }
    setUploading(false);
  };

  return (
    <div className="glass rounded-3xl p-3 flex items-center gap-3">
      <label className="cursor-pointer relative shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-xl bg-secondary grid place-items-center text-xs text-muted-foreground">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 hover:opacity-100 grid place-items-center transition-opacity">
          {uploading ? <span className="text-[10px]">...</span> : <Upload className="h-4 w-4" />}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.name_en}</p>
        <p className="text-xs text-muted-foreground">{item.category}</p>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.5"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-20 h-9 rounded-xl bg-secondary border border-border px-2 text-sm"
        />
        <button
          onClick={savePrice}
          disabled={busy || price === String(item.price)}
          className="h-9 px-3 rounded-xl bg-secondary text-xs disabled:opacity-40"
        >
          {dict.save}
        </button>
      </div>
      <button
        onClick={toggle}
        className={`h-9 px-3 rounded-xl text-xs whitespace-nowrap ${
          item.is_available ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"
        }`}
      >
        {item.is_available ? dict.inStock : dict.outOfStock}
      </button>
    </div>
  );
}

function ModifierRow({ mod }: { mod: any }) {
  const { lang } = useLang();
  const dict = t[lang];
  const [price, setPrice] = useState(String(mod.price));
  return (
    <div className="glass rounded-2xl p-3 flex items-center gap-3 mb-2">
      <div className="flex-1">
        <p className="text-sm font-medium">{mod.name_en}</p>
      </div>
      <input
        type="number"
        step="0.5"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-20 h-9 rounded-xl bg-secondary border border-border px-2 text-sm"
      />
      <button
        onClick={() => supabase.from("modifiers").update({ price: Number(price) }).eq("id", mod.id)}
        className="h-9 px-3 rounded-xl bg-secondary text-xs"
      >
        {dict.save}
      </button>
    </div>
  );
}
