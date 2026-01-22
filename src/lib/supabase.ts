import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client with proper session persistence
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  })
  : null

// Debug: Log session state on client load (can be removed in production)
if (typeof window !== 'undefined' && supabase) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (data.session) {
      console.log('[Supabase] Active session:', data.session.user.email)
    } else {
      console.log('[Supabase] No active session')
    }
  })
}

// Helper functions for common operations - these use raw Supabase queries
// In production, connect to actual Supabase instance
// For demo, the app uses mockData.ts instead

// Helper for local date string YYYY-MM-DD
export const getLocalDateString = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getTodaysPizzas() {
  if (!supabase) throw new Error('Supabase not configured')

  const today = getLocalDateString(new Date())
  const { data, error } = await supabase
    .from('daily_pizzas')
    .select('*, pizza_toppings(*)')
    .eq('date', today)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}

export async function getAvailableTimeSlots(date: string) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('date', date)
    .order('start_time', { ascending: true })

  console.log('getAvailableTimeSlots response:', { date, count: data?.length, error })

  if (error) throw error
  return data
}

export async function createOrder(orderData: {
  customer_name: string
  customer_email: string
  customer_phone: string
  time_slot_id: string
  cartItems: {
    daily_pizza_id: string
    quantity: number
  }[]
}) {
  if (!supabase) throw new Error('Supabase not configured')

  const batch_id = generateBatchId()
  const ordersToInsert = orderData.cartItems.map(item => ({
    customer_name: orderData.customer_name,
    customer_email: orderData.customer_email,
    customer_phone: orderData.customer_phone,
    time_slot_id: orderData.time_slot_id,
    daily_pizza_id: item.daily_pizza_id,
    quantity: item.quantity,
    status: 'confirmed',
    batch_id
  }))

  // Create the orders with batch ID
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .insert(ordersToInsert)
    .select()

  if (orderError) throw orderError
  // Return the first order as a reference, or you might want to return the whole list.
  // For now, returning the one object helps compatibility with some checks, 
  // but logically the "order" is the batch.
  return orders?.[0]
}

export async function getOrderByBatchId(batchId: string) {
  if (!supabase) throw new Error('Supabase not configured')

  // We want to fetch ALL items in the batch
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      time_slots(*),
      daily_pizzas(*, pizza_toppings(*))
    `)
    .eq('batch_id', batchId)

  // Note: we removed .single() because a batch can have multiple rows now.
  // Consumers should expect an array or handle the first item for "order details" and iterate for "items".

  if (error) throw error
  return data
}

// Subscribe to real-time batch updates
export function subscribeToBatchUpdates(
  pizzaId: string,
  callback: (currentBatch: number) => void
) {
  if (!supabase) return null

  return supabase
    .channel(`pizza-${pizzaId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'daily_pizzas',
        filter: `id=eq.${pizzaId}`,
      },
      (payload) => {
        const newData = payload.new as { current_batch: number }
        callback(newData.current_batch)
      }
    )
    .subscribe()
}

function generateBatchId(): string {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `FRM-${dateStr}-${random}`
}
