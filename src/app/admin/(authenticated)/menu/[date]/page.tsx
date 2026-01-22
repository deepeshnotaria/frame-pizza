'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { PizzaPicker } from '@/components/admin/menu/PizzaPicker'
import type { DailyPizza, PizzaTopping, DailyPizzaWithToppingsAndInventory, InventoryItem, ForecastSettings, RecipeWithIngredients } from '@/types/database'
import { Select } from '@/components/ui/Select'
import { DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/Toast'

// Sortable Tab Component
function SortableTab({ id, pizza, isActive, index, onClick, onRemove, showRemove }: {
    id: string,
    pizza: PizzaState,
    isActive: boolean,
    index: number,
    onClick: () => void,
    onRemove: (id: string) => void,
    showRemove: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as 'relative',
    };

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 border rounded-sm font-mono text-xs uppercase transition-all whitespace-nowrap select-none ${isActive
                ? 'border-matcha text-matcha bg-matcha/10'
                : 'border-white/10 text-grey hover:border-white/30'
                } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
        >
            {pizza.name || `Pizza ${index + 1}`}
            {showRemove && (
                <span
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        // prevent drag start on remove button
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(pizza.tempId);
                    }}
                    className="ml-2 opacity-50 hover:opacity-100 hover:text-red-500 cursor-pointer"
                >
                    ×
                </span>
            )}
        </button>
    );
}

// Extended topping type with recipe linking
interface ToppingState extends Partial<PizzaTopping> {
    recipe_id?: string
    inventory_item_id?: string
    quantity_per_pizza?: number // quantity of the recipe (e.g., 0.5 batches? or grams?) -> standard is usually 'serving' or 'grams' depending on recipe yield unit
}

// Helper type for local state management
interface PizzaState extends Partial<DailyPizza> {
    tempId: string // internal ID for UI keying
    toppings: ToppingState[]
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
    const [showPizzaPicker, setShowPizzaPicker] = useState(false)
    const [showNewPizzaMenu, setShowNewPizzaMenu] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const newPizzaButtonRef = useRef<HTMLButtonElement>(null)

    // Inventory & Recipe state
    const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [forecastSettings, setForecastSettings] = useState<ForecastSettings | null>(null)

    // Initial fetch
    const fetchPizzas = useCallback(async () => {
        if (!supabase) return
        setLoading(true)

        const { data, error } = await supabase
            .from('daily_pizzas')
            .select(`
                *,
                pizza_toppings (
                    *,
                    topping_recipe_links (
                        recipe_id,
                        inventory_item_id,
                        quantity_per_pizza
                    )
                )
            `)
            .eq('date', date)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (data && data.length > 0) {
            const loadedPizzas = data.map((p: any) => ({
                ...p,
                tempId: Math.random().toString(36),
                toppings: (p.pizza_toppings || []).map((t: any) => ({
                    ...t,
                    // Extract recipe link data if present
                    recipe_id: t.topping_recipe_links?.[0]?.recipe_id,
                    inventory_item_id: t.topping_recipe_links?.[0]?.inventory_item_id,
                    quantity_per_pizza: t.topping_recipe_links?.[0]?.quantity_per_pizza
                }))
            }))
            setPizzas(loadedPizzas)
        } else {
            // Initialize with one empty pizza
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
            setPizzas([newPizza])
            setActiveTab(0)
        }
        setLoading(false)
    }, [date])

    useEffect(() => {
        fetchPizzas()
    }, [fetchPizzas])

