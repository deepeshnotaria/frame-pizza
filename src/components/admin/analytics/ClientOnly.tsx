'use client'

import React, { useState, useEffect } from 'react'

interface ClientOnlyProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * A wrapper component that only renders its children on the client side,
 * after the component has mounted AND the browser has completed layout.
 * Uses double requestAnimationFrame to ensure paint cycle is complete.
 */
export const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        // Double rAF ensures the browser has completed layout and paint
        const frame1 = requestAnimationFrame(() => {
            const frame2 = requestAnimationFrame(() => {
                setIsReady(true)
            })
            return () => cancelAnimationFrame(frame2)
        })
        return () => cancelAnimationFrame(frame1)
    }, [])

    if (!isReady) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

