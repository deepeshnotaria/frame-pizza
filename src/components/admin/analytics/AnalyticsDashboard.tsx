'use client'

import React from 'react'
import { AnalyticsSummary, OrderWithDetails } from '@/lib/api/analytics'
import { KPICard } from './KPICard'
import { SalesChart } from './SalesChart'
import { OrdersTable } from './OrdersTable'
import { HourlyTrafficChart } from './HourlyTrafficChart'
import { StatusChart } from './StatusChart'
import { ExportButton } from './ExportButton'

interface AnalyticsDashboardProps {
    summary: AnalyticsSummary
    orders: OrderWithDetails[]
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ summary, orders }) => {
    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title="Total Revenue"
                    value={`$${summary.totalRevenue.toFixed(2)}`}
                    subValue={summary.dailyRevenue.length > 0 ? "Period Sum" : "No Data"}
                    trend="up"
                />
                <KPICard
                    title="Total Orders"
                    value={summary.totalOrders}
                    subValue="All Statuses"
                    trend="neutral"
                />
                <KPICard
                    title="Avg. Order Value"
                    value={`$${summary.averageOrderValue.toFixed(2)}`}
                    trend="neutral"
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 bg-black/50 border border-white/10 p-6 rounded-sm min-w-0">
                    <h3 className="text-white font-mono text-sm uppercase tracking-wider mb-6">Revenue Trend</h3>
                    <SalesChart data={summary.dailyRevenue} />
                </div>

                {/* Status Breakdown */}
                <div className="bg-black/50 border border-white/10 p-6 rounded-sm min-w-0">
                    <h3 className="text-white font-mono text-sm uppercase tracking-wider mb-6">Order Status</h3>
                    <StatusChart data={summary.ordersByStatus} />
                </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Hourly Traffic */}
                <div className="lg:col-span-2 bg-black/50 border border-white/10 p-6 rounded-sm min-w-0">
                    <h3 className="text-white font-mono text-sm uppercase tracking-wider mb-6">Peak Hours (Traffic)</h3>
                    <HourlyTrafficChart data={summary.ordersByHour} />
                </div>

                {/* Top Products */}
                <div className="bg-black/50 border border-white/10 p-6 rounded-sm min-w-0">
                    <h3 className="text-white font-mono text-sm uppercase tracking-wider mb-6">Top Menu Items</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {summary.pizzaSales.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <span className="text-grey-dark font-mono text-xs w-4">0{index + 1}</span>
                                    <div>
                                        <div className="text-sm text-white group-hover:text-matcha transition-colors">{item.name}</div>
                                        <div className="text-xs text-grey">{item.quantity} sold</div>
                                    </div>
                                </div>
                                <div className="text-sm font-mono text-white/50">
                                    ${item.revenue.toFixed(0)}
                                </div>
                            </div>
                        ))}
                        {summary.pizzaSales.length === 0 && (
                            <div className="text-grey text-sm">No sales data yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-white font-mono text-sm uppercase tracking-wider">Transaction History</h3>
                    <ExportButton orders={orders} />
                </div>
                <OrdersTable orders={orders} />
            </div>
        </div>
    )
}
