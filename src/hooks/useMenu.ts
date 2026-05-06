import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MenuItem = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  category: string;
  price: number;
  calories: number | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

export type Modifier = {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  is_available: boolean;
  sort_order: number;
};

export function useMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [m, mods] = await Promise.all([
      supabase.from("menu_items").select("*").order("category").order("sort_order"),
      supabase.from("modifiers").select("*").order("sort_order"),
    ]);
    if (m.data) setItems(m.data as MenuItem[]);
    if (mods.data) setModifiers(mods.data as Modifier[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("menu-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "modifiers" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return { items, modifiers, loading, refresh };
}
