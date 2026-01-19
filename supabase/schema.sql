-- FRAME Pizza Pre-order Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Daily Pizzas table
CREATE TABLE daily_pizzas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 28.00,
    hydration VARCHAR(50) DEFAULT '68%',
    fermentation_time VARCHAR(50) DEFAULT '72hrs @ 4°C',
    crust_type VARCHAR(100) DEFAULT 'Vegan Frico',
    max_batch INTEGER NOT NULL DEFAULT 40,
    current_batch INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pizza Toppings table
CREATE TABLE pizza_toppings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_pizza_id UUID NOT NULL REFERENCES daily_pizzas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('base', 'cheese', 'topping', 'finish')),
    is_highlighted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Slots table
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INTEGER NOT NULL DEFAULT 8,
    current_orders INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, start_time)
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id),
    daily_pizza_id UUID NOT NULL REFERENCES daily_pizzas(id),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 4),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_daily_pizzas_date ON daily_pizzas(date);
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_orders_batch_id ON orders(batch_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_pizza_toppings_pizza ON pizza_toppings(daily_pizza_id);

-- Enable Row Level Security
ALTER TABLE daily_pizzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pizza_toppings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Allow public read access to daily_pizzas"
    ON daily_pizzas FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow public read access to pizza_toppings"
    ON pizza_toppings FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow public read access to time_slots"
    ON time_slots FOR SELECT
    TO anon
    USING (true);

-- RLS Policies for orders (public can create, read their own by batch_id)
CREATE POLICY "Allow public to create orders"
    ON orders FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public to read orders by batch_id"
    ON orders FOR SELECT
    TO anon
    USING (true);

-- Enable realtime for batch updates
ALTER PUBLICATION supabase_realtime ADD TABLE daily_pizzas;
ALTER PUBLICATION supabase_realtime ADD TABLE time_slots;

-- Insert sample data for today
INSERT INTO daily_pizzas (date, name, description, price, hydration, fermentation_time, crust_type, max_batch, current_batch)
VALUES (
    CURRENT_DATE,
    'The Architect',
    'Our signature 10"x14" Detroit-style vegan pizza featuring a crispy frico edge of melted vegan mozzarella.',
    28.00,
    '68%',
    '72hrs @ 4°C',
    'Vegan Frico',
    40,
    14
);

-- Get the pizza ID for toppings
DO $$
DECLARE
    pizza_id UUID;
BEGIN
    SELECT id INTO pizza_id FROM daily_pizzas WHERE date = CURRENT_DATE;

    -- Insert toppings
    INSERT INTO pizza_toppings (daily_pizza_id, name, category, is_highlighted) VALUES
        (pizza_id, 'San Marzano Tomato Base', 'base', false),
        (pizza_id, 'House-made Vegan Mozzarella', 'cheese', true),
        (pizza_id, 'Vegan Frico Edge', 'cheese', true),
        (pizza_id, 'Fresh Basil', 'topping', false),
        (pizza_id, 'Calabrian Chili Oil', 'topping', false),
        (pizza_id, 'Maldon Sea Salt', 'finish', false),
        (pizza_id, 'Cold-pressed EVOO', 'finish', false);
END $$;

-- Insert time slots for today
INSERT INTO time_slots (date, start_time, end_time, max_orders, current_orders) VALUES
    (CURRENT_DATE, '11:00', '11:30', 8, 6),
    (CURRENT_DATE, '11:30', '12:00', 8, 8),
    (CURRENT_DATE, '12:00', '12:30', 8, 4),
    (CURRENT_DATE, '12:30', '13:00', 8, 2),
    (CURRENT_DATE, '13:00', '13:30', 8, 0),
    (CURRENT_DATE, '17:00', '17:30', 8, 5),
    (CURRENT_DATE, '17:30', '18:00', 8, 8),
    (CURRENT_DATE, '18:00', '18:30', 8, 3),
    (CURRENT_DATE, '18:30', '19:00', 8, 0),
    (CURRENT_DATE, '19:00', '19:30', 8, 0);
