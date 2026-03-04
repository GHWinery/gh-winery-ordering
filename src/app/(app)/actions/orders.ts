"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";

type OrderItemInput = {
  supply_item_id: string;
  quantity_ordered: number;
  order_flag: boolean;
  notes: string;
};

export async function createOrder(
  storeId: string,
  orderNotes: string,
  items: OrderItemInput[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: storeId,
      status: "submitted" as OrderStatus,
      notes: orderNotes || null,
      created_by: user.id,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) return { error: orderError.message };

  const orderItems = items.map((item) => ({
    order_id: order.id,
    supply_item_id: item.supply_item_id,
    quantity_ordered: item.quantity_ordered,
    order_flag: item.order_flag,
    notes: item.notes || null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/");
  revalidatePath("/orders");
  return { id: order.id };
}

export async function createDraftOrder(
  storeId: string,
  orderNotes: string,
  items: OrderItemInput[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: storeId,
      status: "draft" as OrderStatus,
      notes: orderNotes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (orderError) return { error: orderError.message };

  const orderItems = items.map((item) => ({
    order_id: order.id,
    supply_item_id: item.supply_item_id,
    quantity_ordered: item.quantity_ordered,
    order_flag: item.order_flag,
    notes: item.notes || null,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) return { error: itemsError.message };

  revalidatePath("/");
  revalidatePath("/orders");
  return { id: order.id };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
) {
  const supabase = await createClient();

  const timestampMap: Record<string, string> = {
    submitted: "submitted_at",
    fulfilled: "fulfilled_at",
    received: "received_at",
    completed: "completed_at",
  };
  const timestampField = timestampMap[newStatus];

  const updates: Record<string, unknown> = { status: newStatus };
  if (timestampField) {
    updates[timestampField] = new Date().toISOString();
  }

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function updateOrderItemFulfilled(
  itemId: string,
  fulfilled: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_items")
    .update({ fulfilled_by_distribution: fulfilled })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/orders");
  return { success: true };
}

export async function updateOrderItemReceived(
  itemId: string,
  received: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("order_items")
    .update({ received_by_store: received })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath("/orders");
  return { success: true };
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/orders");
  return { success: true };
}
