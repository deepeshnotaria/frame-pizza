'use client'

import { useEffect, useState } from 'react'
import { OrderFlow } from '@/components/order/OrderFlow'
import { getTodaysPizzas, getAvailableTimeSlots, getLocalDateString, supabase } from '@/lib/supabase'
import { mockTodaysPizza, mockTimeSlots } from '@/lib/mockData'
import type { DailyPizzaWithToppings, TimeSlot } from '@/types/database'
import { motion } from 'framer-motion'
import { useOrderStore } from '@/store/orderStore'

export default function OrderPage() {
  const [pizzas, setPizzas] = useState<DailyPizzaWithToppings[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentStep = useOrderStore((state) => state.currentStep)

  useEffect(() => {
    async function fetchData() {
      // Only fetch if we are initializing or resetting to menu
      if (currentStep !== 'menu') return;

      // Check if Supabase is configured
      if (!supabase) {
        console.log('Supabase not configured, using mock data')
        setPizzas([mockTodaysPizza])
        setTimeSlots(mockTimeSlots)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const today = getLocalDateString(new Date())

        // Fetch today's pizza and time slots in parallel
        const [pizzaData, slotsData] = await Promise.all([
          getTodaysPizzas(),
          getAvailableTimeSlots(today),
        ])

        if (pizzaData && pizzaData.length > 0) {
          setPizzas(pizzaData as DailyPizzaWithToppings[])
        } else {
          setError('No pizza available today')
        }

        if (slotsData) {
          setTimeSlots(slotsData as TimeSlot[])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        // Fall back to mock data on error
        setPizzas([mockTodaysPizza])
        setTimeSlots(mockTimeSlots)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentStep])

  if (loading) {
    return (
      <div className="min-h-screen bg-frame-bg blueprint-grid flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border border-matcha/30 flex items-center justify-center mx-auto mb-4">
            <motion.div
              className="w-6 h-6 border-t border-matcha"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-grey-dark">
            Loading today&apos;s batch...
          </span>
        </motion.div>
      </div>
    )
  }

  if (error && pizzas.length === 0) {
    return (
      <div className="min-h-screen bg-frame-bg blueprint-grid flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-12 h-12 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500">!</span>
          </div>
          <h1 className="font-display text-2xl mb-2">Unavailable</h1>
          <p className="font-mono text-sm text-grey-dark">{error}</p>
        </div>
      </div>
    )
  }

  if (pizzas.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-frame-bg blueprint-grid">
      <OrderFlow pizzas={pizzas} timeSlots={timeSlots} />
    </div>
  )
}
