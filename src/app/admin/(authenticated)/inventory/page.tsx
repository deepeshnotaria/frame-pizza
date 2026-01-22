'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { motion, AnimatePresence } from 'framer-motion'
import type { InventoryItem, InventoryTransaction } from '@/types/database'

type SortField = 'name' | 'category' | 'current_quantity' | 'cost_per_unit'
type SortDirection = 'asc' | 'desc'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    protein: { bg: 'bg-red-900/20', text: 'text-red-400' },
    cheese: { bg: 'bg-yellow-900/20', text: 'text-yellow-400' },
    produce: { bg: 'bg-green-900/20', text: 'text-green-400' },
    dry_goods: { bg: 'bg-amber-900/20', text: 'text-amber-400' },
    sauce: { bg: 'bg-orange-900/20', text: 'text-orange-400' },
    oil: { bg: 'bg-lime-900/20', text: 'text-lime-400' },
    spice: { bg: 'bg-purple-900/20', text: 'text-purple-400' },
    other: { bg: 'bg-white/10', text: 'text-grey' },
}

const CATEGORIES = ['protein', 'cheese', 'produce', 'dry_goods', 'sauce', 'oil', 'spice', 'other'] as const
const UNITS = ['kg', 'lbs', 'oz', 'g', 'liters', 'ml', 'each', 'cans', 'bottles'] as const

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showStockModal, setShowStockModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

    // Form state for new item
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'other' as InventoryItem['category'],
        unit: 'kg',
        current_quantity: 0,
        par_level: 0,
        cost_per_unit: 0,
    })

    // Form state for stock adjustment
    const [stockAdjustment, setStockAdjustment] = useState({
        type: 'purchase' as InventoryTransaction['transaction_type'],
        quantity: 0,
        unit_cost: 0,
        notes: '',
    })

    useEffect(() => {
        fetchInventory()
    }, [])

    async function fetchInventory() {
        if (!supabase) return
        setLoading(true)

        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (data) setItems(data)
        if (error) console.error('Error fetching inventory:', error)
        setLoading(false)
    }

    // Computed values
    const filteredItems = useMemo(() => {
        let result = items

        // Search filter
        if (searchQuery) {
            result = result.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(item => item.category === categoryFilter)
        }

        // Sort
        result.sort((a, b) => {
            let aVal = a[sortField]
            let bVal = b[sortField]
            if (aVal === null) aVal = 0
            if (bVal === null) bVal = 0
            if (typeof aVal === 'string') aVal = aVal.toLowerCase()
            if (typeof bVal === 'string') bVal = bVal.toLowerCase()

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [items, searchQuery, categoryFilter, sortField, sortDirection])

    const lowStockItems = useMemo(() =>
        items.filter(item => item.par_level && item.current_quantity < item.par_level),
        [items]
    )

    const totalValue = useMemo(() =>
        items.reduce((sum, item) => sum + (item.current_quantity * (item.cost_per_unit || 0)), 0),
        [items]
    )

    // Handlers
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const handleAddItem = async () => {
        if (!supabase || !newItem.name) return

        const { error } = await supabase
            .from('inventory_items')
            .insert([{
                name: newItem.name,
                category: newItem.category,
                unit: newItem.unit,
                current_quantity: newItem.current_quantity,
                par_level: newItem.par_level || null,
                cost_per_unit: newItem.cost_per_unit || null,
            }])

        if (!error) {
            setShowAddModal(false)
            setNewItem({ name: '', category: 'other', unit: 'kg', current_quantity: 0, par_level: 0, cost_per_unit: 0 })
            fetchInventory()
        } else {
            console.error('Error adding item:', error)
        }
    }

    const handleStockAdjustment = async () => {
        if (!supabase || !selectedItem) return

        const quantityChange = stockAdjustment.type === 'usage' || stockAdjustment.type === 'waste'
            ? -Math.abs(stockAdjustment.quantity)
            : Math.abs(stockAdjustment.quantity)

        // Create transaction
        const { error: txError } = await supabase
            .from('inventory_transactions')
            .insert([{
                inventory_item_id: selectedItem.id,
                transaction_type: stockAdjustment.type,
                quantity: quantityChange,
                unit_cost: stockAdjustment.unit_cost || null,
                notes: stockAdjustment.notes || null,
            }])

        if (txError) {
            console.error('Error creating transaction:', txError)
            return
        }

        // Update item quantity
        const newQuantity = selectedItem.current_quantity + quantityChange
        const updates: Partial<InventoryItem> = {
            current_quantity: Math.max(0, newQuantity),
            updated_at: new Date().toISOString(),
        }

        if (stockAdjustment.type === 'purchase') {
            updates.last_restocked_at = new Date().toISOString()
            if (stockAdjustment.unit_cost) {
                updates.cost_per_unit = stockAdjustment.unit_cost
            }
        }

        const { error: updateError } = await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', selectedItem.id)

        if (!updateError) {
            setShowStockModal(false)
            setSelectedItem(null)
            setStockAdjustment({ type: 'purchase', quantity: 0, unit_cost: 0, notes: '' })
            fetchInventory()
        }
    }

    const openStockModal = (item: InventoryItem, type: InventoryTransaction['transaction_type']) => {
        setSelectedItem(item)
        setStockAdjustment({ type, quantity: 0, unit_cost: item.cost_per_unit || 0, notes: '' })
        setShowStockModal(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-matcha font-mono">LOADING INVENTORY...</div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <span className="font-mono text-[10px] uppercase text-grey-dark block mb-1">Inventory Management</span>
                    <h1 className="text-2xl sm:text-3xl font-light">Stock Control</h1>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/inventory/recipes">
                        <Button variant="secondary">Manage Recipes</Button>
                    </Link>
                    <Button onClick={() => setShowAddModal(true)}>+ Add Item</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-6">
                    <div className="font-mono text-[10px] uppercase text-grey-dark mb-2">Total Items</div>
                    <div className="text-3xl font-light text-white">{items.length}</div>
                </div>
                <div className="glass-card p-6">
                    <div className="font-mono text-[10px] uppercase text-grey-dark mb-2">Low Stock Alerts</div>
                    <div className={`text-3xl font-light ${lowStockItems.length > 0 ? 'text-red-400' : 'text-matcha'}`}>
                        {lowStockItems.length}
                    </div>
                    {lowStockItems.length > 0 && (
                        <div className="text-[10px] text-red-400 mt-1">⚠ Reorder needed</div>
                    )}
                </div>
                <div className="glass-card p-6">
                    <div className="font-mono text-[10px] uppercase text-grey-dark mb-2">Total Value</div>
                    <div className="text-3xl font-light text-white">${totalValue.toFixed(2)}</div>
                </div>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockItems.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-sm p-4 mb-6">
                    <div className="flex items-center gap-2 text-red-400 font-mono text-xs uppercase mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Low Stock Warning
                    </div>
                    <div className="text-sm text-grey">
                        {lowStockItems.map(item => item.name).join(', ')}
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search ingredients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-sm px-4 py-2 text-sm focus:border-matcha focus:outline-none"
                    />
                </div>
                <Select
                    value={categoryFilter}
                    onChange={(val) => setCategoryFilter(val)}
                    options={[
                        { value: 'all', label: 'All Categories' },
                        ...CATEGORIES.map(cat => ({ value: cat, label: cat.replace('_', ' ').toUpperCase() }))
                    ]}
                    className="w-48"
                />
            </div>

            {/* Inventory Table */}
            <div className="glass-card overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th
                                    onClick={() => handleSort('name')}
                                    className="text-left px-6 py-4 font-mono text-[10px] uppercase text-grey-dark cursor-pointer hover:text-white"
                                >
                                    Ingredient {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('category')}
                                    className="text-left px-6 py-4 font-mono text-[10px] uppercase text-grey-dark cursor-pointer hover:text-white"
                                >
                                    Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('current_quantity')}
                                    className="text-left px-6 py-4 font-mono text-[10px] uppercase text-grey-dark cursor-pointer hover:text-white"
                                >
                                    Stock {sortField === 'current_quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    onClick={() => handleSort('cost_per_unit')}
                                    className="text-left px-6 py-4 font-mono text-[10px] uppercase text-grey-dark cursor-pointer hover:text-white"
                                >
                                    Cost {sortField === 'cost_per_unit' && (sortDirection === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="text-left px-6 py-4 font-mono text-[10px] uppercase text-grey-dark">Status</th>
                                <th className="text-right px-6 py-4 font-mono text-[10px] uppercase text-grey-dark">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const isLow = item.par_level && item.current_quantity < item.par_level
                                const categoryStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
                                return (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] uppercase font-mono px-2 py-1 rounded-sm ${categoryStyle.bg} ${categoryStyle.text}`}>
                                                {item.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono">
                                            {item.current_quantity.toFixed(1)} {item.unit}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-grey">
                                            {item.cost_per_unit ? `$${item.cost_per_unit.toFixed(2)}/${item.unit}` : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLow ? (
                                                <span className="text-[10px] uppercase font-mono text-red-400">⚠ LOW</span>
                                            ) : (
                                                <span className="text-[10px] uppercase font-mono text-matcha">● OK</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => openStockModal(item, 'purchase')}
                                                    className="text-[10px] bg-matcha/10 hover:bg-matcha/20 text-matcha px-3 py-1 rounded-sm font-mono uppercase"
                                                >
                                                    + Stock
                                                </button>
                                                <button
                                                    onClick={() => openStockModal(item, 'waste')}
                                                    className="text-[10px] bg-red-900/20 hover:bg-red-900/30 text-red-400 px-3 py-1 rounded-sm font-mono uppercase"
                                                >
                                                    Waste
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-white/10">
                    {filteredItems.map((item) => {
                        const isLow = item.par_level && item.current_quantity < item.par_level
                        const categoryStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
                        return (
                            <div key={item.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm ${categoryStyle.bg} ${categoryStyle.text}`}>
                                            {item.category.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {isLow ? (
                                        <span className="text-[10px] uppercase font-mono text-red-400">⚠ LOW</span>
                                    ) : (
                                        <span className="text-[10px] uppercase font-mono text-matcha">● OK</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="text-sm font-mono text-grey">
                                        {item.current_quantity.toFixed(1)} {item.unit}
                                        {item.cost_per_unit && ` • $${item.cost_per_unit.toFixed(2)}`}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openStockModal(item, 'purchase')}
                                            className="text-[10px] bg-matcha/10 text-matcha px-2 py-1 rounded-sm font-mono"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => openStockModal(item, 'waste')}
                                            className="text-[10px] bg-red-900/20 text-red-400 px-2 py-1 rounded-sm font-mono"
                                        >
                                            −
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-grey-dark font-mono text-xs">NO ITEMS FOUND</p>
                        <p className="text-grey-darker text-[10px] mt-1">Add ingredients to start tracking inventory</p>
                    </div>
                )}
            </div>

            {/* Add Item Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-card p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="font-mono text-xs uppercase text-grey-dark mb-6 border-b border-white/10 pb-2">Add Inventory Item</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        placeholder="e.g., San Marzano Tomatoes"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    <div>
                                        <Select
                                            label="Category"
                                            value={newItem.category}
                                            onChange={(val) => setNewItem({ ...newItem, category: val as InventoryItem['category'] })}
                                            options={CATEGORIES.map(cat => ({ value: cat, label: cat.replace('_', ' ').toUpperCase() }))}
                                        />
                                    </div>
                                    <div>
                                        <Select
                                            label="Unit"
                                            value={newItem.unit}
                                            onChange={(val) => setNewItem({ ...newItem, unit: val })}
                                            options={UNITS.map(unit => ({ value: unit, label: unit.toUpperCase() }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Initial Qty</label>
                                        <input
                                            type="number"
                                            value={newItem.current_quantity}
                                            onChange={(e) => setNewItem({ ...newItem, current_quantity: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Par Level</label>
                                        <input
                                            type="number"
                                            value={newItem.par_level}
                                            onChange={(e) => setNewItem({ ...newItem, par_level: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Cost/Unit</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newItem.cost_per_unit}
                                            onChange={(e) => setNewItem({ ...newItem, cost_per_unit: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                                <Button onClick={handleAddItem} className="flex-1">Add Item</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stock Adjustment Modal */}
            <AnimatePresence>
                {showStockModal && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowStockModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-card p-6 w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="font-mono text-xs uppercase text-grey-dark mb-2">
                                {stockAdjustment.type === 'purchase' ? 'Add Stock' : 'Record Waste'}
                            </h2>
                            <div className="text-lg mb-6">{selectedItem.name}</div>

                            <div className="text-sm text-grey mb-4">
                                Current: <span className="text-white font-mono">{selectedItem.current_quantity.toFixed(1)} {selectedItem.unit}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Select
                                        label="Type"
                                        value={stockAdjustment.type}
                                        onChange={(val) => setStockAdjustment({ ...stockAdjustment, type: val as InventoryTransaction['transaction_type'] })}
                                        options={[
                                            { value: 'purchase', label: 'Purchase (Add)' },
                                            { value: 'usage', label: 'Usage (Deduct)' },
                                            { value: 'waste', label: 'Waste (Deduct)' },
                                            { value: 'adjustment', label: 'Adjustment' },
                                            { value: 'return', label: 'Return (Add)' },
                                        ]}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Quantity ({selectedItem.unit})</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={stockAdjustment.quantity}
                                            onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Unit Cost ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={stockAdjustment.unit_cost}
                                            onChange={(e) => setStockAdjustment({ ...stockAdjustment, unit_cost: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Notes (optional)</label>
                                    <input
                                        type="text"
                                        value={stockAdjustment.notes}
                                        onChange={(e) => setStockAdjustment({ ...stockAdjustment, notes: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        placeholder="e.g., Weekly delivery from vendor"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowStockModal(false)} className="flex-1">Cancel</Button>
                                <Button onClick={handleStockAdjustment} className="flex-1">Confirm</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
