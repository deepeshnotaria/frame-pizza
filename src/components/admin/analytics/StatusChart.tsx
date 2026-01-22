'use client'

import React from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartWrapper } from './ChartWrapper'

interface StatusChartProps {
    data: { status: string; count: number }[]
}

const COLORS: Record<string, string> = {
    pending: '#EAB308',   // Yellow
    confirmed: '#3B82F6', // Blue
    ready: '#6366F1',     // Indigo
    completed: '#D1F28A', // Matcha
    cancelled: '#EF4444', // Red
}

export const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
    // Filter out zero values for cleaner chart
    const activeData = data.filter(item => item.count > 0)

    // Calculate total for center display
    const total = activeData.reduce((acc, curr) => acc + curr.count, 0)

    return (
        <div className="flex flex-col sm:flex-row items-center h-[350px] sm:h-[300px] w-full gap-4">
            <div className="relative flex-1 h-[200px] sm:h-full w-full">
                <ChartWrapper fallback={<div className="h-full w-full animate-pulse bg-white/5 rounded-full" />}>
                    {({ width, height }) => (
                        <PieChart width={width} height={height}>
                            <Pie
                                data={activeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                                stroke="none"
                            >
                                {activeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#666'} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                                itemStyle={{ color: '#fff', textTransform: 'capitalize' }}
                                formatter={(value: any, name: any) => [`${value} Orders`, name]}
                            />
                        </PieChart>
                    )}
                </ChartWrapper>

                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <span className="text-white font-mono text-3xl font-light block leading-none mb-1">
                        {total}
                    </span>
                    <span className="text-[10px] text-grey uppercase tracking-widest block">Requests</span>
                </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-row flex-wrap sm:flex-col justify-center gap-x-4 gap-y-2 w-full sm:w-auto sm:min-w-[120px] sm:pr-4">
                {activeData.map((item) => (
                    <div key={item.status} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS[item.status] || '#666' }}
                        />
                        <span className="text-xs font-mono text-grey capitalize">
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
