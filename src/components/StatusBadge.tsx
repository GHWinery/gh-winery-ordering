import { STATUS_LABELS, type OrderStatus } from "@/lib/types";

/* Updated color palette using the winery design system */
const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-cream-dark text-charcoal-light",
  submitted: "bg-info/10 text-info",
  fulfilled: "bg-warning-light text-warning",
  received: "bg-success-light text-success",
  completed: "bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
