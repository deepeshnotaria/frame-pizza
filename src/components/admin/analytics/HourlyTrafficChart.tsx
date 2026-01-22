'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ChartWrapper } from './ChartWrapper'

interface HourlyTrafficChartProps {
    data: { hour: string; count: number }[]
}

export const HourlyTrafficChart: React.FC<HourlyTrafficChartProps> = ({ data }) => {
    return (
        <div className="h-[300px] w-full">
            <ChartWrapper>
                {({ width, height }) => (
                    <BarChart data={data} width={width} height={height} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="hour"
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            interval={3}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                            cursor={{ fill: '#ffffff05' }}
                            formatter={(value) => [`${value} Orders`, 'Traffic']}
                        />
                        <Bar dataKey="count" fill="#60A5FA" radius={[2, 2, 0, 0]} opacity={0.8} />
                    </BarChart>
                )}
            </ChartWrapper>
        </div>
    )
}
