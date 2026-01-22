'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ChartWrapper } from './ChartWrapper'

interface SalesChartProps {
    data: { date: string; revenue: number; orders: number }[]
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ChartWrapper>
                {({ width, height }) => (
                    <BarChart data={data} width={width} height={height}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                            cursor={{ fill: '#ffffff05' }}
                            formatter={(value) => [`$${value}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#D1F28A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                )}
            </ChartWrapper>
        </div>
    )
}
