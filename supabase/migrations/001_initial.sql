-- GH Winery Supply Ordering - Initial Migration

-- Store IDs:
--   Main Winery:    a1111111-1111-1111-1111-111111111111
--   Jacktown:       b2222222-2222-2222-2222-222222222222
--   Westmoreland:   c3333333-3333-3333-3333-333333333333

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
  category TEXT NOT NULL CHECK (category IN ('Wine', 'Packaging', 'GiftShop', 'POS', 'Cleaning', 'Office', 'Slushie', 'BarSupplies')),
  recommended_stock INTEGER DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'each',
  available_at TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  order_url TEXT
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
  notes TEXT,
  fulfiller_status TEXT CHECK (fulfiller_status IN ('to_be_ordered', 'need_info', 'ordered', 'out_for_delivery', 'unable_to_get')),
  fulfiller_notes TEXT
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

-- Shorthand for store availability arrays
-- ALL = all 3 stores, MJ = Main + Jacktown, MW = Main + Westmoreland, M = Main only
-- All stores:
--   ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333']

-- =============================================================================
-- WINE (exact items from spreadsheet, names match exactly)
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Merlot Res',       'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Cab Res',          'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Greenhouse Red',   'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Sinfandel',        'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Chamb',            'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5),
  ('Noir',             'Wine', 0, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 6),
  ('Rich',             'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 7),
  ('Dan',              'Wine', 4, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 8),
  ('Chard',            'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 9),
  ('Pinot Grigio',     'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 10),
  ('Vidal',            'Wine', 4, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 11),
  ('GH White',         'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 12),
  ('Riesling',         'Wine', 4, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 13),
  ('Frascati',         'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 14),
  ('Hoe',              'Wine', 6, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 15),
  ('Tramp',            'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 16),
  ('Skinny hoe',       'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 17),
  ('Fredonia',         'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 18),
  ('April',            'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 19),
  ('Niagara Celeb',    'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 20),
  ('Diamond',          'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 21),
  ('Niagara',          'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 22),
  ('Concord',          'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 23),
  ('Pom',              'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 24),
  ('Roll in the Hay',  'Wine', 3, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 25),
  ('Ring of Fire',     'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 26),
  ('Lost Vintage',     'Wine', 1, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 27),
  ('Big Hoe',          'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 28),
  ('Big Dan',          'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 29),
  ('Pink',             'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 30),
  ('Harvest Moon',     'Wine', 1, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 31),
  ('GH Cheer',         'Wine', 2, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','c3333333-3333-3333-3333-333333333333'], 32),
  ('Razzling',         'Wine', 4, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 33),
  ('Diamond Crush',    'Wine', 1, 'cases', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 34);

-- =============================================================================
-- PACKAGING
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('3 bottle boxes',              'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('4 bottle boxes',              'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('6 bottle boxes',              'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Brown envelopes (deposits)',  'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Double bottle bags',          'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5),
  ('Florist bags',                'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 6),
  ('Large brown bags',            'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 7),
  ('Scotch tape',                 'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 8),
  ('Shipping boxes/supplies',     'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 9),
  ('Shipping packing tape (Scotch)', 'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 10),
  ('Shrink bags',                 'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 11),
  ('Single bottle bags',          'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 12),
  ('White handle gift bags',      'Packaging', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 13);

-- =============================================================================
-- GIFT SHOP
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Artificial flowers',      'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Basket food',             'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Baskets',                 'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('GH gift cards',           'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('GH glasses',              'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5),
  ('GH stickers',             'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 6),
  ('Gift boxes for glasses',  'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 7),
  ('Ribbon',                  'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 8),
  ('Stretchy cord',           'GiftShop', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 9);

-- =============================================================================
-- POS
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Cups',                    'POS', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Lids',                    'POS', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('POS receipt paper rolls',  'POS', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Straws',                  'POS', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Tasting cups',            'POS', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5);

-- =============================================================================
-- CLEANING (Latex Gloves only at Main Winery)
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('All-purpose cleaner',     'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Bathroom towels',         'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Latex Gloves (all sizes)', 'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 3),
  ('Dish soap',               'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4),
  ('Hand soap',               'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 5),
  ('Garbage Bags',            'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 6),
  ('Kleenex',                 'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 7),
  ('Paper towels',            'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 8),
  ('Toilet bowl cleaner',     'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 9),
  ('Toilet paper',            'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 10),
  ('Wet mopping cloths',      'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 11),
  ('White trash bags',        'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 12),
  ('Windex',                  'Cleaning', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 13);

-- =============================================================================
-- OFFICE
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Brown envelopes (deposits)', 'Office', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Label ink',                  'Office', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2),
  ('Label maker labels',         'Office', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 3),
  ('Pipe Cleaners',              'Office', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 4);

-- =============================================================================
-- SLUSHIE (Main + Westmoreland + Jacktown)
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Slushie mix (jugs)',    'Slushie', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 1),
  ('Slushie mix (retail)',  'Slushie', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111','b2222222-2222-2222-2222-222222222222','c3333333-3333-3333-3333-333333333333'], 2);

-- =============================================================================
-- BAR SUPPLIES (Main Winery only)
-- =============================================================================
INSERT INTO supply_items (name, category, recommended_stock, unit, available_at, sort_order) VALUES
  ('Marisino Cherries',   'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 1),
  ('Tonic Water',         'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 2),
  ('Club Soda',           'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 3),
  ('Water bottles',       'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 4),
  ('Mint Leaves',         'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 5),
  ('Sprig Rosemary',      'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 6),
  ('Lemons',              'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 7),
  ('Limes',               'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 8),
  ('Oranges',             'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 9),
  ('Grenadine',           'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 10),
  ('Napkins',             'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 11),
  ('Cinnamon Sticks',     'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 12),
  ('Ginger Beer',         'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 13),
  ('Pepper',              'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 14),
  ('Pineapple Juice',     'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 15),
  ('Gallon bag (ziploc)', 'BarSupplies', 0, 'each', ARRAY['a1111111-1111-1111-1111-111111111111'], 16);
