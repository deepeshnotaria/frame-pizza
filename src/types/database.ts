export interface Database {
  public: {
    Tables: {
      daily_pizzas: {
        Row: {
          id: string
          date: string
          name: string
          description: string
          price: number
          hydration: string
          fermentation_time: string
          crust_type: string
          max_batch: number
          current_batch: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_pizzas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_pizzas']['Insert']>
      }
      pizza_toppings: {
        Row: {
          id: string
          daily_pizza_id: string
          name: string
          category: 'base' | 'cheese' | 'topping' | 'finish'
          is_highlighted: boolean
          is_customer_visible: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pizza_toppings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['pizza_toppings']['Insert']>
      }
      time_slots: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          max_orders: number
          current_orders: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['time_slots']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['time_slots']['Insert']>
      }
      orders: {
        Row: {
          id: string
          batch_id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          time_slot_id: string
          daily_pizza_id: string
          quantity: number
          status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
    }
  }
}

// Convenience types
export type DailyPizza = Database['public']['Tables']['daily_pizzas']['Row']
export type PizzaTopping = Database['public']['Tables']['pizza_toppings']['Row']
export type TimeSlot = Database['public']['Tables']['time_slots']['Row']
export type Order = Database['public']['Tables']['orders']['Row']

export type DailyPizzaWithToppings = DailyPizza & {
  pizza_toppings: PizzaTopping[]
}

export type OrderWithDetails = Order & {
  time_slots: TimeSlot
  daily_pizzas: DailyPizzaWithToppings
}

// Inventory Types
export interface InventoryItem {
  id: string
  name: string
  category: 'protein' | 'cheese' | 'produce' | 'dry_goods' | 'sauce' | 'oil' | 'spice' | 'other'
  unit: string
  current_quantity: number
  par_level: number | null
  cost_per_unit: number | null
  last_restocked_at: string | null
  expiration_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  inventory_item_id: string
  transaction_type: 'purchase' | 'usage' | 'waste' | 'adjustment' | 'return'
  quantity: number
  unit_cost: number | null
  notes: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface VendorItem {
  id: string
  vendor_id: string
  inventory_item_id: string
  vendor_sku: string | null
  unit_price: number
  min_order_quantity: number | null
  lead_time_days: number | null
  is_preferred: boolean
  last_ordered_at: string | null
  created_at: string
}

// Extended inventory types
export type InventoryItemWithTransactions = InventoryItem & {
  inventory_transactions: InventoryTransaction[]
}

export type VendorWithItems = Vendor & {
  vendor_items: (VendorItem & { inventory_items: InventoryItem })[]
}

// Topping-Inventory Link types
export interface ToppingInventoryLink {
  id: string
  pizza_topping_id: string
  inventory_item_id: string
  quantity_per_pizza: number
  created_at: string
}

export interface ForecastSettings {
  id: string
  safety_margin: number
  created_at: string
  updated_at: string
}

// Recipe Types
export interface Recipe {
  id: string
  name: string
  category: 'cheese' | 'sauce' | 'base' | 'topping' | 'finish' | 'other'
  description: string | null
  yield_quantity: number
  yield_unit: string
  prep_notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  inventory_item_id: string
  quantity: number
  created_at: string
}

export interface ToppingRecipeLink {
  id: string
  pizza_topping_id: string
  recipe_id: string
  quantity_per_pizza: number
  created_at: string
}

// Extended recipe types
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (RecipeIngredient & {
    inventory_items: InventoryItem
  })[]
}

// Extended types with inventory and sales data
export type PizzaToppingWithInventory = PizzaTopping & {
  topping_inventory_links?: (ToppingInventoryLink & {
    inventory_items?: InventoryItem
  })[]
  topping_recipe_links?: (ToppingRecipeLink & {
    recipes?: RecipeWithIngredients
  })[]
}

export type DailyPizzaWithSales = DailyPizza & {
  total_orders?: number
  units_sold?: number
  revenue?: number
}

export type DailyPizzaWithToppingsAndInventory = DailyPizza & {
  pizza_toppings: PizzaToppingWithInventory[]
}
