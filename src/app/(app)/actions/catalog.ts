"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupplyCategory } from "@/lib/types";

export async function addSupplyItem(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const category = formData.get("category") as SupplyCategory;
  const recommended_stock = parseInt(formData.get("recommended_stock") as string) || 0;
  const unit = formData.get("unit") as string;
  const available_at = formData.getAll("available_at") as string[];
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  const { error } = await supabase.from("supply_items").insert({
    name,
    category,
    recommended_stock,
    unit,
    available_at,
    sort_order,
  });

  if (error) return { error: error.message };

  revalidatePath("/catalog");
  revalidatePath("/orders/new");
  return { success: true };
}

export async function deleteSupplyItem(itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supply_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/catalog");
  revalidatePath("/orders/new");
  return { success: true };
}
