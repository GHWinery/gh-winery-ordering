"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wine,
  Package,
  GlassWater,
  SprayCan,
  Briefcase,
  Beer,
  Plus,
  Minus,
  MessageSquare,
  ChevronRight,
  Send,
  Save,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  type SupplyItem,
  type SupplyCategory,
} from "@/lib/types";
import { useToast } from "./Toast";
import { DeadlineBanner, isLocked } from "./DeadlineBanner";

/* ── Category icon mapping ── */
const CATEGORY_ICONS: Record<SupplyCategory, React.ReactNode> = {
  Wine: <Wine className="w-4 h-4" />,
  Packaging: <Package className="w-4 h-4" />,
  TastingRoom: <GlassWater className="w-4 h-4" />,
  Cleaning: <SprayCan className="w-4 h-4" />,
  Office: <Briefcase className="w-4 h-4" />,
  BarSupplies: <Beer className="w-4 h-4" />,
};

type ItemState = {
  supply_item_id: string;
  quantity_ordered: number;
  order_flag: boolean;
  notes: string;
};

export function OrderForm({
  items,
  storeId,
  createOrderAction,
}: {
  items: SupplyItem[];
  storeId: string;
  createOrderAction: (
    storeId: string,
    orderNotes: string,
    items: ItemState[]
  ) => Promise<{ id: string } | { error: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const tabsRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState<SupplyCategory>(
    CATEGORY_ORDER[0]
  );
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [locked] = useState(isLocked);

  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(
    () => {
      const state: Record<string, ItemState> = {};
      items.forEach((item) => {
        state[item.id] = {
          supply_item_id: item.id,
          quantity_ordered: 0,
          order_flag: false,
          notes: "",
        };
      });
      return state;
    }
  );

  /* Group items by category */
  const grouped = useMemo(() => {
    return CATEGORY_ORDER.reduce(
      (acc, cat) => {
        const catItems = items
          .filter((i) => i.category === cat)
          .sort((a, b) => a.sort_order - b.sort_order);
        if (catItems.length > 0) acc[cat] = catItems;
        return acc;
      },
      {} as Record<SupplyCategory, SupplyItem[]>
    );
  }, [items]);

  /* Available categories (only those with items) */
  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => grouped[c]),
    [grouped]
  );

  /* Set first available category on mount */
  useEffect(() => {
    if (availableCategories.length > 0 && !grouped[activeCategory]) {
      setActiveCategory(availableCategories[0]);
    }
  }, [availableCategories, activeCategory, grouped]);

  /* Summary stats */
  const totalItems = useMemo(
    () =>
      Object.values(itemStates).filter(
        (i) => i.order_flag || i.quantity_ordered > 0
      ).length,
    [itemStates]
  );

  function updateItem(id: string, updates: Partial<ItemState>) {
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }

  function increment(id: string) {
    setItemStates((prev) => {
      const current = prev[id];
      return {
        ...prev,
        [id]: {
          ...current,
          quantity_ordered: current.quantity_ordered + 1,
          order_flag: true,
        },
      };
    });
  }

  function decrement(id: string) {
    setItemStates((prev) => {
      const current = prev[id];
      const newQty = Math.max(0, current.quantity_ordered - 1);
      return {
        ...prev,
        [id]: {
          ...current,
          quantity_ordered: newQty,
          order_flag: newQty > 0 ? true : current.order_flag,
        },
      };
    });
  }

  function toggleNote(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* Count items per category that have quantities */
  function categoryCount(cat: SupplyCategory): number {
    if (!grouped[cat]) return 0;
    return grouped[cat].filter((item) => {
      const s = itemStates[item.id];
      return s && (s.order_flag || s.quantity_ordered > 0);
    }).length;
  }

  async function handleSubmit(asDraft: boolean) {
    if (locked && !asDraft) {
      toast("Ordering is locked for this week.", "error");
      return;
    }

    setSubmitting(true);
    const flaggedItems = Object.values(itemStates).filter(
      (i) => i.order_flag || i.quantity_ordered > 0
    );

    if (flaggedItems.length === 0) {
      toast("Please add at least one item to your order.", "error");
      setSubmitting(false);
      return;
    }

    const result = await createOrderAction(storeId, orderNotes, flaggedItems);

    if ("error" in result) {
      toast(result.error, "error");
      setSubmitting(false);
      return;
    }

    toast(
      asDraft ? "Draft saved successfully!" : "Order submitted!",
      "success"
    );

    router.push(`/orders/${result.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-5 pb-28">
      {/* Deadline Banner */}
      <DeadlineBanner />

      {/* ── Category Tabs (horizontal scroll) ── */}
      <div
        ref={tabsRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1"
      >
        {availableCategories.map((cat) => {
          const isActive = cat === activeCategory;
          const count = categoryCount(cat);

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                whitespace-nowrap shrink-0 transition-all duration-200
                ${
                  isActive
                    ? "bg-wine text-white shadow-lg shadow-wine/20"
                    : "bg-white text-charcoal-light hover:bg-cream-dark border border-cream-dark"
                }
              `}
            >
              {CATEGORY_ICONS[cat]}
              {CATEGORY_LABELS[cat]}
              {count > 0 && (
                <span
                  className={`
                    ml-1 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center
                    ${isActive ? "bg-white/20 text-white" : "bg-wine/10 text-wine"}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Item Cards ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {grouped[activeCategory]?.map((item) => {
            const state = itemStates[item.id];
            const hasQty = state.quantity_ordered > 0;
            const showNote = expandedNotes.has(item.id);

            return (
              <motion.div
                key={item.id}
                layout
                className={`
                  bg-white rounded-2xl border transition-all duration-200
                  ${
                    hasQty
                      ? "border-wine/20 shadow-md shadow-wine/5"
                      : "border-cream-dark shadow-sm"
                  }
                `}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-charcoal text-[15px] leading-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-cream-dark text-charcoal-light">
                          Rec: {item.recommended_stock} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Step counter (+/-) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => decrement(item.id)}
                        disabled={locked || state.quantity_ordered === 0}
                        className="w-10 h-10 rounded-xl bg-cream-dark hover:bg-cream-dark/80
                          flex items-center justify-center transition-colors
                          disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4 text-charcoal" />
                      </button>

                      <div
                        className={`
                        w-14 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                        transition-colors duration-200
                        ${hasQty ? "bg-wine/10 text-wine" : "bg-cream text-charcoal-light"}
                      `}
                      >
                        {state.quantity_ordered}
                      </div>

                      <button
                        onClick={() => increment(item.id)}
                        disabled={locked}
                        className="w-10 h-10 rounded-xl bg-wine text-white hover:bg-wine-light
                          flex items-center justify-center transition-colors shadow-sm
                          disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add Note toggle */}
                  <div className="mt-2">
                    <button
                      onClick={() => toggleNote(item.id)}
                      className="flex items-center gap-1.5 text-xs text-charcoal-light hover:text-wine transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {state.notes ? "Edit note" : "Add note"}
                      <ChevronRight
                        className={`w-3 h-3 transition-transform duration-200 ${
                          showNote ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expandable note area */}
                <AnimatePresence>
                  {showNote && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <textarea
                          value={state.notes}
                          onChange={(e) =>
                            updateItem(item.id, { notes: e.target.value })
                          }
                          placeholder="Add a note for this item..."
                          rows={2}
                          disabled={locked}
                          className="w-full border border-cream-dark rounded-xl px-3 py-2 text-sm
                            focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine/30
                            bg-cream/50 resize-none transition-all disabled:opacity-50"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Order Notes */}
      <div className="bg-white rounded-2xl border border-cream-dark shadow-sm p-4">
        <label className="block text-sm font-semibold text-charcoal mb-2">
          Order Notes
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          rows={3}
          disabled={locked}
          placeholder="Any special notes for this order..."
          className="w-full border border-cream-dark rounded-xl px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine/30
            bg-cream/50 resize-none transition-all disabled:opacity-50"
        />
      </div>

      {/* ── Sticky Action Bar (Glassmorphism) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 no-print">
        <div className="glass border-t border-white/30 shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Summary */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-wine/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-wine" />
                </div>
                <div>
                  <p className="text-sm font-bold text-charcoal">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </p>
                  <p className="text-[11px] text-charcoal-light">in order</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  disabled={submitting || totalItems === 0}
                  onClick={() => handleSubmit(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                    border border-cream-dark rounded-xl bg-white hover:bg-cream-dark
                    transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Draft</span>
                </button>

                <button
                  disabled={submitting || totalItems === 0 || locked}
                  onClick={() => handleSubmit(false)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                    bg-wine text-white rounded-xl hover:bg-wine-light
                    shadow-lg shadow-wine/25 transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
