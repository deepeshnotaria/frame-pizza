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
      when: "beforeChildren", // Ensure grid animates before children
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
  const { selectPizza, nextStep } = useOrderStore()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedPizza = pizzas[selectedIndex]

  const handleContinue = () => {
    selectPizza(selectedPizza)
    nextStep()
  }

  // Group toppings by category
  const toppingsByCategory = selectedPizza.pizza_toppings.reduce((acc, topping) => {
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

        {/* PIZZA SECTOR */}
        {pizzas.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 mt-4">
            {pizzas.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedIndex(i)}
                className={`px-4 py-2 border rounded-sm font-mono text-xs uppercase tracking-wider transition-all ${i === selectedIndex
                  ? 'border-matcha text-matcha bg-matcha/10'
                  : 'border-white/10 text-grey hover:border-white/30'
                  }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPizza.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="mt-4 text-4xl md:text-5xl font-light tracking-tight">{selectedPizza.name}</h1>
            <p className="mt-4 text-grey-dark max-w-xl mx-auto">{selectedPizza.description}</p>
          </motion.div>
        </AnimatePresence>
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

      {/* Action */}
      <motion.div variants={itemVariants} className="mt-8 text-center">
        <Button onClick={handleContinue} size="lg">
          Reserve Unit — ${selectedPizza.price.toFixed(2)}
        </Button>
        <p className="mt-4 font-mono text-[10px] text-grey-dark uppercase tracking-wider">
          Pickup only • Chicago, IL
        </p>
      </motion.div>
    </motion.div>
  )
}
