'use client'

import { motion } from 'framer-motion'

interface BatchProgressProps {
  current: number
  max: number
}

export function BatchProgress({ current, max }: BatchProgressProps) {
  const remaining = max - current
  const percentage = (current / max) * 100

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-xs uppercase tracking-wider text-grey-dark">
          Batch Progress
        </span>
        <span className="font-mono text-sm">
          <span className="text-matcha">{remaining}</span>
          <span className="text-grey-dark">/{max} units remaining</span>
        </span>
      </div>

      <div className="relative">
        {/* Track */}
        <div className="h-2 bg-white/5 rounded-none">
          {/* Grid lines */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-white/5 last:border-r-0"
              />
            ))}
          </div>

          {/* Fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-matcha/80"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Tick marks */}
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-grey-dark">0</span>
          <span className="font-mono text-[10px] text-grey-dark">{max}</span>
        </div>
      </div>

      {remaining <= 10 && (
        <motion.p
          className="font-mono text-xs text-matcha"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Limited availability — only {remaining} units remain in today's build
        </motion.p>
      )}
    </div>
  )
}
