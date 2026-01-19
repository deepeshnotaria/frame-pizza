'use client'

import { motion } from 'framer-motion'
import type { OrderStep } from '@/store/orderStore'

interface StepIndicatorProps {
  currentStep: OrderStep
}

const steps: { key: OrderStep; label: string; code: string }[] = [
  { key: 'menu', label: 'Blueprint', code: '01' },
  { key: 'schedule', label: 'Logistics', code: '02' },
  { key: 'checkout', label: 'Manifest', code: '03' },
  { key: 'confirmation', label: 'Certificate', code: '04' },
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isCompleted = index < currentIndex

        return (
          <div key={step.key} className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <motion.div
                className={`
                  relative w-8 h-8 flex items-center justify-center
                  font-mono text-xs border
                  ${isActive ? 'border-matcha text-matcha' : isCompleted ? 'border-matcha/50 text-matcha/50' : 'border-white/20 text-white/30'}
                `}
                animate={{
                  scale: isActive ? 1 : 0.9,
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.code
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 border border-matcha"
                    initial={{ opacity: 0, scale: 1.2 }}
                    animate={{ opacity: [0, 0.5, 0], scale: [1, 1.3, 1.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span className={`
                hidden sm:block font-mono text-xs uppercase tracking-wider
                ${isActive ? 'text-white' : isCompleted ? 'text-white/50' : 'text-white/30'}
              `}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-8 lg:w-16 h-px
                ${index < currentIndex ? 'bg-matcha/50' : 'bg-white/10'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}
