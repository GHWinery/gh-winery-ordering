-- GH Winery Supply Ordering - Initial Migration

-- Stores
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Supply Items (master catalog)
CREATE TABLE supply_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Wine', 'Packaging', 'TastingRoom', 'Cleaning', 'Office', 'BarSupplies')),
  recommended_stock INTEGER DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'each',
  available_at TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'fulfilled', 'received', 'completed')),
  order_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supply_item_id UUID NOT NULL REFERENCES supply_items(id),
  quantity_ordered INTEGER DEFAULT 0,
  order_flag BOOLEAN DEFAULT false,
  fulfilled_by_distribution BOOLEAN DEFAULT false,
  received_by_store BOOLEAN DEFAULT false,
  notes TEXT
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can do everything (no role-based auth for MVP)
CREATE POLICY "Authenticated users can read stores" ON stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read supply_items" ON supply_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage supply_items" ON supply_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed Stores
INSERT INTO stores (id, name) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Main Winery'),
  ('b2222222-2222-2222-2222-222222222222', 'Jacktown'),
  ('c3333333-3333-3333-3333-333333333333', 'Westmoreland');

-- Seed Supply Items
-- Wine category
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Merlot Reserve', 'Wine', 12, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Cabernet Sauvignon', 'Wine', 12, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Chardonnay', 'Wine', 10, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Pinot Grigio', 'Wine', 10, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Riesling', 'Wine', 8, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5),
  ('Moscato', 'Wine', 8, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 6),
  ('Rosé', 'Wine', 6, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 7),
  ('Sangria (Red)', 'Wine', 6, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222'], 8),
  ('Sangria (White)', 'Wine', 6, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222'], 9),
  ('Concord Grape', 'Wine', 6, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 10);

-- Packaging category
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Wine Bags (single)', 'Packaging', 200, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Wine Bags (double)', 'Packaging', 100, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Gift Boxes', 'Packaging', 50, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222'], 3),
  ('Shipping Boxes (6-pack)', 'Packaging', 30, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 4),
  ('Tissue Paper', 'Packaging', 5, 'bundles', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5),
  ('Packing Tape', 'Packaging', 6, 'rolls', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 6);

-- Tasting Room category
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Tasting Glasses', 'TastingRoom', 48, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Wine Crackers', 'TastingRoom', 20, 'boxes', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Cheese Plates', 'TastingRoom', 12, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222'], 3),
  ('Napkins', 'TastingRoom', 10, 'packs', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Water Bottles', 'TastingRoom', 5, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5);

-- Cleaning category
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Glass Cleaner', 'Cleaning', 4, 'bottles', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Sanitizer Spray', 'Cleaning', 4, 'bottles', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Bar Towels', 'Cleaning', 24, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Trash Bags (large)', 'Cleaning', 2, 'boxes', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Paper Towels', 'Cleaning', 6, 'rolls', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5);

-- Office category
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Receipt Paper', 'Office', 6, 'rolls', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Pens', 'Office', 12, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Stapler Refills', 'Office', 2, 'boxes', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Printer Paper', 'Office', 2, 'reams', ARRAY['a1111111-1111-1111-1111-111111111111'], 4);

-- Bar Supplies category
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Corkscrews', 'BarSupplies', 4, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Pour Spouts', 'BarSupplies', 12, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Wine Stoppers', 'BarSupplies', 24, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Ice Buckets', 'BarSupplies', 6, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222'], 4),
  ('Decanters', 'BarSupplies', 4, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 5);
