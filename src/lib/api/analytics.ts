import { supabase } from '@/lib/supabase'

export interface OrderWithDetails {
    id: string
    batch_id: string
    customer_name: string
    customer_email: string
    customer_phone: string
    quantity: number
    status: string
    created_at: string
    daily_pizzas: {
        name: string
        price: number
    }
}

export interface AnalyticsSummary {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    pizzaSales: { name: string; quantity: number; revenue: number }[]
    dailyRevenue: { date: string; revenue: number; orders: number }[]
    ordersByHour: { hour: string; count: number }[]
    ordersByStatus: { status: string; count: number }[]
}

export async function fetchOrders(startDate?: Date, endDate?: Date) {
    let query = supabase
        .from('orders')
        .select(`
            *,
            daily_pizzas (
                name,
                price
            )
        `)
        .order('created_at', { ascending: false })

    if (startDate) {
        // Ensure start date is at the beginning of the day (00:00:00)
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        query = query.gte('created_at', start.toISOString())
    }
    if (endDate) {
        // Ensure end date is at the end of the day (23:59:59)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching orders:', error)
        throw error
    }

    return data as OrderWithDetails[]
}

export function processAnalytics(orders: OrderWithDetails[]): AnalyticsSummary {
    const summary: AnalyticsSummary = {
        totalRevenue: 0,
        totalOrders: orders.length,
        averageOrderValue: 0,
        pizzaSales: [],
        dailyRevenue: [],
        ordersByHour: [],
        ordersByStatus: []
    }

    const pizzaMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    const hourlyMap = new Array(24).fill(0)
    const statusMap = new Map<string, number>()

    orders.forEach(order => {
        // Calculate revenue for this order
        const price = Number(order.daily_pizzas?.price) || 0
        const revenue = price * order.quantity

        summary.totalRevenue += revenue

        // Pizza Breakdown
        const pizzaName = order.daily_pizzas?.name || 'Unknown'
        const currentPizza = pizzaMap.get(pizzaName) || { name: pizzaName, quantity: 0, revenue: 0 }
        currentPizza.quantity += order.quantity
        currentPizza.revenue += revenue
        pizzaMap.set(pizzaName, currentPizza)

        // Daily Breakdown
        const orderDate = new Date(order.created_at)
        const dateKey = orderDate.toLocaleDateString('en-CA') // YYYY-MM-DD
        const currentDay = dailyMap.get(dateKey) || { revenue: 0, orders: 0 }
        currentDay.revenue += revenue
        currentDay.orders += 1
        dailyMap.set(dateKey, currentDay)

        // Hourly Breakdown
        const hour = orderDate.getHours()
        hourlyMap[hour] += 1

        // Status Breakdown
        const status = order.status
        statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    if (summary.totalOrders > 0) {
        summary.averageOrderValue = summary.totalRevenue / summary.totalOrders
    }

    summary.pizzaSales = Array.from(pizzaMap.values()).sort((a, b) => b.revenue - a.revenue)

    summary.dailyRevenue = Array.from(dailyMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date))

    summary.ordersByHour = hourlyMap.map((count, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count
    }))

    summary.ordersByStatus = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)

    return summary
}
