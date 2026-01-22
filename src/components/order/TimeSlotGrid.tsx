'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import type { TimeSlot } from '@/types/database'
import { useOrderStore } from '@/store/orderStore'

interface TimeSlotGridProps {
  timeSlots: TimeSlot[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

function getSlotStatus(slot: TimeSlot): 'available' | 'limited' | 'depleted' {
  const remaining = slot.max_orders - slot.current_orders
  if (remaining === 0) return 'depleted'
  if (remaining <= 2) return 'limited'
  return 'available'
}

export function TimeSlotGrid({ timeSlots }: TimeSlotGridProps) {
  const { selectedTimeSlot, selectTimeSlot, nextStep, prevStep } = useOrderStore()

  console.log('TimeSlotGrid received slots:', timeSlots)

  // Group slots by period (Lunch/Dinner)
  const lunchSlots = timeSlots.filter(s => parseInt(s.start_time.split(':')[0], 10) < 15)
  const dinnerSlots = timeSlots.filter(s => parseInt(s.start_time.split(':')[0], 10) >= 15)

  console.log('Lunch slots:', lunchSlots.length, 'Dinner slots:', dinnerSlots.length)

  const handleContinue = () => {
    if (selectedTimeSlot) {
      nextStep()
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
        <span className="section-label">Logistics</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-light tracking-tight">Schedule Pickup</h1>
        <p className="mt-4 text-grey-dark">Select your preferred collection window</p>
      </motion.div>

      {/* Time Periods */}
      <div className="space-y-8">
        {/* Lunch */}
        {lunchSlots.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="font-mono text-xs uppercase tracking-wider text-grey-dark">
                Lunch Service
              </h2>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {lunchSlots.map((slot) => (
                <TimeSlotButton
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedTimeSlot?.id === slot.id}
                  onSelect={() => selectTimeSlot(slot)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Dinner */}
        {dinnerSlots.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="font-mono text-xs uppercase tracking-wider text-grey-dark">
                Dinner Service
              </h2>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {dinnerSlots.map((slot) => (
                <TimeSlotButton
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedTimeSlot?.id === slot.id}
                  onSelect={() => selectTimeSlot(slot)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-white/20" />
          <span className="font-mono text-[10px] text-grey-dark uppercase">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-yellow-500/50 bg-yellow-500/10" />
          <span className="font-mono text-[10px] text-grey-dark uppercase">Limited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-white/10 bg-white/5 opacity-30" />
          <span className="font-mono text-[10px] text-grey-dark uppercase">Depleted</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div variants={itemVariants} className="mt-12 flex justify-center gap-4">
        <Button variant="secondary" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedTimeSlot}>
          Continue to Manifest
        </Button>
      </motion.div>
    </motion.div>
  )
}

interface TimeSlotButtonProps {
  slot: TimeSlot
  isSelected: boolean
  onSelect: () => void
}

function TimeSlotButton({ slot, isSelected, onSelect }: TimeSlotButtonProps) {
  const status = getSlotStatus(slot)
  const remaining = slot.max_orders - slot.current_orders
  const isDepleted = status === 'depleted'

  return (
    <motion.button
      onClick={onSelect}
      disabled={isDepleted}
      className={`
        relative p-4 text-center transition-all duration-200
        ${isDepleted
          ? 'opacity-30 cursor-not-allowed border border-white/10 bg-white/[0.02]'
          : isSelected
            ? 'border-2 border-matcha bg-matcha/10'
            : status === 'limited'
              ? 'border border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50'
              : 'border border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
        }
      `}
      whileHover={!isDepleted ? { scale: 1.02 } : {}}
      whileTap={!isDepleted ? { scale: 0.98 } : {}}
      variants={itemVariants}
    >
      {isSelected && (
        <motion.div
          className="absolute top-1 right-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <svg className="w-3 h-3 text-matcha" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      )}

      <div className={`font-mono text-sm ${isSelected ? 'text-matcha' : 'text-white'}`}>
        {formatTime(slot.start_time)}
      </div>

      <div className={`
        mt-1 font-mono text-[10px] uppercase tracking-wider
        ${isDepleted
          ? 'text-grey-dark'
          : status === 'limited'
            ? 'text-yellow-500'
            : 'text-grey-dark'
        }
      `}>
        {isDepleted ? 'Depleted' : `${remaining} slots`}
      </div>
    </motion.button>
  )
}
