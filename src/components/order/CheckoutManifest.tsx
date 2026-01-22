'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useOrderStore } from '@/store/orderStore'
import { createOrder, supabase } from '@/lib/supabase'
import { generateMockBatchId } from '@/lib/mockData'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function CheckoutManifest() {
  const {
    cart,
    selectedTimeSlot,
    updateQuantity,
    removeFromCart,
    customerInfo,
    updateCustomerInfo,
    prevStep,
    nextStep,
    setCompletedOrder,
    isLoading,
    setLoading,
    setError,
    error,
  } = useOrderStore()

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Redirect if no items or slot
  if (cart.length === 0 || !selectedTimeSlot) {
    // Should probably redirect back, but for now just prevent rendering errors
    // Use an effect or just return null and let parent handle it? 
    // Parent logic for "embedded" mode handles step, but "OrderPage" handles step...
    // Let's just return a message or null.
    // Ideally we should push them back to menu if cart is empty.
    return (
      <div className="text-center p-12">
        <p className="text-grey-dark">Your cart is empty.</p>
        <Button onClick={prevStep} className="mt-4">Return to Menu</Button>
      </div>
    )
  }

  // Calculate totals
  const subtotal = cart.reduce((total, item) => total + (item.pizza.price * item.quantity), 0)
  const tax = subtotal * 0.1025 // Chicago sales tax
  const total = subtotal + tax

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone is required'
    } else if (!/^[\d\s\-\(\)\+]+$/.test(customerInfo.phone)) {
      newErrors.phone = 'Invalid phone format'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      if (supabase) {
        // Use real Supabase connection with multi-item support
        const order = await createOrder({
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          time_slot_id: selectedTimeSlot.id,
          cartItems: cart.map(item => ({
            daily_pizza_id: item.pizza.id,
            quantity: item.quantity
          }))
        })

        if (order) {
          // order is likely the first created order row or a response object
          // we just need it for the confirmation steps
          setCompletedOrder(order)
          nextStep()
        }
      } else {
        // Fallback to mock for demo/development
        console.log('Supabase not configured, using mock order')
        await new Promise(resolve => setTimeout(resolve, 1000))

        const mockOrder = {
          id: 'order-' + Date.now(),
          batch_id: generateMockBatchId(),
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          time_slot_id: selectedTimeSlot.id,
          daily_pizza_id: cart[0].pizza.id, // Just pick one for the mock type
          quantity: cart[0].quantity,
          status: 'confirmed' as const,
          created_at: new Date().toISOString(),
        }

        setCompletedOrder(mockOrder)
        nextStep()
      }
    } catch (err) {
      console.error('Order error:', err)
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <span className="section-label">Checkout</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-display font-medium tracking-tight">Order Manifest</h1>
        <p className="mt-4 text-grey-dark">Review and confirm your reservation</p>
      </motion.div>

      {/* Error display */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="mb-8 p-4 border border-red-500/30 bg-red-500/10 text-center"
        >
          <p className="font-mono text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Form */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <div className="glass-card p-6 md:p-8 relative">
            <div className="corner-accent corner-accent-tl" />
            <div className="corner-accent corner-accent-tr" />
            <div className="corner-accent corner-accent-bl" />
            <div className="corner-accent corner-accent-br" />

            <h2 className="font-mono text-xs uppercase tracking-wider text-grey-dark mb-6">
              Contact Information
            </h2>

            <div className="space-y-6">
              <Input
                label="Full Name"
                placeholder="Enter your name"
                value={customerInfo.name}
                onChange={(e) => updateCustomerInfo({ name: e.target.value })}
                error={formErrors.name}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="email@example.com"
                value={customerInfo.email}
                onChange={(e) => updateCustomerInfo({ email: e.target.value })}
                error={formErrors.email}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="(555) 000-0000"
                value={customerInfo.phone}
                onChange={(e) => updateCustomerInfo({ phone: e.target.value })}
                error={formErrors.phone}
              />
            </div>
          </div>
        </motion.div>

        {/* Right: Summary */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass-card p-6 md:p-8 relative">
            <div className="corner-accent corner-accent-tl" />
            <div className="corner-accent corner-accent-tr" />
            <div className="corner-accent corner-accent-bl" />
            <div className="corner-accent corner-accent-br" />

            <h2 className="font-mono text-xs uppercase tracking-wider text-grey-dark mb-6">
              Summary of Work
            </h2>

            <div className="space-y-4">
              {/* Product List */}
              <div className="pb-4 border-b border-white/10 space-y-4">
                {cart.map((item) => (
                  <div key={item.pizza.id} className="pb-4 last:pb-0 last:border-0 border-b border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-sm">{item.pizza.name}</h3>
                        <p className="font-mono text-[10px] text-grey-dark mt-1">
                          10"×14" Detroit Style
                        </p>
                      </div>
                      <span className="font-mono text-sm">
                        ${(item.pizza.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity selector */}
                    <div className="mt-2 flex items-center gap-4">
                      <span className="font-mono text-[10px] text-grey-dark uppercase">Qty</span>
                      <div className="flex items-center border border-white/20">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) updateQuantity(item.pizza.id, item.quantity - 1)
                            else removeFromCart(item.pizza.id)
                          }}
                          className="px-2 py-0.5 font-mono text-xs hover:bg-white/5 transition-colors"
                        >
                          −
                        </button>
                        <span className="px-2 py-0.5 font-mono text-xs border-x border-white/20 min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.pizza.id, item.quantity + 1)}
                          disabled={item.quantity >= 4}
                          className="px-2 py-0.5 font-mono text-xs hover:bg-white/5 disabled:opacity-30 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pickup */}
              <div className="pb-4 border-b border-white/10">
                <div className="spec-row border-0 py-1">
                  <span className="spec-key">Pickup</span>
                  <span className="spec-value">
                    {formatTime(selectedTimeSlot.start_time)}
                  </span>
                </div>
                <div className="spec-row border-0 py-1">
                  <span className="spec-key">Date</span>
                  <span className="spec-value">Today</span>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="spec-row border-0 py-1">
                  <span className="spec-key">Subtotal</span>
                  <span className="spec-value">${subtotal.toFixed(2)}</span>
                </div>
                <div className="spec-row border-0 py-1">
                  <span className="spec-key">Tax</span>
                  <span className="spec-value">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-white/20">
                  <span className="font-mono text-xs uppercase tracking-wider text-white">
                    Total
                  </span>
                  <span className="font-mono text-lg text-matcha">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-4">
        <Button variant="secondary" onClick={prevStep} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={handleSubmit} isLoading={isLoading}>
          Confirm Reservation
        </Button>
      </motion.div>

      {/* Notice */}
      <motion.p
        variants={itemVariants}
        className="mt-6 text-center font-mono text-[10px] text-grey-dark uppercase tracking-wider"
      >
        Payment collected at pickup • Valid photo ID required
      </motion.p>
    </motion.div>
  )
}