    // Fetch recipes
    useEffect(() => {
        async function fetchData() {
            if (!supabase) return
            // Fetch Recipes with ingredients for tooltip/calculation
            const { data: recipeData } = await supabase
                .from('recipes')
                .select(`
                    *,
                    recipe_ingredients (
                        *,
                        inventory_items (*)
                    )
                `)
                .eq('is_active', true)
                .order('name')
            if (recipeData) setRecipes(recipeData as RecipeWithIngredients[])

            // Fetch Inventory for direct linking
            const { data: inventoryData } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('is_active', true)
                .order('name')
            if (inventoryData) setInventoryItems(inventoryData)

            // Fetch settings
            const { data: settings } = await supabase
                .from('forecast_settings')
                .select('*')
                .limit(1)
                .single()
            if (settings) setForecastSettings(settings)
        }
        fetchData()
    }, [])

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

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setPizzas((items) => {
                const oldIndex = items.findIndex((item) => item.tempId === active.id);
                const newIndex = items.findIndex((item) => item.tempId === over.id);

                // If the active tab was selected, keep it selected (need to update index)
                if (activeTab === oldIndex) setActiveTab(newIndex);
                else if (activeTab === newIndex && oldIndex < newIndex) setActiveTab(activeTab - 1); // rough adjustment, better to just let user click again or track by ID
                // Actually tracking by ID is better, but for now let's just reorder

                // Adjust active tab if it moved
                if (activeTab === oldIndex) {
                    setActiveTab(newIndex);
                } else if (activeTab > oldIndex && activeTab <= newIndex) {
                    setActiveTab(activeTab - 1);
                } else if (activeTab < oldIndex && activeTab >= newIndex) {
                    setActiveTab(activeTab + 1);
                }

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const clonePizza = (pizza: DailyPizzaWithToppingsAndInventory) => {
        if (pizzas.length >= 4) return
        const clonedPizza: PizzaState = {
            tempId: Math.random().toString(36),
            date: date,
            name: pizza.name,
            description: pizza.description,
            price: pizza.price,
            max_batch: pizza.max_batch,
            current_batch: 0,
            hydration: pizza.hydration,
            fermentation_time: pizza.fermentation_time,
            crust_type: pizza.crust_type,
            toppings: pizza.pizza_toppings?.map(t => ({
                name: t.name,
                category: t.category,
                is_highlighted: t.is_highlighted,
                is_customer_visible: t.is_customer_visible ?? true,
                recipe_id: t.topping_recipe_links?.[0]?.recipe_id,
                inventory_item_id: t.topping_recipe_links?.[0]?.inventory_item_id,
                quantity_per_pizza: t.topping_recipe_links?.[0]?.quantity_per_pizza
            })) || []
        }
        setPizzas([...pizzas, clonedPizza])
        setActiveTab(pizzas.length)
    }

    const removePizza = (id: string) => {
        toast.info('Delete this pizza?', {
            action: {
                label: 'Confirm',
                onClick: () => {
                    setPizzas(current => {
                        const newPizzas = current.filter(p => p.tempId !== id)
                        // Adjust active tab if needed
                        const deletedIndex = current.findIndex(p => p.tempId === id)
                        if (activeTab >= newPizzas.length) setActiveTab(Math.max(0, newPizzas.length - 1))
                        return newPizzas
                    })
                }
            }
        })
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
            newToppings.push({ name: '', category: value as any, is_highlighted: false, is_customer_visible: true })
        } else if (action === 'remove' && typeof index === 'number') {
            newToppings = newToppings.filter((_, i) => i !== index)
        } else if (action === 'update' && typeof index === 'number' && field) {
            newToppings[index] = { ...newToppings[index], [field]: value }

            // Handle special composite ID from Select (recipe:ID or item:ID)
            if (field === 'selection_id' && value) {
                const [type, id] = (value as string).split(':')

                if (type === 'recipe') {
                    newToppings[index].recipe_id = id
                    newToppings[index].inventory_item_id = undefined

                    // Auto-fill name
                    const recipe = recipes.find(r => r.id === id)
                    if (recipe && !newToppings[index].name) {
                        newToppings[index].name = recipe.name
                    }
                } else if (type === 'item') {
                    newToppings[index].inventory_item_id = id
                    newToppings[index].recipe_id = undefined

                    // Auto-fill name
                    const item = inventoryItems.find(i => i.id === id)
                    if (item && !newToppings[index].name) {
                        newToppings[index].name = item.name
                    }
                }
            } else if (field === 'selection_id' && !value) {
                // Cleared
                newToppings[index].recipe_id = undefined
                newToppings[index].inventory_item_id = undefined
            }
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
            const { data: existingData } = await supabase.from('daily_pizzas').select('id').eq('date', date)
            const existingIds = existingData?.map(d => d.id) || []
            const currentIds = pizzas.map(p => p.id).filter(Boolean) as string[]

            // Delete removed pizzas
            const idsToDelete = existingIds.filter(id => !currentIds.includes(id))
            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase.from('daily_pizzas').delete().in('id', idsToDelete)
                if (deleteError) {
                    if (deleteError.code === '23503' || deleteError.message?.includes('violates foreign key')) {
                        throw new Error('Cannot delete pizzas that have associated orders. The pizzas have been restored.')
                    }
                    throw deleteError
                }
            }

            // Process all pizzas in parallel
            await Promise.all(pizzas.map(async (p, index) => {
                const { toppings: rawToppings, tempId, pizza_toppings, ...pizzaData } = p as any
                const toppings = rawToppings as ToppingState[]

                // Upsert Pizza
                const { data: savedPizza, error } = await supabase
                    .from('daily_pizzas')
                    .upsert({ ...pizzaData, date: date, display_order: index })
                    .select()
                    .single()

                if (error) throw error
                if (!savedPizza) return

                // Get existing topping IDs to clean up old links
                const { data: existingToppings } = await supabase
                    .from('pizza_toppings')
                    .select('id')
                    .eq('daily_pizza_id', savedPizza.id)

                if (existingToppings && existingToppings.length > 0) {
                    const existingToppingIds = existingToppings.map(t => t.id)
                    // Delete existing recipe links for these toppings
                    await supabase
                        .from('topping_recipe_links')
                        .delete()
                        .in('pizza_topping_id', existingToppingIds)
                }

                // Delete all old toppings (cleanest for ordering)
                await supabase.from('pizza_toppings').delete().eq('daily_pizza_id', savedPizza.id)

                // Insert new toppings and their recipe links in parallel
                if (toppings.length > 0) {
                    await Promise.all(toppings.map(async (t) => {
                        const { data: savedTopping, error: toppingError } = await supabase
                            .from('pizza_toppings')
                            .insert({
                                daily_pizza_id: savedPizza.id,
                                name: t.name || 'Ingredient',
                                category: t.category || 'topping',
                                is_highlighted: t.is_highlighted || false,
                                is_customer_visible: t.is_customer_visible ?? true
                            })
                            .select()
                            .single()

                        if (toppingError) {
                            console.error('Error saving topping:', toppingError)
                            return
                        }

                        // Save Recipe/Inventory Link
                        if (savedTopping && (t.recipe_id || t.inventory_item_id) && t.quantity_per_pizza) {
                            const { error: linkError } = await supabase
                                .from('topping_recipe_links')
                                .insert({
                                    pizza_topping_id: savedTopping.id,
                                    recipe_id: t.recipe_id || null,
                                    inventory_item_id: t.inventory_item_id || null,
                                    quantity_per_pizza: t.quantity_per_pizza
                                })

                            if (linkError) {
                                console.error('Error saving recipe link:', linkError)
                            }
                        }
                    }))
                }
            }))

            toast.success('Configuration Saved')
            // router.push('/admin/menu') - User wants to stay on page

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save'
            if (!message.includes('The pizzas have been restored')) {
                console.error(err)
            }
            toast.error(message)

            // If we couldn't delete, restore state from server
            if (message.includes('The pizzas have been restored')) {
                toast.info('Restoring menu data...')
                await fetchPizzas()
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-12 text-center text-matcha font-mono">LOADING BLUEPRINT...</div>

    const activePizza = pizzas[activeTab]

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0 mb-8 border-b border-white/10 pb-6">
                <div>
                    <span className="font-mono text-[10px] uppercase text-grey-dark block mb-1">Editing Schedule For</span>
                    <h1 className="text-2xl sm:text-3xl font-light">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}</h1>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <Button variant="secondary" onClick={() => router.push('/admin/menu')} className="flex-1 sm:flex-none">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>

            {/* TABS */}
            <div className="mb-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToHorizontalAxis]}
                >
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <SortableContext
                            items={pizzas.map(p => p.tempId)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {pizzas.map((p, i) => (
                                <SortableTab
                                    key={p.tempId}
                                    id={p.tempId}
                                    pizza={p}
                                    index={i}
                                    isActive={activeTab === i}
                                    onClick={() => setActiveTab(i)}
                                    onRemove={removePizza}
                                    showRemove={pizzas.length > 1}
                                />
                            ))}
                        </SortableContext>

                        {pizzas.length < 4 && (
                            <button
                                ref={newPizzaButtonRef}
                                onClick={() => {
                                    if (newPizzaButtonRef.current) {
                                        const rect = newPizzaButtonRef.current.getBoundingClientRect()
                                        setMenuPosition({ top: rect.bottom + 4, left: rect.left })
                                    }
                                    setShowNewPizzaMenu(!showNewPizzaMenu)
                                }}
                                className="px-4 py-2 border border-dashed border-white/10 text-grey-dark text-xs font-mono uppercase hover:border-matcha hover:text-matcha transition-colors whitespace-nowrap shrink-0"
                            >
                                + New Pizza
                            </button>
                        )}
                    </div>
                </DndContext>
            </div>

            {/* New Pizza Dropdown Menu - Rendered as overlay */}
            {showNewPizzaMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNewPizzaMenu(false)} />
                    <div
                        className="fixed z-50 bg-black border border-white/20 rounded-sm shadow-xl min-w-[180px]"
                        style={{ top: menuPosition.top, left: Math.max(16, menuPosition.left) }}
                    >
                        <div className="text-[10px] text-grey-dark font-mono uppercase px-4 py-2 border-b border-white/10">Add Pizza</div>
                        <button
                            onClick={() => { addPizza(); setShowNewPizzaMenu(false); }}
                            className="w-full px-4 py-3 text-left text-xs font-mono uppercase text-grey hover:bg-matcha/10 hover:text-matcha transition-colors flex items-center gap-2"
                        >
                            <span className="text-matcha">+</span> Start from Scratch
                        </button>
                        <button
                            onClick={() => { setShowPizzaPicker(true); setShowNewPizzaMenu(false); }}
                            className="w-full px-4 py-3 text-left text-xs font-mono uppercase text-grey hover:bg-matcha/10 hover:text-matcha transition-colors border-t border-white/10 flex items-center gap-2"
                        >
                            <span className="text-matcha">+</span> From Past Menu
                        </button>
                    </div>
                </>
            )}

            {/* Pizza Picker Modal */}
            <PizzaPicker
                isOpen={showPizzaPicker}
                onClose={() => setShowPizzaPicker(false)}
                onSelectPizza={clonePizza}
                excludeDate={date}
            />

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
                                        onChange={e => updatePizza('crust_type', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INGREDIENTS */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/10 pb-4 sm:pb-2">
                                <h3 className="font-mono text-xs uppercase text-grey-dark">Ingredients Bill of Material</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'base')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Base</button>
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'cheese')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Cheese</button>
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'topping')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Topping</button>
                                    <button onClick={() => updateToppings('add', undefined, undefined, 'finish')} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 uppercase text-grey">+ Finish</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {activePizza.toppings.map((t, i) => {
                                    const linkedRecipe = recipes.find(r => r.id === t.recipe_id)
                                    const linkedItem = inventoryItems.find(i => i.id === t.inventory_item_id)

