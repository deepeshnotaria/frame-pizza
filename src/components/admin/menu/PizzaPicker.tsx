'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import type { DailyPizza, PizzaTopping, DailyPizzaWithToppings, PizzaToppingWithInventory } from '@/types/database'

interface SalesData {
    total_orders: number
    units_sold: number
    revenue: number
}

interface PizzaWithSalesAndToppings extends DailyPizza {
    pizza_toppings: PizzaToppingWithInventory[]
    sales?: SalesData
}

interface PizzaPickerProps {
    isOpen: boolean
    onClose: () => void
    onSelectPizza: (pizza: DailyPizzaWithToppings) => void
    excludeDate?: string
}

export function PizzaPicker({ isOpen, onClose, onSelectPizza, excludeDate }: PizzaPickerProps) {
    const [pizzas, setPizzas] = useState<PizzaWithSalesAndToppings[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState<'all' | 'past' | 'upcoming'>('all')

    useEffect(() => {
        if (isOpen) {
            fetchPizzas()
        }
    }, [isOpen])

    async function fetchPizzas() {
        if (!supabase) return
        setLoading(true)

        // Fetch all pizzas with toppings
        const { data, error } = await supabase
            .from('daily_pizzas')
            .select(`
                *,
                pizza_toppings (
                    *,
                    topping_recipe_links (
                        recipe_id,
                        quantity_per_pizza
                    )
                )
            `)
            .order('date', { ascending: false })
            .limit(100)

        if (data) {
            // Get sales data
            const pizzaIds = data.map(p => p.id)
            const { data: ordersData } = await supabase
                .from('orders')
                .select('daily_pizza_id, quantity')
                .in('daily_pizza_id', pizzaIds)
                .neq('status', 'cancelled')

            const salesMap = new Map<string, SalesData>()
            if (ordersData) {
                ordersData.forEach((order: any) => {
                    const existing = salesMap.get(order.daily_pizza_id) || {
                        total_orders: 0,
                        units_sold: 0,
                        revenue: 0
                    }
                    existing.total_orders += 1
                    existing.units_sold += order.quantity
                    salesMap.set(order.daily_pizza_id, existing)
                })
            }

            // Merge sales data with pizza prices
            const pizzasWithSales = data.map((pizza: any) => {
                const sales = salesMap.get(pizza.id)
                if (sales) {
                    sales.revenue = sales.units_sold * Number(pizza.price)
                }
                return {
                    ...pizza,
                    sales
                }
            })

            setPizzas(pizzasWithSales)
        }
        setLoading(false)
    }

    const getLocalDateString = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const today = getLocalDateString(new Date())

    const filteredPizzas = useMemo(() => {
        let result = pizzas

        // Exclude current date
        if (excludeDate) {
            result = result.filter(p => p.date !== excludeDate)
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            )
        }

        // Date filter
        if (dateFilter === 'past') {
            result = result.filter(p => p.date < today)
        } else if (dateFilter === 'upcoming') {
            result = result.filter(p => p.date >= today)
        }

        return result
    }, [pizzas, searchQuery, dateFilter, excludeDate, today])

    const handleSelect = (pizza: PizzaWithSalesAndToppings) => {
        // Strip sales data and create clone
        const { sales, ...pizzaData } = pizza
        onSelectPizza(pizzaData as DailyPizzaWithToppings)
        onClose()
    }

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="glass-card w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-light">Select Pizza</h2>
                                <p className="text-xs text-grey-dark mt-1">Choose from past or upcoming menus</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-grey hover:text-white transition-colors text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Search pizzas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-sm px-4 py-2 text-sm focus:border-matcha focus:outline-none"
                            />
                            <div className="flex gap-2 bg-white/5 p-1 rounded-sm">
                                {(['all', 'past', 'upcoming'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setDateFilter(filter)}
                                        className={`px-3 py-1.5 text-xs font-mono uppercase transition-all rounded-sm ${dateFilter === filter
                                            ? 'bg-matcha text-black'
                                            : 'text-grey hover:text-white'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pizza List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-matcha font-mono text-xs uppercase">Loading...</div>
                            </div>
                        ) : filteredPizzas.length === 0 ? (
                            <div className="text-center py-12 text-grey-dark font-mono text-sm">
                                No pizzas found
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredPizzas.map((pizza) => {
                                    const isPast = pizza.date < today
                                    return (
                                        <div
                                            key={pizza.id}
                                            className="glass-card p-4 hover:border-matcha/50 transition-all cursor-pointer group"
                                            onClick={() => handleSelect(pizza)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium">{pizza.name}</h3>
                                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${isPast
                                                            ? 'bg-white/10 text-grey'
                                                            : 'bg-matcha/20 text-matcha'
                                                            }`}>
                                                            {formatDate(pizza.date)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-grey line-clamp-2">{pizza.description}</p>

                                                    <div className="flex flex-wrap gap-3 mt-2">
                                                        <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                            ${pizza.price}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                            Max: {pizza.max_batch}
                                                        </span>
                                                        {pizza.pizza_toppings && (
                                                            <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                                {pizza.pizza_toppings.length} ingredients
                                                            </span>
                                                        )}
                                                        {pizza.sales && pizza.sales.units_sold > 0 && (
                                                            <span className="text-[10px] font-mono text-matcha uppercase">
                                                                {pizza.sales.units_sold} sold • ${pizza.sales.revenue.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSelect(pizza)
                                                    }}
                                                >
                                                    Clone
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
