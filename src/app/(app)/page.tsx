import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import {
  FileEdit,
  Send,
  PackageCheck,
  Inbox,
  PlusCircle,
  ChevronRight,
} from "lucide-react";

export default async function DashboardPage() {
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
        No stores configured.
      </div>
    );
  }

  const currentStore = stores?.find((s) => s.id === currentStoreId);

  const { data: orders } = await supabase
    .from("orders")
    .select("*, stores(name)")
    .eq("store_id", currentStoreId)
    .order("created_at", { ascending: false })
    .limit(10);

  const statusCounts: Record<OrderStatus, number> = {
    draft: 0,
    submitted: 0,
    fulfilled: 0,
    received: 0,
    completed: 0,
  };

  (orders as Order[] | null)?.forEach((o) => {
    statusCounts[o.status]++;
  });

  const summaryCards: {
    label: string;
    status: OrderStatus;
    icon: React.ReactNode;
    bg: string;
  }[] = [
    {
      label: "Drafts",
      status: "draft",
      icon: <FileEdit className="w-5 h-5" />,
      bg: "bg-cream-dark text-charcoal-light",
    },
    {
      label: "Submitted",
      status: "submitted",
      icon: <Send className="w-5 h-5" />,
      bg: "bg-info/10 text-info",
    },
    {
      label: "Fulfilled",
      status: "fulfilled",
      icon: <PackageCheck className="w-5 h-5" />,
      bg: "bg-warning-light text-warning",
    },
    {
      label: "Received",
      status: "received",
      icon: <Inbox className="w-5 h-5" />,
      bg: "bg-success-light text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-charcoal">
          Dashboard
        </h2>
        <p className="text-sm text-charcoal-light mt-0.5">
          {currentStore?.name} &mdash; Supply order overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map((card) => (
          <Link
            key={card.status}
            href={`/orders?status=${card.status}`}
            className="bg-white rounded-2xl border border-cream-dark p-4 hover:shadow-md
              transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}
            >
              {card.icon}
            </div>
            <div className="text-2xl font-bold text-charcoal">
              {statusCounts[card.status]}
            </div>
            <div className="text-sm text-charcoal-light">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick action */}
      <Link
        href="/orders/new"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl
          bg-wine text-white font-semibold text-sm hover:bg-wine-light
          shadow-lg shadow-wine/20 transition-all"
      >
        <PlusCircle className="w-5 h-5" />
        Create New Order
      </Link>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-charcoal">Recent Orders</h3>
          <Link
            href="/orders"
            className="text-sm text-wine hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-dark p-8 text-center text-charcoal-light">
            No orders yet. Create your first order to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {(orders as Order[]).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-cream-dark
                  p-4 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal">
                    {new Date(order.order_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {order.notes && (
                    <p className="text-xs text-charcoal-light truncate mt-0.5">
                      {order.notes}
                    </p>
                  )}
                </div>
                <StatusBadge status={order.status} />
                <ChevronRight className="w-4 h-4 text-charcoal-light group-hover:text-wine transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
