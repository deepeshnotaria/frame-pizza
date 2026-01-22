'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

export interface SelectOption {
    value: string | number
    label: string
    group?: string
}

interface SelectProps {
    value?: string | number
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
    label?: string
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '', disabled, label }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    // Find selected label or default to placeholder
    const selectedOption = options.find(opt => String(opt.value) === String(value))

    // Group options
    const groupedOptions = options.reduce((acc, option) => {
        const group = option.group || 'default'
        if (!acc[group]) acc[group] = []
        acc[group].push(option)
        return acc
    }, {} as Record<string, SelectOption[]>)

    const hasGroups = Object.keys(groupedOptions).length > 1 || (Object.keys(groupedOptions).length === 1 && Object.keys(groupedOptions)[0] !== 'default')

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                // Also check if the click target is within the portal dropdown
                !(event.target as Element).closest('.select-dropdown-portal')
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Update position logic
    const updatePosition = () => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
            })
        }
    }

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition()
            window.addEventListener('resize', updatePosition)
            window.addEventListener('scroll', updatePosition, true)
        }
        return () => {
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
        }
    }, [isOpen])

    const handleSelect = (newValue: string) => {
        onChange(newValue)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="text-xs text-grey uppercase block mb-1">{label}</label>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center justify-between
          px-3 py-2 text-xs font-mono uppercase tracking-wide
          bg-black/50 border rounded-sm
          transition-all duration-200
          focus:outline-none 
          ${isOpen ? 'border-matcha' : 'border-white/10 hover:border-white/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <span className={selectedOption ? 'text-white' : 'text-grey'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className={`ml-2 text-[10px] transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-matcha' : 'text-grey'}`}>
                    ▼
                </span>
            </button>

            {/* Portal Dropdown */}
            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            top: dropdownPosition.top + 4,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                        }}
                        className="fixed z-[9999] select-dropdown-portal bg-black/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {hasGroups ? (
                            Object.entries(groupedOptions).map(([group, groupOptions]) => (
                                <div key={group}>
                                    {group !== 'default' && (
                                        <div className="px-3 py-2 text-[10px] text-grey-dark font-mono bg-white/5 uppercase sticky top-0 z-10 backdrop-blur-sm">
                                            {group}
                                        </div>
                                    )}
                                    {groupOptions.map((option) => (
                                        <OptionItem
                                            key={option.value}
                                            option={option}
                                            isSelected={String(option.value) === String(value)}
                                            onClick={() => handleSelect(String(option.value))}
                                        />
                                    ))}
                                </div>
                            ))
                        ) : (
                            options.map((option) => (
                                <OptionItem
                                    key={option.value}
                                    option={option}
                                    isSelected={String(option.value) === String(value)}
                                    onClick={() => handleSelect(String(option.value))}
                                />
                            ))
                        )}

                        {options.length === 0 && (
                            <div className="px-4 py-3 text-center text-grey-dark text-xs font-mono">
                                No options
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}

function OptionItem({ option, isSelected, onClick }: { option: SelectOption, isSelected: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
        w-full text-left px-4 py-2 text-xs font-mono uppercase
        transition-colors duration-150
        hover:bg-white/10
        ${isSelected ? 'text-matcha bg-matcha/5 text-shadow-glow' : 'text-grey hover:text-white'}
      `}
        >
            {option.label}
        </button>
    )
}
