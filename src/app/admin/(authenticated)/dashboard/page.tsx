'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import type { Order, DailyPizza } from '@/types/database'

// Extended Order type to include Pizza details if needed, 
// though KDS usually just needs name/toppings.
// We'll fetch daily_pizza to get the name.
interface KDSOrder extends Order {
    daily_pizza?: DailyPizza
    elapsed_minutes?: number
}

export default function KDSDashboard() {
    const [orders, setOrders] = useState<KDSOrder[]>([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        if (!supabase) return
        const { data, error } = await supabase
            .from('orders')
            .select('*, daily_pizzas(*)')
            .in('status', ['confirmed', 'ready']) // only show active kitchen orders
            .order('created_at', { ascending: true }) // Oldest first

        if (error) {
            console.error('Error fetching orders:', error)
        } else {
            setOrders(data as KDSOrder[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()

        // Realtime subscription
        if (!supabase) return
        const channel = supabase
            .channel('kds-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    // Simplest approach: just refetch for now to handle joins
                    fetchOrders()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Timer for elapsed time
    useEffect(() => {
        const timer = setInterval(() => {
            setOrders(prev => prev.map(o => ({
                ...o,
                elapsed_minutes: Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000)
            })))
        }, 1000 * 60) // Update every minute
        return () => clearInterval(timer)
    }, [])


    const updateStatus = async (orderId: string, newStatus: Order['status']) => {
        if (!supabase) return

        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))

        await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

        if (newStatus === 'completed') {
            // Remove from KDS
            setOrders(prev => prev.filter(o => o.id !== orderId))
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-light text-white">Kitchen Display System</h1>
                <div className="flex gap-4 text-xs font-mono text-grey-dark">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        ACTIVE
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        DELAYED (&gt;15m)
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        CRITICAL (&gt;25m)
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="font-mono text-matcha text-center animate-pulse">CONNECTING TO KDS FEED...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 border border-white/10 border-dashed rounded-lg">
                    <p className="text-grey-dark font-mono">NO ACTIVE ORDERS</p>
                    <p className="text-xs text-grey-darker mt-2">Waiting for new incoming tickets...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {orders.map((order) => {
                            const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
                            let statusColor = "border-matcha/30 bg-matcha/5"
                            if (elapsed > 15) statusColor = "border-yellow-500/30 bg-yellow-500/5"
                            if (elapsed > 25) statusColor = "border-red-500/30 bg-red-500/5 animate-pulse" // Critical

                            return (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`p-4 border ${statusColor} relative flex flex-col justify-between min-h-[280px]`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/10">
                                            <div>
                                                <span className="font-mono text-2xl font-bold block">#{order.batch_id.slice(-4)}</span>
                                                <span className="text-xs text-grey-dark font-mono">{order.customer_name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono text-xl block">{elapsed}m</span>
                                                <span className="text-[10px] text-grey-dark uppercase tracking-wider">{order.status}</span>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="font-medium text-lg leading-tight mb-2">
                                                {order.quantity}x {order.daily_pizza?.name || 'Pizza'}
                                            </h3>
                                            <ul className="text-sm text-grey space-y-1">
                                                <li className="text-xs text-grey-dark italic">+ All Standard Toppings</li>
                                                {/* In a real app, we'd list specific modifications here */}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                                        {order.status === 'confirmed' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'ready')}
                                                className="col-span-2 bg-matcha/20 hover:bg-matcha/30 text-matcha border border-matcha/50 py-3 text-sm font-mono uppercase tracking-wider transition-colors"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => updateStatus(order.id, 'completed')}
                                                className="col-span-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 text-sm font-mono uppercase tracking-wider transition-colors"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
