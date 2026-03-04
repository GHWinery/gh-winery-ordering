import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/OrderForm";
import { createOrder } from "@/app/(app)/actions/orders";
import type { SupplyItem } from "@/lib/types";
import { Suspense } from "react";
import { OrderFormSkeleton } from "@/components/SkeletonLoader";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const storeId = cookieStore.get("store_id")?.value;

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("name");
  const currentStoreId =
    storeId && stores?.some((s) => s.id === storeId)
      ? storeId
      : stores?.[0]?.id;

  if (!currentStoreId) {
    return (
      <div className="text-center py-12 text-charcoal-light">
        No store selected.
      </div>
    );
  }

  const currentStore = stores?.find((s) => s.id === currentStoreId);

  const { data: items } = await supabase
    .from("supply_items")
    .select("*")
    .contains("available_at", [currentStoreId])
    .order("sort_order");

  async function handleCreateOrder(
    storeId: string,
    orderNotes: string,
    items: {
      supply_item_id: string;
      quantity_ordered: number;
      order_flag: boolean;
      notes: string;
    }[]
  ) {
    "use server";
    return createOrder(storeId, orderNotes, items);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-charcoal">
          New Order
        </h2>
        <p className="text-sm text-charcoal-light mt-0.5">
          {currentStore?.name} &mdash; Select items and quantities
        </p>
      </div>
      <Suspense fallback={<OrderFormSkeleton />}>
        <OrderForm
          items={(items as SupplyItem[]) ?? []}
          storeId={currentStoreId}
          createOrderAction={handleCreateOrder}
        />
      </Suspense>
    </div>
  );
}
