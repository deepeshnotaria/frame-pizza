import { create } from 'zustand'
import type { DailyPizzaWithToppings, TimeSlot, Order } from '@/types/database'

export type OrderStep = 'menu' | 'schedule' | 'checkout' | 'confirmation'

interface CustomerInfo {
  name: string
  email: string
  phone: string
}

export interface CartItem {
  pizza: DailyPizzaWithToppings
  quantity: number
}

interface OrderState {
  // Current step in the flow
  currentStep: OrderStep

  // Selected data
  cart: CartItem[]
  selectedTimeSlot: TimeSlot | null
  customerInfo: CustomerInfo

  // Completed order
  completedOrder: Order | null // This might need to be an array or a complex object if we return multiple rows, but for now let's assume we handle the "order" concept as a batch.
  // actually, supabase returns one row usually, but we will have multiple. 
  // Let's keep it simple: "completedOrder" tracks the *primary* order reference or just the batch ID?
  // For the confirmation page, we probably just need the batch_id to look it up, or the list of created orders.
  // Let's stick to `completedBatchId: string | null` perhaps? Or just keep it loosely typed or store one of the orders.
  // Let's change `completedOrder` to `completedBatchId` for clarity, or keep it `Order[]`?
  // The existing code uses `completedOrder: Order | null`. 
  // Let's just store the first order created for now to keep it compatible with "OrderCertificate", or Update OrderCertificate to fetch by Batch ID.
  // Actually, `Order` type has `batch_id`. So keeping one order object is enough to get the batch_id.

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  setStep: (step: OrderStep) => void
  nextStep: () => void
  prevStep: () => void

  // Cart Actions
  addToCart: (pizza: DailyPizzaWithToppings, quantity: number) => void
  removeFromCart: (pizzaId: string) => void
  updateQuantity: (pizzaId: string, quantity: number) => void

  selectTimeSlot: (slot: TimeSlot | null) => void
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void
  setCompletedOrder: (order: Order) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const stepOrder: OrderStep[] = ['menu', 'schedule', 'checkout', 'confirmation']

const initialCustomerInfo: CustomerInfo = {
  name: '',
  email: '',
  phone: '',
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentStep: 'menu',
  cart: [],
  selectedTimeSlot: null,
  customerInfo: initialCustomerInfo,
  completedOrder: null,
  isLoading: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get()
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1] })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1] })
    }
  },

  addToCart: (pizza, quantity) => set((state) => {
    const existingItem = state.cart.find(item => item.pizza.id === pizza.id)
    if (existingItem) {
      return {
        cart: state.cart.map(item =>
          item.pizza.id === pizza.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, 4) } // Max 4 total? Or 4 per item? Let's say 4 per item for now.
            : item
        )
      }
    }
    return { cart: [...state.cart, { pizza, quantity }] }
  }),

  removeFromCart: (pizzaId) => set((state) => ({
    cart: state.cart.filter(item => item.pizza.id !== pizzaId)
  })),

  updateQuantity: (pizzaId, quantity) => set((state) => ({
    cart: state.cart.map(item =>
      item.pizza.id === pizzaId
        ? { ...item, quantity: Math.max(0, Math.min(quantity, 4)) } // Allow 0 to remove? Or keep min 1? Let's use 0 to remove in UI usually, but here keep bounds. 
        // If 0, maybe remove? Let's keep min 1 here and explicit remove for now.
        : item
    )
  })),

  selectTimeSlot: (slot) => set({ selectedTimeSlot: slot }),

  updateCustomerInfo: (info) => set((state) => ({
    customerInfo: { ...state.customerInfo, ...info }
  })),

  setCompletedOrder: (order) => set({ completedOrder: order }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    currentStep: 'menu',
    cart: [],
    selectedTimeSlot: null,
    customerInfo: initialCustomerInfo,
    completedOrder: null,
    isLoading: false,
    error: null,
  }),
}))
