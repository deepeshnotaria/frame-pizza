'use client'

import { motion } from 'framer-motion'
import { forwardRef, InputHTMLAttributes, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <div className="relative">
        <label className="block mb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-grey-dark">
            {label}
          </span>
        </label>

        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full bg-transparent border-b py-3 px-0
              font-mono text-sm text-white placeholder:text-grey-dark/50
              focus:outline-none transition-colors duration-300
              ${error ? 'border-red-500' : isFocused ? 'border-matcha' : 'border-white/20'}
              ${className}
            `}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Focus indicator line */}
          <motion.div
            className="absolute bottom-0 left-0 h-px bg-matcha"
            initial={{ width: '0%' }}
            animate={{ width: isFocused ? '100%' : '0%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {error && (
          <motion.p
            className="mt-2 font-mono text-[10px] text-red-500"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
