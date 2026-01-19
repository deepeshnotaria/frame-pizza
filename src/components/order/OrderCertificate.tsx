'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useOrderStore } from '@/store/orderStore'
import { mockTodaysPizza, mockTimeSlots } from '@/lib/mockData'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function formatDate(): string {
  const date = new Date()
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function OrderCertificate() {
  const { completedOrder, selectedPizza, selectedTimeSlot, quantity, reset } = useOrderStore()

  if (!completedOrder) {
    return null
  }

  // Use selected data or fall back to mock for display
  const pizza = selectedPizza || mockTodaysPizza
  const timeSlot = selectedTimeSlot || mockTimeSlots[0]
  const total = pizza.price * quantity * 1.1025 // Including tax

  const handleNewOrder = () => {
    reset()
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success indicator */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 border-2 border-matcha"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <svg className="w-8 h-8 text-matcha" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Certificate */}
      <motion.div variants={itemVariants}>
        <div className="glass-card relative overflow-hidden">
          {/* Blueprint grid background */}
          <div className="absolute inset-0 blueprint-grid-strong opacity-50" />

          {/* Corner accents */}
          <div className="corner-accent corner-accent-tl !w-8 !h-8" />
          <div className="corner-accent corner-accent-tr !w-8 !h-8" />
          <div className="corner-accent corner-accent-bl !w-8 !h-8" />
          <div className="corner-accent corner-accent-br !w-8 !h-8" />

          <div className="relative p-8 md:p-12">
            {/* Header */}
            <div className="text-center border-b border-white/10 pb-8 mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-grey-dark">
                Certificate of Reservation
              </span>
              <h1 className="mt-4 text-3xl md:text-4xl font-light tracking-tight">
                Order Confirmed
              </h1>
              <p className="mt-2 text-grey-dark">{formatDate()}</p>
            </div>

            {/* Batch ID */}
            <div className="text-center mb-8 py-6 border border-matcha/30 bg-matcha/5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-grey-dark block mb-2">
                Batch Identifier
              </span>
              <span className="font-mono text-2xl md:text-3xl text-matcha tracking-wider">
                {completedOrder.batch_id}
              </span>
            </div>

            {/* Order details grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Product */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-grey-dark mb-4">
                  Product Specification
                </h3>
                <div className="space-y-2">
                  <div className="spec-row">
                    <span className="spec-key">Item</span>
                    <span className="spec-value">{pizza.name}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Format</span>
                    <span className="spec-value">10"×14" Detroit</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Quantity</span>
                    <span className="spec-value">{quantity}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Total</span>
                    <span className="spec-value text-matcha">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Pickup */}
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-grey-dark mb-4">
                  Collection Details
                </h3>
                <div className="space-y-2">
                  <div className="spec-row">
                    <span className="spec-key">Window</span>
                    <span className="spec-value">
                      {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Location</span>
                    <span className="spec-value">FRAME Chicago</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Name</span>
                    <span className="spec-value">{completedOrder.customer_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="border-t border-white/10 pt-8">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-grey-dark mb-4">
                Pickup Protocol
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-matcha text-xs">01</span>
                  <span className="text-sm text-grey">
                    Present this batch ID or confirmation email at pickup window
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-matcha text-xs">02</span>
                  <span className="text-sm text-grey">
                    Valid photo identification required for order collection
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-matcha text-xs">03</span>
                  <span className="text-sm text-grey">
                    Payment accepted at pickup: Card or exact cash only
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-matcha text-xs">04</span>
                  <span className="text-sm text-grey">
                    Uncollected orders held for 15 minutes past window close
                  </span>
                </li>
              </ul>
            </div>

            {/* Footer stamp */}
            <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
              <div>
                <span className="font-mono text-[10px] text-grey-dark block">FRAME</span>
                <span className="font-mono text-[10px] text-grey-dark">Chicago, IL</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] text-grey-dark block">
                  Issued: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono text-[10px] text-grey-dark">
                  Ref: {completedOrder.batch_id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="mt-8 text-center">
        <p className="font-mono text-xs text-grey-dark mb-4">
          Confirmation sent to {completedOrder.customer_email}
        </p>
        <Button variant="secondary" onClick={handleNewOrder}>
          Place Another Order
        </Button>
      </motion.div>
    </motion.div>
  )
}
