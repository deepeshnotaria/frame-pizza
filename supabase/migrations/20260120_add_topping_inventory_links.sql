-- Migration: Add topping inventory links for menu-inventory integration
-- This links pizza toppings to inventory items with quantity tracking

-- Create junction table for topping-inventory linking
CREATE TABLE IF NOT EXISTS topping_inventory_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pizza_topping_id UUID NOT NULL REFERENCES pizza_toppings(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_per_pizza DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pizza_topping_id, inventory_item_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_topping_inv_links_topping ON topping_inventory_links(pizza_topping_id);
CREATE INDEX IF NOT EXISTS idx_topping_inv_links_inventory ON topping_inventory_links(inventory_item_id);

-- Enable RLS
ALTER TABLE topping_inventory_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access (same as other tables)
CREATE POLICY "Allow public read access to topping_inventory_links"
    ON topping_inventory_links FOR SELECT
    TO anon
    USING (true);

-- Allow authenticated users to modify (for admin operations)
CREATE POLICY "Allow authenticated users to manage topping_inventory_links"
    ON topping_inventory_links FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add forecast settings table for configurable safety margin
CREATE TABLE IF NOT EXISTS forecast_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    safety_margin DECIMAL(4, 2) NOT NULL DEFAULT 1.10, -- 10% buffer by default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO forecast_settings (safety_margin) VALUES (1.10)
ON CONFLICT DO NOTHING;

-- Enable RLS on forecast_settings
ALTER TABLE forecast_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to forecast_settings"
    ON forecast_settings FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow authenticated users to manage forecast_settings"
    ON forecast_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
