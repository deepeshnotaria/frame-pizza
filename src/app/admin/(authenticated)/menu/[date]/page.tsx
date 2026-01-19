'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import type { DailyPizza, PizzaTopping } from '@/types/database'

// Helper type for local state management
interface PizzaState extends Partial<DailyPizza> {
    tempId: string // internal ID for UI keying
    toppings: Partial<PizzaTopping>[]
}

export default function PizzaEditor() {
    const params = useParams()
    const router = useRouter()
    const date = params.date as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Multiple Pizzas
    const [pizzas, setPizzas] = useState<PizzaState[]>([])
    const [activeTab, setActiveTab] = useState(0)

    // Initial fetch
    useEffect(() => {
        async function fetchPizzas() {
            if (!supabase) return

            const { data, error } = await supabase
                .from('daily_pizzas')
                .select('*, pizza_toppings(*)')
                .eq('date', date)
                .order('created_at', { ascending: true }) // Stable order

            if (data && data.length > 0) {
                const loadedPizzas = data.map((p: any) => ({
                    ...p,
                    tempId: Math.random().toString(36),
                    toppings: p.pizza_toppings || []
                }))
                setPizzas(loadedPizzas)
            } else {
                // Initialize with one empty pizza
                addPizza()
            }
            setLoading(false)
        }
        fetchPizzas()
    }, [date])

    const addPizza = () => {
        if (pizzas.length >= 4) return
        const newPizza: PizzaState = {
            tempId: Math.random().toString(36),
            date: date,
            name: 'New Pizza',
            description: '',
            price: 28.00,
            max_batch: 40,
            current_batch: 0,
            hydration: '68%',
            fermentation_time: '72hrs @ 4°C',
            crust_type: 'Vegan Frico',
            toppings: []
        }
        setPizzas([...pizzas, newPizza])
        setActiveTab(pizzas.length) // Switch to new tab
    }

    const removePizza = (index: number) => {
        if (confirm('Are you sure you want to delete this pizza configuration?')) {
            const newPizzas = pizzas.filter((_, i) => i !== index)
            setPizzas(newPizzas)
            if (activeTab >= newPizzas.length) setActiveTab(Math.max(0, newPizzas.length - 1))
        }
    }

    const updatePizza = (field: keyof DailyPizza, value: any) => {
        const newPizzas = [...pizzas]
        newPizzas[activeTab] = { ...newPizzas[activeTab], [field]: value }
        setPizzas(newPizzas)
    }

    const updateToppings = (action: 'add' | 'remove' | 'update', index?: number, field?: string, value?: any) => {
        const currentPizza = pizzas[activeTab]
        if (!currentPizza) return

        let newToppings = [...currentPizza.toppings]

        if (action === 'add' && typeof value === 'string') {
            newToppings.push({ name: '', category: value as any, is_highlighted: false })
        } else if (action === 'remove' && typeof index === 'number') {
            newToppings = newToppings.filter((_, i) => i !== index)
        } else if (action === 'update' && typeof index === 'number' && field) {
            newToppings[index] = { ...newToppings[index], [field]: value }
        }

        const newPizzas = [...pizzas]
        newPizzas[activeTab] = { ...newPizzas[activeTab], toppings: newToppings }
        setPizzas(newPizzas)
    }

    const handleSave = async () => {
        setSaving(true)
        if (!supabase) return

        try {
            // Identify IDs to keep to handle deletions correctly
            // We need to DELETE pizzas that are in DB but not in our current state list
            // But 'upsert' handle inserts/updates. 
            // Explicit delete strategy:

            // 1. Get current IDs in DB
            const { data: existingData } = await supabase.from('daily_pizzas').select('id').eq('date', date)
            const existingIds = existingData?.map(d => d.id) || []

            const currentIds = pizzas.map(p => p.id).filter(Boolean) as string[]

            // 2. Delete removed pizzas
            const idsToDelete = existingIds.filter(id => !currentIds.includes(id))
            if (idsToDelete.length > 0) {
                await supabase.from('daily_pizzas').delete().in('id', idsToDelete)
            }

            // 3. Upsert each pizza
            for (const p of pizzas) {
                // Manually strip 'pizza_toppings' which is the relationship property
                const { toppings: rawToppings, tempId, pizza_toppings, ...pizzaData } = p as any
                const toppings = rawToppings as Partial<PizzaTopping>[]

                // Upsert Pizza
                const { data: savedPizza, error } = await supabase
                    .from('daily_pizzas')
                    .upsert({ ...pizzaData, date: date }) // Date is not unique anymore, so upsert works on ID regularily? 
                    // Wait, upsert needs a constraint. If we rely on ID, new pizzas lack ID. 
                    // Without ID, upsert acts as INSERT.
                    // Correct behavior: If ID exists, update. If not, insert.
                    // We don't need 'onConflict' if we rely on Primary Key logic (which Supabase does by default if ID is present)
                    .select()
                    .single()

                if (error) throw error
                if (!savedPizza) continue

                // Toppings: Delete all old, insert new (Simplest)
                await supabase.from('pizza_toppings').delete().eq('daily_pizza_id', savedPizza.id)

                if (toppings.length > 0) {
                    const toppingsToInsert = toppings.map(t => ({
                        daily_pizza_id: savedPizza.id,
                        name: t.name || 'Ingredient',
                        category: t.category || 'topping',
                        is_highlighted: t.is_highlighted || false
                    }))
                    await supabase.from('pizza_toppings').insert(toppingsToInsert)
                }
            }

            alert('Configuration Saved')
            router.push('/admin/menu')

        } catch (err) {
            console.error(err)
            alert('Failed to save')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-12 text-center text-matcha font-mono">LOADING BLUEPRINT...</div>

    const activePizza = pizzas[activeTab]

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <div>
                    <span className="font-mono text-[10px] uppercase text-grey-dark block mb-1">Editing Schedule For</span>
                    <h1 className="text-3xl font-light">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => router.push('/admin/menu')}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {pizzas.map((p, i) => (
                    <button
                        key={p.tempId}
                        onClick={() => setActiveTab(i)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-sm font-mono text-xs uppercase transition-all whitespace-nowrap ${activeTab === i
                            ? 'border-matcha text-matcha bg-matcha/10'
                            : 'border-white/10 text-grey hover:border-white/30'
                            }`}
                    >
                        {p.name || `Pizza ${i + 1}`}
                        {pizzas.length > 1 && (
                            <span
                                onClick={(e) => { e.stopPropagation(); removePizza(i); }}
                                className="ml-2 opacity-50 hover:opacity-100 hover:text-red-500"
                            >
                                ×
                            </span>
                        )}
                    </button>
                ))}
                {pizzas.length < 4 && (
                    <button
                        onClick={addPizza}
                        className="px-4 py-2 border border-dashed border-white/10 text-grey-dark text-xs font-mono uppercase hover:border-matcha hover:text-matcha transition-colors"
                    >
                        + Add Pizza
                    </button>
                )}
            </div>

            {activePizza ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: SPECS */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="font-mono text-xs uppercase text-grey-dark mb-4 border-b border-white/10 pb-2">Core Identity</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Name</label>
                                    <input
                                        className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm focus:border-matcha focus:outline-none"
                                        value={activePizza.name || ''}
                                        onChange={e => updatePizza('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Description</label>
                                    <textarea
                                        className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm h-24 focus:border-matcha focus:outline-none"
                                        value={activePizza.description || ''}
                                        onChange={e => updatePizza('description', e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Price ($)</label>
                                        <input
                                            type="number"
                                            className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm focus:border-matcha focus:outline-none"
                                            value={activePizza.price}
                                            onChange={e => updatePizza('price', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Max Batch</label>
                                        <input
                                            type="number"
                                            className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm focus:border-matcha focus:outline-none"
                                            value={activePizza.max_batch}
                                            onChange={e => updatePizza('max_batch', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="font-mono text-xs uppercase text-grey-dark mb-4 border-b border-white/10 pb-2">Technical Specs</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Hydration</label>
                                    <input
                                        className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm focus:border-matcha focus:outline-none"
                                        value={activePizza.hydration || ''}
                                        onChange={e => updatePizza('hydration', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Fermentation</label>
                                    <input
                                        className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm focus:border-matcha focus:outline-none"
                                        value={activePizza.fermentation_time || ''}
                                        onChange={e => updatePizza('fermentation_time', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Crust Type</label>
                                    <input
                                        className="bg-black/50 border border-white/10 p-2 w-full text-sm rounded-sm text-grey"
                                        value={activePizza.crust_type || ''}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INGREDIENTS */}
                    <div className="lg:col-span-2">
                        <div className="glass-card p-6 min-h-full">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
                                <h3 className="font-mono text-xs uppercase text-grey-dark">Ingredients Bill of Material</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'base')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Base</button>
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'cheese')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Cheese</button>
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'topping')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Topping</button>
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'finish')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Finish</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {activePizza.toppings.map((t, i) => (
                                    <div key={i} className="flex gap-3 items-center group">
                                        <div className="w-24 shrink-0">
                                            <span className={`text-[10px] uppercase font-mono px-2 py-1 rounded-sm ${t.category === 'base' ? 'bg-red-900/20 text-red-400' :
                                                t.category === 'cheese' ? 'bg-yellow-900/20 text-yellow-400' :
                                                    t.category === 'finish' ? 'bg-green-900/20 text-green-400' :
                                                        'bg-white/10 text-grey'
                                                }`}>
                                                {t.category}
                                            </span>
                                        </div>
                                        <input
                                            className="flex-1 bg-transparent border-b border-white/10 focus:border-matcha focus:outline-none py-1 text-sm font-light placeholder:text-grey-darker"
                                            placeholder="Ingredient Name"
                                            value={t.name}
                                            onChange={e => updateToppings('update', i, 'name', e.target.value)}
                                        />
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <span className="text-[10px] text-grey-dark uppercase">Highlight</span>
                                            <input
                                                type="checkbox"
                                                checked={t.is_highlighted || false}
                                                onChange={e => updateToppings('update', i, 'is_highlighted', e.target.checked)}
                                                className="accent-matcha"
                                            />
                                        </label>
                                        <button
                                            onClick={() => updateToppings('remove', i)}
                                            className="opacity-0 group-hover:opacity-100 text-grey-dark hover:text-red-500 px-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {activePizza.toppings.length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-sm">
                                        <p className="text-grey-dark font-mono text-xs">NO INGREDIENTS SPECIFIED</p>
                                        <p className="text-grey-darker text-[10px] mt-1">Add layers to build the pizza profile</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-grey-dark font-mono">No pizzas configured for this date.</p>
                    <Button variant="secondary" onClick={addPizza} className="mt-4">Start Configuration</Button>
                </div>
            )}
        </div>
    )
}
