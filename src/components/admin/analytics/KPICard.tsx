import React from 'react'

interface KPICardProps {
    title: string
    value: string | number
    subValue?: string
    icon?: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, subValue, icon, trend }) => {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-grey text-xs uppercase tracking-wider font-mono">{title}</h3>
                {icon && <div className="text-matcha opacity-80">{icon}</div>}
            </div>
            <div className="flex items-end gap-3">
                <span className="text-3xl font-light text-white">{value}</span>
                {subValue && (
                    <span className={`text-xs font-mono mb-1 ${trend === 'up' ? 'text-matcha' :
                            trend === 'down' ? 'text-red-400' : 'text-grey'
                        }`}>
                        {subValue}
                    </span>
                )}
            </div>
        </div>
    )
}
