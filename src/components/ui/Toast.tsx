'use client'

import { create } from 'zustand'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastAction {
    label: string
    onClick: () => void
}

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
    action?: ToastAction
}

interface ToastStore {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9)
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))

        // Only auto-dismiss if no action is required, or if explicitly requested ?
        // Usually if action is present, we might want longer duration.
        // But forcing user to dismiss is annoying.
        // Let's stick to duration.
        if (toast.duration !== Infinity) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id)
                }))
            }, toast.duration || (toast.action ? 6000 : 3000))
        }
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
    success: (message: string, duration?: number) => useToastStore.getState().addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) => useToastStore.getState().addToast({ type: 'error', message, duration }),
    info: (message: string, options?: { duration?: number, action?: ToastAction }) => useToastStore.getState().addToast({ type: 'info', message, duration: options?.duration, action: options?.action }),
}

export function ToastProvider() {
    const { toasts, removeToast } = useToastStore()

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none pr-4 sm:pr-0">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        layout
                        className="pointer-events-auto flex items-center gap-3 p-4 rounded-sm border border-white/10 bg-black/80 backdrop-blur-md shadow-2xl"
                    >
                        <div className={`shrink-0 ${toast.type === 'success' ? 'text-matcha' :
                                toast.type === 'error' ? 'text-red-500' :
                                    'text-blue-400'
                            }`}>
                            {toast.type === 'success' && <Check size={16} />}
                            {toast.type === 'error' && <AlertCircle size={16} />}
                            {toast.type === 'info' && <Info size={16} />}
                        </div>
                        <p className="text-sm font-light text-white leading-tight flex-1">{toast.message}</p>

                        {toast.action && (
                            <button
                                onClick={() => {
                                    toast.action?.onClick()
                                    removeToast(toast.id)
                                }}
                                className="shrink-0 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-sm transition-colors uppercase font-mono tracking-wide"
                            >
                                {toast.action.label}
                            </button>
                        )}

                        {!toast.action && (
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto text-grey hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}

                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
