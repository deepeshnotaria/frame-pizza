import React, { useState } from 'react'
import { OrderWithDetails } from '@/lib/api/analytics'

interface OrdersTableProps {
    orders: OrderWithDetails[]
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    ready: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    completed: 'bg-matcha/10 text-matcha border-matcha/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
    const [filter, setFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name.toLowerCase().includes(filter.toLowerCase()) ||
            order.batch_id.toLowerCase().includes(filter.toLowerCase()) ||
            order.daily_pizzas.name.toLowerCase().includes(filter.toLowerCase())

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <div className="bg-black/50 border border-white/10 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center">
                <input
                    type="text"
                    placeholder="Search orders..."
                    className="bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-matcha w-full md:w-64"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <select
                    className="bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-matcha w-full md:w-auto appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        colorScheme: 'dark',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                    }}
                >
                    <option value="all" className="bg-black text-white">All Statuses</option>
                    <option value="pending" className="bg-black text-white">Pending</option>
                    <option value="confirmed" className="bg-black text-white">Confirmed</option>
                    <option value="ready" className="bg-black text-white">Ready</option>
                    <option value="completed" className="bg-black text-white">Completed</option>
                    <option value="cancelled" className="bg-black text-white">Cancelled</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-grey uppercase font-mono text-xs">
                        <tr>
                            <th className="px-6 py-3 font-normal tracking-wider">Date</th>
                            <th className="px-6 py-3 font-normal tracking-wider">Order ID</th>
                            <th className="px-6 py-3 font-normal tracking-wider">Customer</th>
                            <th className="px-6 py-3 font-normal tracking-wider">Item</th>
                            <th className="px-6 py-3 font-normal tracking-wider">Total</th>
                            <th className="px-6 py-3 font-normal tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-grey">
                                    {new Date(order.created_at).toLocaleDateString()} <span className="text-grey-dark text-xs">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-white/70">
                                    #{order.batch_id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-white">{order.customer_name}</div>
                                    <div className="text-xs text-grey-dark">{order.customer_email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-white">{order.daily_pizzas.name}</div>
                                    <div className="text-xs text-grey-dark">Qty: {order.quantity}</div>
                                </td>
                                <td className="px-6 py-4 font-mono text-matcha">
                                    ${(Number(order.daily_pizzas.price) * order.quantity).toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider border rounded-full ${statusColors[order.status] || 'bg-white/10 text-white border-white/20'}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredOrders.length === 0 && (
                <div className="p-8 text-center text-grey">
                    No orders found matching your criteria.
                </div>
            )}
        </div>
    )
}
