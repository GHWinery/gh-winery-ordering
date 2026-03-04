import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/lib/types";
import { PlusCircle, ChevronRight, Package } from "lucide-react";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Received", value: "received" },
  { label: "Completed", value: "completed" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
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

  const statusFilter = params.status;

  let query = supabase
    .from("orders")
    .select("*, stores(name), order_items(id)")
    .eq("store_id", currentStoreId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-charcoal">
            Orders
          </h2>
        </div>
        <Link
          href="/orders/new"
          className="flex items-center gap-2 text-sm bg-wine text-white px-4 py-2
            rounded-xl hover:bg-wine-light transition-all shadow-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New Order
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide no-print py-1">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/orders" : `/orders?status=${f.value}`}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              (statusFilter ?? "all") === f.value
                ? "bg-wine text-white shadow-sm"
                : "bg-white border border-cream-dark text-charcoal-light hover:border-charcoal/20"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Order cards */}
      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-dark p-10 text-center">
          <Package className="w-10 h-10 text-charcoal-light/40 mx-auto mb-3" />
          <p className="text-charcoal-light">
            No orders found
            {statusFilter && statusFilter !== "all"
              ? ` with status "${statusFilter}"`
              : ""}
            .
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(orders as (Order & { order_items: { id: string }[] })[]).map(
            (order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-cream-dark
                  p-4 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-charcoal">
                      {new Date(order.order_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <span className="text-xs text-charcoal-light">
                      {order.order_items?.length ?? 0} items
                    </span>
                  </div>
                  {order.notes && (
                    <p className="text-xs text-charcoal-light truncate mt-0.5">
                      {order.notes}
                    </p>
                  )}
                </div>
                <StatusBadge status={order.status} />
                <ChevronRight className="w-4 h-4 text-charcoal-light group-hover:text-wine transition-colors" />
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
