-- ============================================================
-- GH Winery Supply Ordering — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- Drop existing tables/triggers/policies if they exist (clean slate)
DROP TRIGGER IF EXISTS order_items_updated_at ON order_items;
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS supply_catalog CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at();

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('store_staff', 'distribution', 'supplies', 'admin')),
    store_location TEXT CHECK (store_location IN ('Main Winery', 'Jacktown', 'Westmoreland')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supply catalog (master list of orderable items)
CREATE TABLE supply_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Wine', 'Packaging', 'Tasting Room', 'Cleaning', 'Office', 'Bar Supplies')),
    unit TEXT NOT NULL DEFAULT 'units',
    product_url TEXT DEFAULT '',
    available_at TEXT[] NOT NULL DEFAULT ARRAY['Main Winery', 'Jacktown', 'Westmoreland']
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_location TEXT NOT NULL CHECK (store_location IN ('Main Winery', 'Jacktown', 'Westmoreland')),
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'in_progress', 'completed')),
    created_by UUID REFERENCES profiles(id),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items (individual line items with per-item fulfillment status)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'units',
    fulfillment_team TEXT NOT NULL CHECK (fulfillment_team IN ('distribution', 'supplies')),
    status TEXT NOT NULL DEFAULT 'pending',
    received_by_store BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_team_status ON order_items(fulfillment_team, status);
CREATE INDEX idx_orders_location_status ON orders(store_location, status);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update their own
CREATE POLICY "Anyone can read profiles"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Supply catalog: everyone can read
CREATE POLICY "Anyone can read catalog"
    ON supply_catalog FOR SELECT USING (true);

CREATE POLICY "Admins can manage catalog"
    ON supply_catalog FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Orders: store staff see their location, fulfillment/admin see all
CREATE POLICY "Users can read relevant orders"
    ON orders FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND (
                role IN ('distribution', 'supplies', 'admin')
                OR (role = 'store_staff' AND store_location = orders.store_location)
            )
        )
    );

CREATE POLICY "Store staff can create orders"
    ON orders FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('store_staff', 'admin')
        )
    );

CREATE POLICY "Authorized users can update orders"
    ON orders FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('store_staff', 'distribution', 'supplies', 'admin')
        )
    );

CREATE POLICY "Store staff can delete own draft orders"
    ON orders FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND (role = 'admin' OR (role = 'store_staff' AND created_by = auth.uid()))
        )
        AND status = 'draft'
    );

-- Order items: same access as orders
CREATE POLICY "Users can read relevant order items"
    ON order_items FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN profiles ON profiles.id = auth.uid()
            WHERE orders.id = order_items.order_id
            AND (
                profiles.role IN ('distribution', 'supplies', 'admin')
                OR (profiles.role = 'store_staff' AND profiles.store_location = orders.store_location)
            )
        )
    );

CREATE POLICY "Store staff can insert order items"
    ON order_items FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('store_staff', 'admin')
        )
    );

CREATE POLICY "Authorized users can update order items"
    ON order_items FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('store_staff', 'distribution', 'supplies', 'admin')
        )
    );

CREATE POLICY "Cascade delete handles order items"
    ON order_items FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================
-- Auto-create profile on signup (via trigger)
-- ============================================================
-- Note: Profile is created by the app after signup, not via trigger,
-- because we need the role and location from the signup form.
