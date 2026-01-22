import React from 'react'
import { Download } from 'lucide-react'
import { OrderWithDetails } from '@/lib/api/analytics'

interface ExportButtonProps {
    orders: OrderWithDetails[]
}

export const ExportButton: React.FC<ExportButtonProps> = ({ orders }) => {

    const handleExport = () => {
        if (!orders || orders.length === 0) return

        // Define CSV headers
        const headers = ['Order ID', 'Date', 'Time', 'Customer Name', 'Email', 'Phone', 'Product', 'Price', 'Quantity', 'Total', 'Status']

        // Map data to rows
        const rows = orders.map(order => [
            order.batch_id,
            new Date(order.created_at).toLocaleDateString(),
            new Date(order.created_at).toLocaleTimeString(),
            `"${order.customer_name}"`, // Quote strings with potential commas
            order.customer_email,
            order.customer_phone,
            `"${order.daily_pizzas?.name || 'Unknown'}"`,
            order.daily_pizzas?.price || 0,
            order.quantity,
            (Number(order.daily_pizzas?.price || 0) * order.quantity).toFixed(2),
            order.status
        ])

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `frame_orders_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <button
            onClick={handleExport}
            disabled={orders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download size={14} />
            <span>Export CSV</span>
        </button>
    )
}
