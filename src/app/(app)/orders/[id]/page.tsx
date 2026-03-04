import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderDetailClient } from "./OrderDetailClient";
import type { Order, OrderItem } from "@/lib/types";
import { ChevronLeft, ExternalLink } from "lucide-react";

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

  type OrderItemWithSupply = Omit<OrderItem, "supply_items"> & {
    supply_items: {
      name: string;
      category: string;
      unit: string;
      order_url: string | null;
    };
  };
  const typedOrder = order as unknown as Omit<Order, "order_items"> & {
    stores: { name: string };
    order_items: OrderItemWithSupply[];
  };

  const flaggedItems = typedOrder.order_items.filter((item) => item.order_flag);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm text-wine hover:underline"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
          <h2 className="font-serif text-2xl font-bold text-charcoal mt-1">
            Order &mdash; {typedOrder.stores.name}
          </h2>
          <p className="text-sm text-charcoal-light">
            {new Date(typedOrder.order_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={typedOrder.status} />
      </div>

      {/* Notes */}
      {typedOrder.notes && (
        <div className="bg-white rounded-2xl border border-cream-dark p-4">
          <div className="text-xs font-medium text-charcoal-light mb-1">
            Notes
          </div>
          <p className="text-sm text-charcoal">{typedOrder.notes}</p>
        </div>
      )}

      {/* Order Items as cards */}
      <div className="space-y-2">
        <h3 className="font-semibold text-charcoal text-sm">
          Items ({flaggedItems.length})
        </h3>
        {flaggedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-cream-dark p-4 space-y-3"
          >
            {/* Item header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-charcoal text-[15px]">
                  {item.supply_items.name}
                </span>
                {item.supply_items.order_url && (
                  <a
                    href={item.supply_items.order_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info hover:text-info/80 transition-colors shrink-0"
                    title="Open ordering link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="text-sm font-bold text-wine shrink-0">
                {item.quantity_ordered} {item.supply_items.unit}
              </div>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-charcoal-light">
                {item.supply_items.category}
              </span>
              {item.fulfilled_by_distribution && (
                <span className="px-2 py-0.5 rounded-full bg-success-light text-success font-medium">
                  Fulfilled
                </span>
              )}
              {item.received_by_store && (
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                  Received
                </span>
              )}
            </div>

            {item.notes && (
              <p className="text-xs text-charcoal-light">
                Note: {item.notes}
              </p>
            )}

            {/* Fulfiller status (inline) */}
            <OrderDetailClient.FulfillerStatusRow
              itemId={item.id}
              currentStatus={item.fulfiller_status}
              currentNotes={item.fulfiller_notes}
            />
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-cream-dark p-4">
        <h3 className="text-sm font-semibold text-charcoal mb-3">Timeline</h3>
        <div className="space-y-2 text-sm">
          <TimelineEntry label="Created" timestamp={typedOrder.created_at} />
          <TimelineEntry
            label="Submitted"
            timestamp={typedOrder.submitted_at}
          />
          <TimelineEntry
            label="Fulfilled"
            timestamp={typedOrder.fulfilled_at}
          />
          <TimelineEntry label="Received" timestamp={typedOrder.received_at} />
          <TimelineEntry
            label="Completed"
            timestamp={typedOrder.completed_at}
          />
        </div>
      </div>

      {/* Actions */}
      <OrderDetailClient.Actions order={typedOrder} />
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
        className={`w-2 h-2 rounded-full ${timestamp ? "bg-success" : "bg-cream-dark"}`}
      />
      <span
        className={timestamp ? "text-charcoal" : "text-charcoal-light/40"}
      >
        {label}
      </span>
      {timestamp && (
        <span className="text-charcoal-light">
          {new Date(timestamp).toLocaleString()}
        </span>
      )}
    </div>
  );
}
