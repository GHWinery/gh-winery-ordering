"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatus,
  deleteOrder,
} from "@/app/(app)/actions/orders";
import { STATUS_FLOW, STATUS_LABELS, type OrderStatus } from "@/lib/types";

export function OrderDetailClient({ order }: { order: { id: string; status: OrderStatus } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextStatus = STATUS_FLOW[order.status];

  async function handleAdvanceStatus() {
    if (!nextStatus) return;
    if (
      !confirm(
        `Are you sure you want to mark this order as "${STATUS_LABELS[nextStatus]}"?`
      )
    )
      return;

    setLoading(true);
    const result = await updateOrderStatus(order.id, nextStatus);
    if ("error" in result) {
      alert(result.error);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this order? This cannot be undone."))
      return;

    setLoading(true);
    const result = await deleteOrder(order.id);
    if ("error" in result) {
      alert(result.error);
      setLoading(false);
      return;
    }
    router.push("/orders");
    router.refresh();
  }

  return (
    <div className="flex gap-3 justify-end no-print">
      <button
        onClick={() => window.print()}
        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        Print
      </button>
      {order.status === "draft" && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Delete Draft
        </button>
      )}
      {nextStatus && (
        <button
          onClick={handleAdvanceStatus}
          disabled={loading}
          className="px-4 py-2 text-sm bg-wine text-white rounded hover:bg-wine-dark transition-colors disabled:opacity-50"
        >
          Mark as {STATUS_LABELS[nextStatus]}
        </button>
      )}
    </div>
  );
}
