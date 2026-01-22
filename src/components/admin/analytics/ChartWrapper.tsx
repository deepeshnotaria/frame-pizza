'use client'

import React, { useState, useEffect, useRef, ReactElement } from 'react'

interface ChartWrapperProps {
    children: (dimensions: { width: number; height: number }) => ReactElement
    className?: string
    fallback?: React.ReactNode
}

/**
 * A wrapper that measures its container dimensions and passes them to children.
 * This bypasses ResponsiveContainer's measurement issues by providing explicit pixel values.
 */
export const ChartWrapper: React.FC<ChartWrapperProps> = ({
    children,
    className = '',
    fallback = <div className="h-full w-full animate-pulse bg-white/5 rounded" />
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect()
                if (width > 0 && height > 0) {
                    setDimensions({ width, height })
                }
            }
        }

        // Initial measurement after a small delay to ensure layout is complete
        const timeoutId = setTimeout(updateDimensions, 50)

        // Also listen for resize
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (width > 0 && height > 0) {
                    setDimensions({ width, height })
                }
            }
        })

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            clearTimeout(timeoutId)
            resizeObserver.disconnect()
        }
    }, [])

    return (
        <div ref={containerRef} className={`w-full h-full ${className}`}>
            {dimensions ? children(dimensions) : fallback}
        </div>
    )
}
