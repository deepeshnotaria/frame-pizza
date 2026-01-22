'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { HeroSection } from '@/components/HeroSection'
import { OrderFlow } from '@/components/order/OrderFlow'
import { mockTodaysPizza, mockTimeSlots } from '@/lib/mockData'
import { getTodaysPizzas, getAvailableTimeSlots, getLocalDateString, supabase } from '@/lib/supabase'
import type { DailyPizzaWithToppings, TimeSlot } from '@/types/database'
import { useOrderStore } from '@/store/orderStore'

export default function HomePage() {
  const [pizzas, setPizzas] = useState<DailyPizzaWithToppings[]>([mockTodaysPizza])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(mockTimeSlots)
  const [loading, setLoading] = useState(true)
  const [headerVisible, setHeaderVisible] = useState(false)

  // Reset order state on mount
  const { currentStep, setStep } = useOrderStore()

  // Reset order state on mount
  useEffect(() => {
    setStep('menu')
  }, [setStep])

  // Fetch real data when step is 'menu' (initial load or reset)
  useEffect(() => {
    async function fetchData() {
      // Only fetch if step is menu to avoid unnecessary refs during flow
      if (currentStep !== 'menu') return

      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const today = getLocalDateString(new Date())
        console.log('Fetching slots for date:', today)
        const [pizzaData, slotsData] = await Promise.all([
          getTodaysPizzas(),
          getAvailableTimeSlots(today),
        ])

        if (pizzaData && pizzaData.length > 0) {
          setPizzas(pizzaData as DailyPizzaWithToppings[])
        }
        if (slotsData) {
          setTimeSlots(slotsData as TimeSlot[])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentStep])

  // Show header after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const threshold = window.innerHeight * 0.4
      setHeaderVisible(scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-frame-bg">
      {/* Header - appears after scrolling */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-frame-bg/80 backdrop-blur-md border-b border-white/5"
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: headerVisible ? 1 : 0,
          y: headerVisible ? 0 : -20,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: headerVisible ? 'auto' : 'none' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-lg tracking-wider text-white">FRAME</span>
          <Link
            href="/order"
            className="font-mono text-xs uppercase tracking-wider text-grey-dark hover:text-matcha transition-colors"
          >
            Find Today&apos;s Batch
          </Link>
        </div>
      </motion.header>

      {/* Hero Section with Scroll Animation */}
      <HeroSection />

      {/* Order Flow Section (Replaces Blueprint & Batch) */}
      <section className="py-12 border-t border-white/5 blueprint-grid min-h-[80vh]" id="order-flow">
        <OrderFlow pizzas={pizzas} timeSlots={timeSlots} embedded={true} />
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Critical Reception</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-medium tracking-tight">The Critique</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'A masterclass in restraint. Every element serves the whole.',
                cite: 'The Food Architect',
              },
              {
                quote: "They've deconstructed pizza and rebuilt it as sculpture.",
                cite: 'Culinary Review',
              },
              {
                quote: 'The negative space between toppings speaks volumes.',
                cite: 'Minimalist Dining',
              },
            ].map((testimonial, index) => (
              <motion.blockquote
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <p className="text-lg text-grey italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <cite className="mt-4 block font-mono text-xs uppercase tracking-wider text-grey-dark not-italic">
                  — {testimonial.cite}
                </cite>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-sm text-grey-dark">
            FRAME © {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="font-mono text-xs text-grey-dark hover:text-white transition-colors">
              Instagram
            </a>
            <a href="#" className="font-mono text-xs text-grey-dark hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
