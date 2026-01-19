import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client - will be undefined if env vars not set
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper functions for common operations - these use raw Supabase queries
// In production, connect to actual Supabase instance
// For demo, the app uses mockData.ts instead

// Helper for local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
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

  if (error) throw error
  return data
}

export async function createOrder(orderData: {
  customer_name: string
  customer_email: string
  customer_phone: string
  time_slot_id: string
  daily_pizza_id: string
  quantity: number
}) {
  if (!supabase) throw new Error('Supabase not configured')

  // Create the order with batch ID
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      ...orderData,
      status: 'confirmed',
      batch_id: generateBatchId(),
    } as Record<string, unknown>)
    .select()
    .single()

  if (orderError) throw orderError
  return order
}

export async function getOrderByBatchId(batchId: string) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      time_slots(*),
      daily_pizzas(*, pizza_toppings(*))
    `)
    .eq('batch_id', batchId)
    .single()

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
