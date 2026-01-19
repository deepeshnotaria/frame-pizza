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

// Extended types with relations
export type DailyPizzaWithToppings = DailyPizza & {
  pizza_toppings: PizzaTopping[]
}

export type OrderWithDetails = Order & {
  time_slots: TimeSlot
  daily_pizzas: DailyPizzaWithToppings
}
