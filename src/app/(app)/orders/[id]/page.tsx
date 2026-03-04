import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderDetailClient } from "./OrderDetailClient";
import type { Order, OrderItem } from "@/lib/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, stores(name), order_items(*, supply_items(*))")
    .eq("id", id)
    .single();

  if (!order) {
    notFound();
  }

  type OrderItemWithSupply = Omit<OrderItem, 'supply_items'> & {
    supply_items: { name: string; category: string; unit: string };
  };
  const typedOrder = order as unknown as Omit<Order, 'order_items'> & {
    stores: { name: string };
    order_items: OrderItemWithSupply[];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/orders"
            className="text-sm text-wine hover:underline"
          >
            &larr; Back to Orders
          </Link>
          <h2 className="text-lg font-bold text-brown mt-1">
            Order &mdash; {typedOrder.stores.name}
          </h2>
          <p className="text-sm text-brown/60">
            {new Date(typedOrder.order_date).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={typedOrder.status} />
      </div>

      {typedOrder.notes && (
        <div className="bg-white rounded-lg border border-cream-dark p-4">
          <div className="text-xs font-medium text-brown/60 mb-1">Notes</div>
          <p className="text-sm">{typedOrder.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-cream-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-cream-dark">
              <th className="text-left px-4 py-2 font-medium text-brown">Item</th>
              <th className="text-left px-4 py-2 font-medium text-brown">Category</th>
              <th className="text-right px-4 py-2 font-medium text-brown">Qty</th>
              <th className="text-left px-4 py-2 font-medium text-brown">Unit</th>
              <th className="text-center px-4 py-2 font-medium text-brown">Fulfilled</th>
              <th className="text-center px-4 py-2 font-medium text-brown">Received</th>
              <th className="text-left px-4 py-2 font-medium text-brown">Notes</th>
            </tr>
          </thead>
          <tbody>
            {typedOrder.order_items
              .filter((item) => item.order_flag)
              .map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-cream-dark last:border-0"
                >
                  <td className="px-4 py-2.5 font-medium">
                    {item.supply_items.name}
                  </td>
                  <td className="px-4 py-2.5 text-brown/60">
                    {item.supply_items.category}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {item.quantity_ordered}
                  </td>
                  <td className="px-4 py-2.5 text-brown/60">
                    {item.supply_items.unit}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {item.fulfilled_by_distribution ? "Yes" : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {item.received_by_store ? "Yes" : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-brown/60">
                    {item.notes || "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-cream-dark p-4">
        <h3 className="text-sm font-semibold text-brown mb-3">Timeline</h3>
        <div className="space-y-2 text-sm">
          <TimelineEntry label="Created" timestamp={typedOrder.created_at} />
          <TimelineEntry label="Submitted" timestamp={typedOrder.submitted_at} />
          <TimelineEntry label="Fulfilled" timestamp={typedOrder.fulfilled_at} />
          <TimelineEntry label="Received" timestamp={typedOrder.received_at} />
          <TimelineEntry label="Completed" timestamp={typedOrder.completed_at} />
        </div>
      </div>

      <OrderDetailClient order={typedOrder} />
    </div>
  );
}

function TimelineEntry({
  label,
  timestamp,
}: {
  label: string;
  timestamp: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${timestamp ? "bg-success" : "bg-gray-300"}`}
      />
      <span className={timestamp ? "text-brown" : "text-brown/40"}>
        {label}
      </span>
      {timestamp && (
        <span className="text-brown/50">
          {new Date(timestamp).toLocaleString()}
        </span>
      )}
    </div>
  );
}
