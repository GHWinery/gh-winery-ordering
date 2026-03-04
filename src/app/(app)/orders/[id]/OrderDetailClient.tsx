"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatus,
  deleteOrder,
  updateOrderItemFulfillerStatus,
} from "@/app/(app)/actions/orders";
import {
  STATUS_FLOW,
  STATUS_LABELS,
  FULFILLER_STATUS_LABELS,
  type OrderStatus,
  type FulfillerStatus,
} from "@/lib/types";
import { Printer, Trash2, ChevronRight, Loader2 } from "lucide-react";

/* ── Fulfiller Status Badge Colors ── */
const FULFILLER_COLORS: Record<FulfillerStatus, string> = {
  to_be_ordered: "bg-info/10 text-info",
  need_info: "bg-warning-light text-warning",
  ordered: "bg-success-light text-success",
  out_for_delivery: "bg-wine/10 text-wine",
  unable_to_get: "bg-danger-light text-danger",
};

/* ── FulfillerStatusRow: inline dropdown + notes per order item ── */
function FulfillerStatusRow({
  itemId,
  currentStatus,
  currentNotes,
}: {
  itemId: string;
  currentStatus: FulfillerStatus | null;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<FulfillerStatus | "">(
    currentStatus ?? ""
  );
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateOrderItemFulfillerStatus(
      itemId,
      status === "" ? null : (status as FulfillerStatus),
      notes || null
    );
    setSaving(false);
    setDirty(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cream-dark">
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as FulfillerStatus | "");
          setDirty(true);
        }}
        className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border border-cream-dark
          focus:outline-none focus:ring-2 focus:ring-wine/20 bg-white
          ${status ? FULFILLER_COLORS[status as FulfillerStatus] : "text-charcoal-light"}`}
      >
        <option value="">Set status...</option>
        {(
          Object.entries(FULFILLER_STATUS_LABELS) as [FulfillerStatus, string][]
        ).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setDirty(true);
        }}
        placeholder="Fulfiller note..."
        className="flex-1 min-w-[120px] text-xs border border-cream-dark rounded-xl px-2.5 py-1.5
          focus:outline-none focus:ring-2 focus:ring-wine/20 bg-white"
      />

      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-medium px-3 py-1.5 rounded-xl bg-wine text-white
            hover:bg-wine-light transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
      )}
    </div>
  );
}

/* ── Actions: print, delete, advance status ── */
function Actions({
  order,
}: {
  order: { id: string; status: OrderStatus };
}) {
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
    if (
      !confirm(
        "Are you sure you want to delete this order? This cannot be undone."
      )
    )
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
    <div className="flex flex-wrap gap-2 justify-end no-print">
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-cream-dark
          rounded-xl hover:bg-cream-dark transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      {order.status === "draft" && (
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-danger/30
            text-danger rounded-xl hover:bg-danger-light transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
      {nextStatus && (
        <button
          onClick={handleAdvanceStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-wine text-white
            rounded-xl hover:bg-wine-light transition-all shadow-sm disabled:opacity-50"
        >
          Mark as {STATUS_LABELS[nextStatus]}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/* Export as compound component */
export const OrderDetailClient = {
  FulfillerStatusRow,
  Actions,
};
