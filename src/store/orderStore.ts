import { create } from 'zustand'
import type { DailyPizzaWithToppings, TimeSlot, Order } from '@/types/database'

export type OrderStep = 'menu' | 'schedule' | 'checkout' | 'confirmation'

interface CustomerInfo {
  name: string
  email: string
  phone: string
}

interface OrderState {
  // Current step in the flow
  currentStep: OrderStep

  // Selected data
  selectedPizza: DailyPizzaWithToppings | null
  selectedTimeSlot: TimeSlot | null
  quantity: number
  customerInfo: CustomerInfo

  // Completed order
  completedOrder: Order | null

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  setStep: (step: OrderStep) => void
  nextStep: () => void
  prevStep: () => void
  selectPizza: (pizza: DailyPizzaWithToppings) => void
  selectTimeSlot: (slot: TimeSlot | null) => void
  setQuantity: (qty: number) => void
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
  selectedPizza: null,
  selectedTimeSlot: null,
  quantity: 1,
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

  selectPizza: (pizza) => set({ selectedPizza: pizza }),

  selectTimeSlot: (slot) => set({ selectedTimeSlot: slot }),

  setQuantity: (qty) => set({ quantity: Math.max(1, Math.min(qty, 4)) }),

  updateCustomerInfo: (info) => set((state) => ({
    customerInfo: { ...state.customerInfo, ...info }
  })),

  setCompletedOrder: (order) => set({ completedOrder: order }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    currentStep: 'menu',
    selectedPizza: null,
    selectedTimeSlot: null,
    quantity: 1,
    customerInfo: initialCustomerInfo,
    completedOrder: null,
    isLoading: false,
    error: null,
  }),
}))
