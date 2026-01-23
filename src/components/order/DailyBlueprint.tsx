'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BatchProgress } from '@/components/ui/BatchProgress'
import { Button } from '@/components/ui/Button'
import type { DailyPizzaWithToppings } from '@/types/database'
import { useOrderStore } from '@/store/orderStore'

interface DailyBlueprintProps {
  pizzas: DailyPizzaWithToppings[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 }
  }
}

const gridVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.3 }
  }
}

export function DailyBlueprint({ pizzas }: DailyBlueprintProps) {
  const { cart, addToCart, removeFromCart, updateQuantity, nextStep } = useOrderStore()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedPizza = pizzas[selectedIndex]
  const hasMultiplePizzas = pizzas.length > 1

  // Navigation functions for infinite loop
  const goToPrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? pizzas.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === pizzas.length - 1 ? 0 : prev + 1))
  }

  // Swipe threshold for mobile gestures
  const swipeThreshold = 50


  // Get current quantity of selected pizza in cart (default to 0)
  const cartItem = cart.find(item => item.pizza.id === selectedPizza.id)
  const currentQuantity = cartItem ? cartItem.quantity : 0

  // Calculate total cart value
  const cartTotal = cart.reduce((total, item) => total + (item.pizza.price * item.quantity), 0)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  const handleApplyQuantity = (newQty: number) => {
    if (newQty === 0) {
      removeFromCart(selectedPizza.id)
    } else {
      if (cartItem) {
        updateQuantity(selectedPizza.id, newQty)
      } else {
        addToCart(selectedPizza, newQty)
      }
    }
  }

  const handleContinue = () => {
    // If cart is empty, add current pizza quantity 1? 
    // Or require user to add first?
    // Let's assume if they click continue and cart is empty, they want 1 of current pizza.
    if (cart.length === 0) {
      addToCart(selectedPizza, 1)
    }
    nextStep()
  }

  // Group toppings by category
  const toppingsByCategory = selectedPizza.pizza_toppings
    .filter(t => t.is_customer_visible !== false)
    .reduce((acc, topping) => {
      if (!acc[topping.category]) acc[topping.category] = []
      acc[topping.category].push(topping)
      return acc
    }, {} as Record<string, typeof selectedPizza.pizza_toppings>)

  const categoryOrder = ['base', 'cheese', 'topping', 'finish']
  const categoryLabels: Record<string, string> = {
    base: 'Foundation',
    cheese: 'Structure',
    topping: 'Elements',
    finish: 'Finishing',
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-12 text-center">
        <span className="section-label">Today's Architecture</span>

        {/* Carousel with arrows and swipe */}
        <div className="relative mt-6">
          {/* Left Arrow */}
          {hasMultiplePizzas && (
            <button
              onClick={goToPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 
                w-10 h-10 md:w-12 md:h-12 
                flex items-center justify-center
                border border-white/10 bg-white/[0.02]
                rounded-sm
                transition-all duration-300 ease-expo-out
                hover:border-matcha/50 hover:bg-matcha/5 hover:text-matcha
                active:scale-95
                group"
              aria-label="Previous pizza"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:-translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {hasMultiplePizzas && (
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 
                w-10 h-10 md:w-12 md:h-12 
                flex items-center justify-center
                border border-white/10 bg-white/[0.02]
                rounded-sm
                transition-all duration-300 ease-expo-out
                hover:border-matcha/50 hover:bg-matcha/5 hover:text-matcha
                active:scale-95
                group"
              aria-label="Next pizza"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Swipeable content area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPizza.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              drag={hasMultiplePizzas ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x > swipeThreshold) {
                  goToPrev()
                } else if (info.offset.x < -swipeThreshold) {
                  goToNext()
                }
              }}
              className={`${hasMultiplePizzas ? 'px-14 md:px-16 cursor-grab active:cursor-grabbing' : ''}`}
            >
              {selectedPizza.image_url && (
                <div className="mb-6 aspect-[16/9] w-full max-w-2xl mx-auto rounded-sm overflow-hidden border border-white/10 glass-card">
                  <img src={selectedPizza.image_url} alt={selectedPizza.name} className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-light tracking-tight select-none">
                {selectedPizza.name}
              </h1>
              <p className="mt-4 text-grey-dark max-w-xl mx-auto select-none">
                {selectedPizza.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Pagination dots */}
          {hasMultiplePizzas && (
            <div className="flex justify-center gap-2 mt-6">
              {pizzas.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === selectedIndex
                    ? 'bg-matcha w-6'
                    : 'bg-white/20 hover:bg-white/40'
                    }`}
                  aria-label={`Go to pizza ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPizza.id}
          className="grid lg:grid-cols-2 gap-8 lg:gap-12"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Left: Technical Specs */}
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6 md:p-8 relative">
              {/* Corner accents */}
              <div className="corner-accent corner-accent-tl" />
              <div className="corner-accent corner-accent-tr" />
              <div className="corner-accent corner-accent-bl" />
              <div className="corner-accent corner-accent-br" />

              <h2 className="font-mono text-xs uppercase tracking-wider text-grey-dark mb-6">
                Technical Specifications
              </h2>

              <div className="space-y-0">
                <div className="spec-row">
                  <span className="spec-key">Format</span>
                  <span className="spec-value">10" × 14" Detroit Style</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Hydration</span>
                  <span className="spec-value">{selectedPizza.hydration}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Fermentation</span>
                  <span className="spec-value">{selectedPizza.fermentation_time}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Crust Type</span>
                  <span className="spec-value text-matcha">{selectedPizza.crust_type}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Price</span>
                  <span className="spec-value">${selectedPizza.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Material List */}
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6 md:p-8 relative">
              {/* Corner accents */}
              <div className="corner-accent corner-accent-tl" />
              <div className="corner-accent corner-accent-tr" />
              <div className="corner-accent corner-accent-bl" />
              <div className="corner-accent corner-accent-br" />

              <h2 className="font-mono text-xs uppercase tracking-wider text-grey-dark mb-6">
                Material List
              </h2>

              <div className="space-y-6">
                {categoryOrder.map((category) => {
                  const toppings = toppingsByCategory[category]
                  if (!toppings) return null

                  return (
                    <div key={category}>
                      <h3 className="font-mono text-[10px] uppercase tracking-wider text-matcha/60 mb-2">
                        {categoryLabels[category]}
                      </h3>
                      <ul className="space-y-1">
                        {toppings.map((topping) => (
                          <li key={topping.id} className="flex items-center gap-2">
                            <span className={`
                            w-1 h-1 rounded-full
                            ${topping.is_highlighted ? 'bg-matcha' : 'bg-white/30'}
                          `} />
                            <span className={`
                            font-mono text-sm
                            ${topping.is_highlighted ? 'text-white' : 'text-white/70'}
                          `}>
                              {topping.name}
                            </span>
                            {topping.is_highlighted && (
                              <span className="font-mono text-[8px] uppercase tracking-wider text-matcha px-1.5 py-0.5 border border-matcha/30">
                                Featured
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Batch Progress */}
      <motion.div variants={itemVariants} className="mt-8">
        <div className="glass-card p-6 md:p-8">
          <BatchProgress current={selectedPizza.current_batch} max={selectedPizza.max_batch} />
        </div>
      </motion.div>

      {/* Action Area */}
      <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center gap-6">

        {/* Quantity Controls for Selected Pizza */}
        <div className="flex items-center gap-4 p-2 bg-white/5 rounded-full border border-white/10">
          <button
            onClick={() => handleApplyQuantity(currentQuantity - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            disabled={currentQuantity === 0}
          >
            -
          </button>
          <span className="font-mono text-lg w-4 text-center">{currentQuantity}</span>
          <button
            onClick={() => handleApplyQuantity(currentQuantity + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            disabled={currentQuantity >= 4}
          >
            +
          </button>
        </div>

        <Button onClick={handleContinue} size="lg" className="min-w-[300px]">
          {cartCount > 0
            ? `Choose Pickup Time — $${cartTotal.toFixed(2)}`
            : `Add to Order — $${selectedPizza.price.toFixed(2)}`}
        </Button>

        <p className="font-mono text-[10px] text-grey-dark uppercase tracking-wider">
          Pickup only • Chicago, IL
        </p>
      </motion.div>
    </motion.div>
  )
}
