'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyPizza, DailyPizzaWithSales } from '@/types/database'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Select } from '@/components/ui/Select'

type ViewMode = 'upcoming' | 'past'

interface SalesData {
    daily_pizza_id: string
    total_orders: number
    units_sold: number
    revenue: number
}

export default function MenuManager() {
    const [schedule, setSchedule] = useState<Map<string, DailyPizzaWithSales[]>>(new Map())
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<ViewMode>('upcoming')

    // Date range for past menus
    const [pastDaysStart, setPastDaysStart] = useState(30) // Show last 30 days by default
    const [pastDaysEnd, setPastDaysEnd] = useState(1) // End at yesterday

    // Helper for local date string YYYY-MM-DD
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Generate dates based on view mode
    const dates = useMemo(() => {
        if (viewMode === 'upcoming') {
            return Array.from({ length: 14 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() + i)
                return getLocalDateString(d)
            })
        } else {
            // Past dates: from pastDaysStart ago to pastDaysEnd ago
            const numDays = pastDaysStart - pastDaysEnd + 1
            return Array.from({ length: numDays }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - pastDaysStart + i)
                return getLocalDateString(d)
            }).reverse() // Most recent first
        }
    }, [viewMode, pastDaysStart, pastDaysEnd])

    useEffect(() => {
        async function fetchMenu() {
            if (!supabase) return
            setLoading(true)
            const today = getLocalDateString(new Date())

            let query = supabase.from('daily_pizzas').select('*')

            if (viewMode === 'upcoming') {
                query = query.gte('date', today).order('date', { ascending: true })
            } else {
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - pastDaysStart)
                const endDate = new Date()
                endDate.setDate(endDate.getDate() - pastDaysEnd)

                query = query
                    .gte('date', getLocalDateString(startDate))
                    .lte('date', getLocalDateString(endDate))
                    .order('date', { ascending: false })
            }

            const { data, error } = await query

            if (data) {
                const pizzaIds = data.map(p => p.id)
                let salesMap = new Map<string, SalesData>()

                // Fetch sales data for past menus
                if (viewMode === 'past' && pizzaIds.length > 0) {
                    const { data: ordersData } = await supabase
                        .from('orders')
                        .select('daily_pizza_id, quantity, status')
                        .in('daily_pizza_id', pizzaIds)
                        .neq('status', 'cancelled')

                    if (ordersData) {
                        ordersData.forEach((order: any) => {
                            const existing = salesMap.get(order.daily_pizza_id) || {
                                daily_pizza_id: order.daily_pizza_id,
                                total_orders: 0,
                                units_sold: 0,
                                revenue: 0
                            }
                            existing.total_orders += 1
                            existing.units_sold += order.quantity
                            salesMap.set(order.daily_pizza_id, existing)
                        })

                        // Calculate revenue based on pizza price
                        const pizzaPrices = new Map(data.map(p => [p.id, p.price]))
                        salesMap.forEach((sales, pizzaId) => {
                            const price = pizzaPrices.get(pizzaId) || 0
                            sales.revenue = sales.units_sold * Number(price)
                        })
                    }
                }

                const map = new Map<string, DailyPizzaWithSales[]>()
                data.forEach((p: DailyPizza) => {
                    const sales = salesMap.get(p.id)
                    const pizzaWithSales: DailyPizzaWithSales = {
                        ...p,
                        total_orders: sales?.total_orders || 0,
                        units_sold: sales?.units_sold || 0,
                        revenue: sales?.revenue || 0
                    }
                    const existing = map.get(p.date) || []
                    map.set(p.date, [...existing, pizzaWithSales])
                })
                setSchedule(map)
            }
            setLoading(false)
        }
        fetchMenu()
    }, [viewMode, pastDaysStart, pastDaysEnd])

    const today = getLocalDateString(new Date())

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-grey-dark">
                        {viewMode === 'upcoming' ? 'Planning' : 'History'}
                    </span>
                    <h1 className="text-2xl font-light text-white mt-2">Menu Schedule</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary">
                        + New Template
                    </Button>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div className="flex gap-2 bg-white/5 p-1 rounded-sm">
                    <button
                        onClick={() => setViewMode('upcoming')}
                        className={`px-4 py-2 text-xs font-mono uppercase transition-all rounded-sm ${viewMode === 'upcoming'
                            ? 'bg-matcha text-black'
                            : 'text-grey hover:text-white'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setViewMode('past')}
                        className={`px-4 py-2 text-xs font-mono uppercase transition-all rounded-sm ${viewMode === 'past'
                            ? 'bg-matcha text-black'
                            : 'text-grey hover:text-white'
                            }`}
                    >
                        Past Menus
                    </button>
                </div>

                {/* Date Range Picker for Past Menus */}
                {viewMode === 'past' && (
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-grey-dark font-mono uppercase">Range:</span>
                        <div className="w-48">
                            <Select
                                value={pastDaysStart}
                                onChange={(val) => setPastDaysStart(Number(val))}
                                options={[
                                    { value: 7, label: 'Last 7 days' },
                                    { value: 14, label: 'Last 14 days' },
                                    { value: 30, label: 'Last 30 days' },
                                    { value: 60, label: 'Last 60 days' },
                                    { value: 90, label: 'Last 90 days' },
                                ]}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-matcha font-mono text-xs uppercase">Loading Menu...</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {dates.map((date) => {
                        const pizzas = schedule.get(date) || []
                        const [y, m, d] = date.split('-').map(Number)
                        const dateObj = new Date(y, m - 1, d)

                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                        const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        const isToday = date === today
                        const isPast = viewMode === 'past'

                        return (
                            <div
                                key={date}
                                className={`glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 group transition-all hover:border-white/20 ${isToday ? 'border-matcha/50 bg-matcha/5' : ''
                                    } ${isPast ? 'opacity-90' : ''}`}
                            >
                                {/* Date Column */}
                                <div className="w-full sm:w-24 flex sm:block justify-between items-center shrink-0 border-b sm:border-b-0 border-white/10 pb-2 sm:pb-0">
                                    <div>
                                        <span className="block text-[10px] uppercase tracking-wider text-grey-dark mb-1">
                                            {dayName}
                                        </span>
                                        <span className={`font-mono text-xl ${isToday ? 'text-matcha' : 'text-white'}`}>
                                            {displayDate}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 sm:border-l border-white/10 sm:pl-6">
                                    {pizzas && pizzas.length > 0 ? (
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex-1">
                                                {pizzas.length === 1 ? (
                                                    <>
                                                        <h3 className="text-lg font-medium">{pizzas[0].name}</h3>
                                                        <p className="text-xs text-grey line-clamp-1 mt-1">{pizzas[0].description}</p>
                                                        <div className="flex flex-wrap gap-4 mt-2">
                                                            <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                                Batch: {pizzas[0].current_batch}/{pizzas[0].max_batch}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                                Price: ${pizzas[0].price}
                                                            </span>
                                                            {isPast && pizzas[0].units_sold !== undefined && pizzas[0].units_sold > 0 && (
                                                                <>
                                                                    <span className="text-[10px] font-mono text-matcha uppercase">
                                                                        Sold: {pizzas[0].units_sold} units
                                                                    </span>
                                                                    <span className="text-[10px] font-mono text-matcha uppercase">
                                                                        Revenue: ${pizzas[0].revenue?.toFixed(2)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white mb-1">
                                                            {pizzas.length} Options Scheduled
                                                        </h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {pizzas.map((p, i) => (
                                                                <span key={i} className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded-sm text-grey">
                                                                    {p.name}
                                                                    {isPast && p.units_sold !== undefined && p.units_sold > 0 && (
                                                                        <span className="text-matcha ml-2">({p.units_sold} sold)</span>
                                                                    )}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {isPast && (
                                                            <div className="mt-2 text-[10px] font-mono text-matcha uppercase">
                                                                Total Revenue: ${pizzas.reduce((sum, p) => sum + (p.revenue || 0), 0).toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <Link href={`/admin/menu/${date}`} className="w-full sm:w-auto">
                                                <Button className="w-full sm:w-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    {isPast ? 'View' : 'Edit'}
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center h-full">
                                            <span className="text-grey-dark italic font-mono text-sm">
                                                {isPast ? 'No menu recorded' : 'No Service Scheduled'}
                                            </span>
                                            {!isPast && (
                                                <Link href={`/admin/menu/${date}`}>
                                                    <Button variant="secondary" className="opacity-100 sm:opacity-50 sm:group-hover:opacity-100 hover:bg-matcha/10 hover:text-matcha hover:border-matcha">
                                                        + Schedule
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {dates.length === 0 && (
                        <div className="text-center py-12 text-grey-dark font-mono text-sm">
                            No {viewMode === 'past' ? 'past' : 'upcoming'} menus found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
