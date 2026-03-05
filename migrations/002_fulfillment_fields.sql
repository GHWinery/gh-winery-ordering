-- Add estimated delivery date and tracking number to order items
ALTER TABLE order_items ADD COLUMN estimated_delivery_date DATE;
ALTER TABLE order_items ADD COLUMN tracking_number TEXT DEFAULT '';
