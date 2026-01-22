-- Migration: Add recipe system for two-layer ingredient management
-- This creates recipes as an intermediate layer between customer-facing toppings and inventory

-- Recipes table - reusable prep recipes
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cheese', 'sauce', 'base', 'topping', 'finish', 'other')),
    description TEXT,
    yield_quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.0,
    yield_unit VARCHAR(20) NOT NULL DEFAULT 'batch',
    prep_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ingredients - what inventory items make up each recipe
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, inventory_item_id)
);

-- Topping-recipe links - connects pizza toppings to recipes OR direct inventory items
CREATE TABLE IF NOT EXISTS topping_recipe_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pizza_topping_id UUID NOT NULL REFERENCES pizza_toppings(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    quantity_per_pizza DECIMAL(10, 4) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT one_of_recipe_or_item CHECK (
        (recipe_id IS NOT NULL AND inventory_item_id IS NULL) OR
        (recipe_id IS NULL AND inventory_item_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_inventory ON recipe_ingredients(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_topping_recipe_links_topping ON topping_recipe_links(pizza_topping_id);
CREATE INDEX IF NOT EXISTS idx_topping_recipe_links_recipe ON topping_recipe_links(recipe_id);

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE topping_recipe_links ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to recipes"
    ON recipes FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access to recipe_ingredients"
    ON recipe_ingredients FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access to topping_recipe_links"
    ON topping_recipe_links FOR SELECT TO anon USING (true);

-- Authenticated user management
CREATE POLICY "Allow authenticated to manage recipes"
    ON recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated to manage recipe_ingredients"
    ON recipe_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated to manage topping_recipe_links"
    ON topping_recipe_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