                                    // Calculate if we have enough ingredients
                                    let hasLowStock = false

                                    if (linkedRecipe) {
                                        hasLowStock = linkedRecipe.recipe_ingredients.some(ing => {
                                            const required = (ing.quantity * (t.quantity_per_pizza || 0) * (activePizza.max_batch || 40))
                                            return (ing.inventory_items?.current_quantity || 0) < required
                                        })
                                    } else if (linkedItem) {
                                        const required = (t.quantity_per_pizza || 0) * (activePizza.max_batch || 40)
                                        hasLowStock = linkedItem.current_quantity < required
                                    }

                                    return (
                                        <div key={i} className="glass-card p-3 group hover:border-white/20">
                                            <div className="flex gap-2 sm:gap-3 items-center mb-2">
                                                <div className="w-16 sm:w-20 shrink-0">
                                                    <span className={`text-[10px] uppercase font-mono px-2 py-1 rounded-sm block text-center truncate ${t.category === 'base' ? 'bg-red-900/20 text-red-400' :
                                                        t.category === 'cheese' ? 'bg-yellow-900/20 text-yellow-400' :
                                                            t.category === 'finish' ? 'bg-green-900/20 text-green-400' :
                                                                'bg-white/10 text-grey'
                                                        }`}>
                                                        {t.category}
                                                    </span>
                                                </div>
                                                <input
                                                    className="min-w-0 flex-1 bg-transparent border-b border-white/10 focus:border-matcha focus:outline-none py-1 text-sm font-light placeholder:text-grey-darker"
                                                    placeholder="Customer Facing Name"
                                                    value={t.name}
                                                    onChange={e => updateToppings('update', i, 'name', e.target.value)}
                                                />
                                                <button
                                                    onClick={() => updateToppings('update', i, 'is_customer_visible', !t.is_customer_visible)}
                                                    className={`px-1 shrink-0 ${t.is_customer_visible ? 'text-matcha' : 'text-grey-dark'}`}
                                                    title={t.is_customer_visible ? "Customer Facing" : "Internal Only"}
                                                >
                                                    {t.is_customer_visible ? (
                                                        <Eye className="w-4 h-4" />
                                                    ) : (
                                                        <EyeOff className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {(t.is_customer_visible ?? true) && (
                                                    <label className="flex items-center gap-1 cursor-pointer shrink-0">
                                                        <span className="text-[10px] text-grey-dark uppercase hidden sm:inline">★</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={t.is_highlighted || false}
                                                            onChange={e => updateToppings('update', i, 'is_highlighted', e.target.checked)}
                                                            className="accent-matcha"
                                                        />
                                                    </label>
                                                )}
                                                <button
                                                    onClick={() => updateToppings('remove', i)}
                                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-grey-dark hover:text-red-500 px-1 shrink-0"
                                                >
                                                    ×
                                                </button>
                                            </div>

                                            {/* Recipe Linking Row */}
                                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-2 pl-0 sm:pl-[88px]">
                                                <div className="flex-1">
                                                    <div className="flex-1">
                                                        <Select
                                                            value={t.recipe_id ? `recipe:${t.recipe_id}` : t.inventory_item_id ? `item:${t.inventory_item_id}` : ''}
                                                            onChange={(val) => updateToppings('update', i, 'selection_id', val || undefined)}
                                                            options={[
                                                                { value: '', label: 'Select Source...' },
                                                                ...recipes.map(r => ({
                                                                    value: `recipe:${r.id}`,
                                                                    label: `${r.name} (${r.yield_quantity} ${r.yield_unit})`,
                                                                    group: 'Recipes'
                                                                })),
                                                                ...inventoryItems.map(item => ({
                                                                    value: `item:${item.id}`,
                                                                    label: `${item.name} (${item.unit})`,
                                                                    group: 'Raw Ingredients'
                                                                }))
                                                            ]}
                                                        />
                                                    </div>
                                                </div>

                                                {(linkedRecipe || linkedItem) && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="Qty"
                                                                value={t.quantity_per_pizza || ''}
                                                                onChange={e => updateToppings('update', i, 'quantity_per_pizza', parseFloat(e.target.value) || undefined)}
                                                                className="w-16 bg-black/50 border border-white/10 rounded-sm px-2 py-1 text-xs focus:border-matcha focus:outline-none text-right"
                                                            />
                                                            <span className="text-[10px] text-grey-dark whitespace-nowrap">
                                                                {linkedRecipe ? `${linkedRecipe.yield_unit}/pizza` : linkedItem ? `${linkedItem.unit}/pizza` : ''}
                                                            </span>
                                                        </div>
                                                        {hasLowStock && (
                                                            <span className="text-[10px] text-red-400 font-mono flex items-center gap-1" title="Insufficient inventory for max batch">
                                                                ⚠ LOW
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recipe Ingredients Preview */}
                                            {linkedRecipe && (
                                                <div className="mt-2 pl-0 sm:pl-[88px] text-[10px] text-grey-dark font-mono">
                                                    <span className="mr-2">Contains:</span>
                                                    {linkedRecipe.recipe_ingredients.map(ing => ing.inventory_items?.name).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {activePizza.toppings.length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-sm">
                                        <p className="text-grey-dark font-mono text-xs">NO INGREDIENTS SPECIFIED</p>
                                        <p className="text-grey-darker text-[10px] mt-1">Add layers to build the pizza profile</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Inventory Forecast Section */}
                        {activePizza.toppings.some(t => (t.recipe_id || t.inventory_item_id) && t.quantity_per_pizza) && (
                            <div className="glass-card p-4 sm:p-6">
                                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                                    <h3 className="font-mono text-xs uppercase text-grey-dark">Inventory Forecast</h3>
                                    <span className="text-[10px] text-grey-dark">
                                        Max Batch: {activePizza.max_batch}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {/* Aggregate ingredients across all toppings */}
                                    {(() => {
                                        const ingredientTotals: Record<string, { name: string, unit: string, needed: number, have: number }> = {}

                                        activePizza.toppings.forEach(t => {
                                            // Handle Recipe
                                            if (t.recipe_id && t.quantity_per_pizza) {
                                                const recipe = recipes.find(r => r.id === t.recipe_id)
                                                if (recipe) {
                                                    recipe.recipe_ingredients.forEach(ing => {
                                                        if (!ing.inventory_items) return
                                                        const id = ing.inventory_item_id
                                                        if (!ingredientTotals[id]) {
                                                            ingredientTotals[id] = {
                                                                name: ing.inventory_items.name,
                                                                unit: ing.inventory_items.unit,
                                                                needed: 0,
                                                                have: ing.inventory_items.current_quantity
                                                            }
                                                        }
                                                        const recipeFraction = (t.quantity_per_pizza || 0) / (recipe.yield_quantity || 1)
                                                        const ingredientNeeded = recipeFraction * ing.quantity * (activePizza.max_batch || 40)
                                                        ingredientTotals[id].needed += ingredientNeeded
                                                    })
                                                }
                                            }

                                            // Handle Component Ingredient
                                            if (t.inventory_item_id && t.quantity_per_pizza) {
                                                const item = inventoryItems.find(i => i.id === t.inventory_item_id)
                                                if (item) {
                                                    if (!ingredientTotals[item.id]) {
                                                        ingredientTotals[item.id] = {
                                                            name: item.name,
                                                            unit: item.unit,
                                                            needed: 0,
                                                            have: item.current_quantity
                                                        }
                                                    }
                                                    ingredientTotals[item.id].needed += (t.quantity_per_pizza * (activePizza.max_batch || 40))
                                                }
                                            }
                                        })

                                        return Object.values(ingredientTotals).map((item, i) => {
                                            const hasEnough = item.have >= item.needed
                                            return (
                                                <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded-sm cursor-default">
                                                    <span className="text-grey">{item.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-grey-dark">
                                                            Need: {item.needed.toFixed(1)} {item.unit}
                                                        </span>
                                                        <span className="font-mono text-grey-dark">
                                                            Have: {item.have.toFixed(1)} {item.unit}
                                                        </span>
                                                        <span className={`font-mono w-10 text-right ${hasEnough ? 'text-matcha' : 'text-red-400'}`}>
                                                            {hasEnough ? 'OK' : 'LOW'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            </div>
                        )}
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
