import type { DailyPizzaWithToppings, TimeSlot } from '@/types/database'

// Mock data for development/demo purposes
export const mockTodaysPizza: DailyPizzaWithToppings = {
  id: 'mock-pizza-001',
  date: new Date().toISOString().split('T')[0],
  name: 'The Architect',
  description: 'Our signature 10"x14" Detroit-style vegan pizza featuring a crispy frico edge of melted vegan mozzarella.',
  price: 28,
  hydration: '68%',
  fermentation_time: '72hrs @ 4°C',
  crust_type: 'Vegan Frico',
  max_batch: 40,
  current_batch: 14,
  created_at: new Date().toISOString(),
  pizza_toppings: [
    { id: 't1', daily_pizza_id: 'mock-pizza-001', name: 'San Marzano Tomato Base', category: 'base', is_highlighted: false, created_at: '' },
    { id: 't2', daily_pizza_id: 'mock-pizza-001', name: 'House-made Vegan Mozzarella', category: 'cheese', is_highlighted: true, created_at: '' },
    { id: 't3', daily_pizza_id: 'mock-pizza-001', name: 'Vegan Frico Edge', category: 'cheese', is_highlighted: true, created_at: '' },
    { id: 't4', daily_pizza_id: 'mock-pizza-001', name: 'Fresh Basil', category: 'topping', is_highlighted: false, created_at: '' },
    { id: 't5', daily_pizza_id: 'mock-pizza-001', name: 'Calabrian Chili Oil', category: 'topping', is_highlighted: false, created_at: '' },
    { id: 't6', daily_pizza_id: 'mock-pizza-001', name: 'Maldon Sea Salt', category: 'finish', is_highlighted: false, created_at: '' },
    { id: 't7', daily_pizza_id: 'mock-pizza-001', name: 'Cold-pressed EVOO', category: 'finish', is_highlighted: false, created_at: '' },
  ]
}

export const mockTimeSlots: TimeSlot[] = [
  { id: 'ts1', date: new Date().toISOString().split('T')[0], start_time: '11:00', end_time: '11:30', max_orders: 8, current_orders: 6, created_at: '' },
  { id: 'ts2', date: new Date().toISOString().split('T')[0], start_time: '11:30', end_time: '12:00', max_orders: 8, current_orders: 8, created_at: '' },
  { id: 'ts3', date: new Date().toISOString().split('T')[0], start_time: '12:00', end_time: '12:30', max_orders: 8, current_orders: 4, created_at: '' },
  { id: 'ts4', date: new Date().toISOString().split('T')[0], start_time: '12:30', end_time: '13:00', max_orders: 8, current_orders: 2, created_at: '' },
  { id: 'ts5', date: new Date().toISOString().split('T')[0], start_time: '13:00', end_time: '13:30', max_orders: 8, current_orders: 0, created_at: '' },
  { id: 'ts6', date: new Date().toISOString().split('T')[0], start_time: '17:00', end_time: '17:30', max_orders: 8, current_orders: 5, created_at: '' },
  { id: 'ts7', date: new Date().toISOString().split('T')[0], start_time: '17:30', end_time: '18:00', max_orders: 8, current_orders: 8, created_at: '' },
  { id: 'ts8', date: new Date().toISOString().split('T')[0], start_time: '18:00', end_time: '18:30', max_orders: 8, current_orders: 3, created_at: '' },
  { id: 'ts9', date: new Date().toISOString().split('T')[0], start_time: '18:30', end_time: '19:00', max_orders: 8, current_orders: 0, created_at: '' },
  { id: 'ts10', date: new Date().toISOString().split('T')[0], start_time: '19:00', end_time: '19:30', max_orders: 8, current_orders: 0, created_at: '' },
]

// Function to generate a mock batch ID
export function generateMockBatchId(): string {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `FRM-${dateStr}-${random}`
}
