'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useOrderStore } from '@/store/orderStore'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { DailyBlueprint } from './DailyBlueprint'
import { TimeSlotGrid } from './TimeSlotGrid'
import { CheckoutManifest } from './CheckoutManifest'
import { OrderCertificate } from './OrderCertificate'
import type { DailyPizzaWithToppings, TimeSlot } from '@/types/database'

interface OrderFlowProps {
  pizzas: DailyPizzaWithToppings[]
  timeSlots: TimeSlot[]
}

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
}

export function OrderFlow({ pizzas, timeSlots, embedded = false }: OrderFlowProps & { embedded?: boolean }) {
  const { currentStep } = useOrderStore()

  // Track step direction for animation
  const stepOrder = ['menu', 'schedule', 'checkout', 'confirmation']
  const currentIndex = stepOrder.indexOf(currentStep)

  const renderStep = () => {
    switch (currentStep) {
      case 'menu':
        return <DailyBlueprint pizzas={pizzas} />
      case 'schedule':
        return <TimeSlotGrid timeSlots={timeSlots} />
      case 'checkout':
        return <CheckoutManifest />
      case 'confirmation':
        return <OrderCertificate />
      default:
        return null
    }
  }

  return (
    <div className={`py-8 px-4 sm:px-6 lg:px-8 ${embedded ? '' : 'min-h-screen'}`}>
      {/* Header with logo - hide if embedded */}
      {!embedded && (
        <header className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <a href="/" className="font-mono text-xl tracking-wider text-white hover:text-matcha transition-colors">
              FRAME
            </a>
            {currentStep !== 'confirmation' && (
              <span className="font-mono text-xs text-grey-dark uppercase tracking-wider">
                Chicago, IL
              </span>
            )}
          </div>
        </header>
      )}

      {/* Step indicator - hidden on confirmation */}
      {currentStep !== 'confirmation' && (
        <div className="max-w-4xl mx-auto mb-8">
          <StepIndicator currentStep={currentStep} />
        </div>
      )}

      {/* Main content with animation */}
      <main className="relative">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer - hide if embedded */}
      {!embedded && (
        <footer className="max-w-4xl mx-auto mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-mono text-[10px] text-grey-dark uppercase tracking-wider">
              The Architecture of Pizza
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="font-mono text-[10px] text-grey-dark uppercase tracking-wider hover:text-white transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="font-mono text-[10px] text-grey-dark uppercase tracking-wider hover:text-white transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="font-mono text-[10px] text-grey-dark uppercase tracking-wider hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
