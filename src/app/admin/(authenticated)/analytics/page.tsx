'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { fetchOrders, processAnalytics, AnalyticsSummary, OrderWithDetails } from '@/lib/api/analytics'
import { AnalyticsDashboard } from '@/components/admin/analytics/AnalyticsDashboard'
import { DateRangeFilter } from '@/components/admin/analytics/DateRangeFilter'

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
    const [orders, setOrders] = useState<OrderWithDetails[]>([])
    const [error, setError] = useState('')

    // Default to last 30 days
    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d
    })
    const [endDate, setEndDate] = useState<Date | undefined>(() => new Date())

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const data = await fetchOrders(startDate, endDate)
            const processed = processAnalytics(data)
            setOrders(data)
            setSummary(processed)
        } catch (err) {
            console.error(err)
            setError('Failed to load analytics data')
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
        setStartDate(start)
        setEndDate(end)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-matcha/30 border-t-matcha rounded-full animate-spin" />
                    <span className="text-grey font-mono text-xs uppercase tracking-widest">Crunching Numbers...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-sm text-sm"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 1, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-light text-white mb-2">Analytics</h1>
                    <p className="text-grey text-sm max-w-xl">
                        Overview of sales performance, product mix, and recent transaction history.
                    </p>
                </div>
                <div>
                    <DateRangeFilter
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={handleDateRangeChange}
                    />
                </div>
            </div>

            {summary && <AnalyticsDashboard summary={summary} orders={orders} />}
        </motion.div>
    )
}
