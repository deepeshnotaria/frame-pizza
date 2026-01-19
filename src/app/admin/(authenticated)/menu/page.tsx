'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyPizza } from '@/types/database'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function MenuManager() {
    const [schedule, setSchedule] = useState<Map<string, DailyPizza[]>>(new Map())
    const [loading, setLoading] = useState(true)

    // Helper for local date string YYYY-MM-DD
    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Generate next 14 days based on LOCAL time
    const dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return getLocalDateString(d)
    })

    useEffect(() => {
        async function fetchMenu() {
            if (!supabase) return
            const today = getLocalDateString(new Date())

            const { data, error } = await supabase
                .from('daily_pizzas')
                .select('*')
                .gte('date', today)

            if (data) {
                const map = new Map<string, DailyPizza[]>()
                data.forEach((p: DailyPizza) => {
                    const existing = map.get(p.date) || []
                    map.set(p.date, [...existing, p])
                })
                setSchedule(map)
            }
            setLoading(false)
        }
        fetchMenu()
    }, [])

    return (
        <div>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-grey-dark">
                        Planning
                    </span>
                    <h1 className="text-2xl font-light text-white mt-2">Menu Schedule</h1>
                </div>
                <Button variant="secondary">
                    + New Template
                </Button>
            </div>

            <div className="space-y-4">
                {dates.map((date) => {
                    const pizzas = schedule.get(date)
                    // Construct local date object explicitly to avoid UTC shift
                    const [y, m, d] = date.split('-').map(Number)
                    const dateObj = new Date(y, m - 1, d)

                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const isToday = date === getLocalDateString(new Date())

                    return (
                        <div
                            key={date}
                            className={`glass-card p-6 flex items-center gap-6 group transition-all hover:border-white/20 ${isToday ? 'border-matcha/50 bg-matcha/5' : ''
                                }`}
                        >
                            {/* Date Column */}
                            <div className="w-24 text-center shrink-0">
                                <span className="block text-[10px] uppercase tracking-wider text-grey-dark mb-1">
                                    {dayName}
                                </span>
                                <span className={`font-mono text-xl ${isToday ? 'text-matcha' : 'text-white'}`}>
                                    {displayDate}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 border-l border-white/10 pl-6">
                                {pizzas && pizzas.length > 0 ? (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            {pizzas.length === 1 ? (
                                                <>
                                                    <h3 className="text-lg font-medium">{pizzas[0].name}</h3>
                                                    <p className="text-xs text-grey line-clamp-1 mt-1">{pizzas[0].description}</p>
                                                    <div className="flex gap-4 mt-2">
                                                        <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                            Batch: {pizzas[0].current_batch}/{pizzas[0].max_batch}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-grey-dark uppercase">
                                                            Price: ${pizzas[0].price}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <h3 className="text-lg font-medium text-white mb-1">
                                                        {pizzas.length} Options Scheduled
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        {pizzas.map((p, i) => (
                                                            <span key={i} className="text-[10px] font-mono border border-white/20 px-2 py-1 rounded-sm text-grey">
                                                                {p.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/admin/menu/${date}`}>
                                            <Button className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                Edit
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center h-full">
                                        <span className="text-grey-dark italic font-mono text-sm">No Service Scheduled</span>
                                        <Link href={`/admin/menu/${date}`}>
                                            <Button variant="secondary" className="opacity-50 group-hover:opacity-100 hover:bg-matcha/10 hover:text-matcha hover:border-matcha">
                                                + Schedule
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
