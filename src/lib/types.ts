export type Store = {
  id: string;
  name: string;
  created_at: string;
};

export type SupplyCategory =
  | "Wine"
  | "Packaging"
  | "TastingRoom"
  | "Cleaning"
  | "Office"
  | "BarSupplies";

export type SupplyItem = {
  id: string;
  name: string;
  category: SupplyCategory;
  recommended_stock: number;
  unit: string;
  available_at: string[];
  sort_order: number;
};

export type OrderStatus =
  | "draft"
  | "submitted"
  | "fulfilled"
  | "received"
  | "completed";

export type Order = {
  id: string;
  store_id: string;
  status: OrderStatus;
  order_date: string;
  notes: string | null;
  created_by: string | null;
  submitted_at: string | null;
  fulfilled_at: string | null;
  received_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  stores?: Store;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  supply_item_id: string;
  quantity_ordered: number;
  order_flag: boolean;
  fulfilled_by_distribution: boolean;
  received_by_store: boolean;
  notes: string | null;
  supply_items?: SupplyItem;
};

export const CATEGORY_LABELS: Record<SupplyCategory, string> = {
  Wine: "Wine",
  Packaging: "Packaging",
  TastingRoom: "Tasting Room",
  Cleaning: "Cleaning",
  Office: "Office",
  BarSupplies: "Bar Supplies",
};

export const CATEGORY_ORDER: SupplyCategory[] = [
  "Wine",
  "Packaging",
  "TastingRoom",
  "Cleaning",
  "Office",
  "BarSupplies",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  fulfilled: "Fulfilled",
  received: "Received",
  completed: "Completed",
};

export const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  draft: "submitted",
  submitted: "fulfilled",
  fulfilled: "received",
  received: "completed",
  completed: null,
};
