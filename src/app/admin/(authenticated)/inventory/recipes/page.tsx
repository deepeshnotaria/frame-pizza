'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { motion, AnimatePresence } from 'framer-motion'
import type { Recipe, RecipeWithIngredients, InventoryItem } from '@/types/database'

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    cheese: { bg: 'bg-yellow-900/20', text: 'text-yellow-400' },
    sauce: { bg: 'bg-orange-900/20', text: 'text-orange-400' },
    base: { bg: 'bg-red-900/20', text: 'text-red-400' },
    topping: { bg: 'bg-white/10', text: 'text-grey' },
    finish: { bg: 'bg-green-900/20', text: 'text-green-400' },
    other: { bg: 'bg-purple-900/20', text: 'text-purple-400' },
}

const CATEGORIES = ['cheese', 'sauce', 'base', 'topping', 'finish', 'other'] as const
const YIELD_UNITS = ['g', 'kg', 'ml', 'liters', 'batch', 'each'] as const

interface RecipeIngredientState {
    inventory_item_id: string
    quantity: number
}

interface NewRecipeState {
    name: string
    category: Recipe['category']
    description: string
    yield_quantity: number
    yield_unit: string
    prep_notes: string
    ingredients: RecipeIngredientState[]
}

export default function RecipesPage() {
    const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingRecipe, setEditingRecipe] = useState<RecipeWithIngredients | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state for new/edit recipe
    const [formData, setFormData] = useState<NewRecipeState>({
        name: '',
        category: 'other',
        description: '',
        yield_quantity: 1,
        yield_unit: 'batch',
        prep_notes: '',
        ingredients: [],
    })

    useEffect(() => {
        fetchRecipes()
        fetchInventory()
    }, [])

    async function fetchRecipes() {
        if (!supabase) return
        setLoading(true)

        const { data, error } = await supabase
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

        if (data) setRecipes(data as RecipeWithIngredients[])
        if (error) console.error('Error fetching recipes:', error)
        setLoading(false)
    }

    async function fetchInventory() {
        if (!supabase) return
        const { data } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('is_active', true)
            .order('name')
        if (data) setInventoryItems(data)
    }

    // Computed values
    const filteredRecipes = useMemo(() => {
        let result = recipes

        if (searchQuery) {
            result = result.filter(recipe =>
                recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (categoryFilter !== 'all') {
            result = result.filter(recipe => recipe.category === categoryFilter)
        }

        return result
    }, [recipes, searchQuery, categoryFilter])

    // Recipe cost calculation
    const calculateRecipeCost = (recipe: RecipeWithIngredients): number => {
        return recipe.recipe_ingredients.reduce((total, ing) => {
            const cost = ing.inventory_items?.cost_per_unit || 0
            return total + (ing.quantity * cost)
        }, 0)
    }

    // Handlers
    const openAddModal = () => {
        setEditingRecipe(null)
        setFormData({
            name: '',
            category: 'other',
            description: '',
            yield_quantity: 1,
            yield_unit: 'batch',
            prep_notes: '',
            ingredients: [],
        })
        setShowAddModal(true)
    }

    const openEditModal = (recipe: RecipeWithIngredients) => {
        setEditingRecipe(recipe)
        setFormData({
            name: recipe.name,
            category: recipe.category,
            description: recipe.description || '',
            yield_quantity: recipe.yield_quantity,
            yield_unit: recipe.yield_unit,
            prep_notes: recipe.prep_notes || '',
            ingredients: recipe.recipe_ingredients.map(ing => ({
                inventory_item_id: ing.inventory_item_id,
                quantity: ing.quantity,
            })),
        })
        setShowAddModal(true)
    }

    const closeModal = () => {
        setShowAddModal(false)
        setEditingRecipe(null)
    }

    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { inventory_item_id: '', quantity: 0 }],
        })
    }

    const removeIngredient = (index: number) => {
        setFormData({
            ...formData,
            ingredients: formData.ingredients.filter((_, i) => i !== index),
        })
    }

    const updateIngredient = (index: number, field: keyof RecipeIngredientState, value: any) => {
        const newIngredients = [...formData.ingredients]
        newIngredients[index] = { ...newIngredients[index], [field]: value }
        setFormData({ ...formData, ingredients: newIngredients })
    }

    const handleSave = async () => {
        if (!supabase || !formData.name) return
        setSaving(true)

        try {
            if (editingRecipe) {
                // Update existing recipe
                const { error: updateError } = await supabase
                    .from('recipes')
                    .update({
                        name: formData.name,
                        category: formData.category,
                        description: formData.description || null,
                        yield_quantity: formData.yield_quantity,
                        yield_unit: formData.yield_unit,
                        prep_notes: formData.prep_notes || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingRecipe.id)

                if (updateError) throw updateError

                // Delete old ingredients
                await supabase
                    .from('recipe_ingredients')
                    .delete()
                    .eq('recipe_id', editingRecipe.id)

                // Insert new ingredients
                if (formData.ingredients.length > 0) {
                    const ingredientsToInsert = formData.ingredients
                        .filter(ing => ing.inventory_item_id && ing.quantity > 0)
                        .map(ing => ({
                            recipe_id: editingRecipe.id,
                            inventory_item_id: ing.inventory_item_id,
                            quantity: ing.quantity,
                        }))

                    if (ingredientsToInsert.length > 0) {
                        const { error: ingError } = await supabase
                            .from('recipe_ingredients')
                            .insert(ingredientsToInsert)
                        if (ingError) throw ingError
                    }
                }
            } else {
                // Create new recipe
                const { data: newRecipe, error: createError } = await supabase
                    .from('recipes')
                    .insert({
                        name: formData.name,
                        category: formData.category,
                        description: formData.description || null,
                        yield_quantity: formData.yield_quantity,
                        yield_unit: formData.yield_unit,
                        prep_notes: formData.prep_notes || null,
                    })
                    .select()
                    .single()

                if (createError) throw createError

                // Insert ingredients
                if (newRecipe && formData.ingredients.length > 0) {
                    const ingredientsToInsert = formData.ingredients
                        .filter(ing => ing.inventory_item_id && ing.quantity > 0)
                        .map(ing => ({
                            recipe_id: newRecipe.id,
                            inventory_item_id: ing.inventory_item_id,
                            quantity: ing.quantity,
                        }))

                    if (ingredientsToInsert.length > 0) {
                        const { error: ingError } = await supabase
                            .from('recipe_ingredients')
                            .insert(ingredientsToInsert)
                        if (ingError) throw ingError
                    }
                }
            }

            closeModal()
            fetchRecipes()
        } catch (err) {
            console.error('Error saving recipe:', err)
            alert('Failed to save recipe')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (recipe: RecipeWithIngredients) => {
        if (!supabase) return
        if (!confirm(`Delete "${recipe.name}"? This action cannot be undone.`)) return

        const { error } = await supabase
            .from('recipes')
            .update({ is_active: false })
            .eq('id', recipe.id)

        if (!error) fetchRecipes()
        else console.error('Error deleting recipe:', error)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-matcha font-mono">LOADING RECIPES...</div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <span className="font-mono text-[10px] uppercase text-grey-dark block mb-1">Recipe Management</span>
                    <h1 className="text-2xl sm:text-3xl font-light">Prep Recipes</h1>
                    <p className="text-sm text-grey mt-1">Create reusable recipes that link to inventory items</p>
                </div>
                <Button onClick={openAddModal}>+ New Recipe</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-6">
                    <div className="font-mono text-[10px] uppercase text-grey-dark mb-2">Total Recipes</div>
                    <div className="text-3xl font-light text-white">{recipes.length}</div>
                </div>
                <div className="glass-card p-6">
                    <div className="font-mono text-[10px] uppercase text-grey-dark mb-2">Categories Used</div>
                    <div className="text-3xl font-light text-white">
                        {new Set(recipes.map(r => r.category)).size}
                    </div>
                </div>
                <div className="glass-card p-6">
                    <div className="font-mono text-[10px] uppercase text-grey-dark mb-2">Avg Ingredients</div>
                    <div className="text-3xl font-light text-white">
                        {recipes.length > 0
                            ? (recipes.reduce((sum, r) => sum + r.recipe_ingredients.length, 0) / recipes.length).toFixed(1)
                            : '0'}
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search recipes..."
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
                        ...CATEGORIES.map(cat => ({ value: cat, label: cat.toUpperCase() }))
                    ]}
                    className="w-48"
                />
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe) => {
                    const categoryStyle = CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.other
                    const cost = calculateRecipeCost(recipe)

                    return (
                        <motion.div
                            key={recipe.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-5 hover:border-white/20 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-medium text-white">{recipe.name}</h3>
                                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm ${categoryStyle.bg} ${categoryStyle.text}`}>
                                        {recipe.category}
                                    </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(recipe)}
                                        className="text-[10px] text-grey hover:text-matcha px-2 py-1"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(recipe)}
                                        className="text-[10px] text-grey hover:text-red-400 px-2 py-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {recipe.description && (
                                <p className="text-sm text-grey mb-3 line-clamp-2">{recipe.description}</p>
                            )}

                            <div className="text-[10px] text-grey-dark font-mono uppercase mb-2">
                                Yield: {recipe.yield_quantity} {recipe.yield_unit}
                            </div>

                            {/* Ingredients Preview */}
                            <div className="border-t border-white/10 pt-3 mt-3">
                                <div className="text-[10px] text-grey-dark font-mono uppercase mb-2">
                                    Ingredients ({recipe.recipe_ingredients.length})
                                </div>
                                <div className="space-y-1">
                                    {recipe.recipe_ingredients.slice(0, 3).map((ing, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-grey">{ing.inventory_items?.name || 'Unknown'}</span>
                                            <span className="font-mono text-grey-dark">
                                                {ing.quantity} {ing.inventory_items?.unit}
                                            </span>
                                        </div>
                                    ))}
                                    {recipe.recipe_ingredients.length > 3 && (
                                        <div className="text-[10px] text-grey-dark">
                                            +{recipe.recipe_ingredients.length - 3} more...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cost */}
                            {cost > 0 && (
                                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center">
                                    <span className="text-[10px] text-grey-dark font-mono uppercase">Est. Cost</span>
                                    <span className="text-sm font-mono text-matcha">${cost.toFixed(2)}</span>
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {filteredRecipes.length === 0 && (
                <div className="glass-card text-center py-12">
                    <p className="text-grey-dark font-mono text-xs">NO RECIPES FOUND</p>
                    <p className="text-grey-darker text-[10px] mt-1">Create a recipe to link ingredients to inventory</p>
                    <Button onClick={openAddModal} variant="secondary" className="mt-4">
                        + Create First Recipe
                    </Button>
                </div>
            )}

            {/* Add/Edit Recipe Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="glass-card p-6 w-full max-w-2xl my-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="font-mono text-xs uppercase text-grey-dark mb-6 border-b border-white/10 pb-2">
                                {editingRecipe ? 'Edit Recipe' : 'New Recipe'}
                            </h2>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Recipe Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        placeholder="e.g., House Vegan Mozzarella"
                                    />
                                </div>

                                {/* Category and Yield */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Select
                                            label="Category"
                                            value={formData.category}
                                            onChange={(val) => setFormData({ ...formData, category: val as Recipe['category'] })}
                                            options={CATEGORIES.map(cat => ({ value: cat, label: cat.toUpperCase() }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-grey uppercase block mb-1">Yield Qty</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.yield_quantity}
                                            onChange={(e) => setFormData({ ...formData, yield_quantity: parseFloat(e.target.value) || 1 })}
                                            className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <Select
                                            label="Yield Unit"
                                            value={formData.yield_unit}
                                            onChange={(val) => setFormData({ ...formData, yield_unit: val })}
                                            options={YIELD_UNITS.map(unit => ({ value: unit, label: unit }))}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Description (optional)</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none h-20"
                                        placeholder="Brief description of the recipe..."
                                    />
                                </div>

                                {/* Ingredients */}
                                <div className="border-t border-white/10 pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs text-grey uppercase">Ingredients (per batch)</label>
                                        <button
                                            onClick={addIngredient}
                                            className="text-[10px] bg-white/5 hover:bg-white/10 text-matcha px-3 py-1 rounded-sm uppercase"
                                        >
                                            + Add Ingredient
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {formData.ingredients.map((ing, i) => {
                                            const selectedItem = inventoryItems.find(inv => inv.id === ing.inventory_item_id)
                                            return (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <div className="flex-1">
                                                        <Select
                                                            value={ing.inventory_item_id}
                                                            onChange={(val) => updateIngredient(i, 'inventory_item_id', val)}
                                                            options={[
                                                                { value: '', label: 'Select ingredient...' },
                                                                ...inventoryItems.map(inv => ({
                                                                    value: inv.id,
                                                                    label: `${inv.name} (${inv.unit})`
                                                                }))
                                                            ]}
                                                        />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Qty"
                                                        value={ing.quantity || ''}
                                                        onChange={(e) => updateIngredient(i, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-20 bg-black/50 border border-white/10 rounded-sm px-2 py-1.5 text-xs focus:border-matcha focus:outline-none"
                                                    />
                                                    <span className="text-[10px] text-grey-dark w-12">
                                                        {selectedItem?.unit || '—'}
                                                    </span>
                                                    <button
                                                        onClick={() => removeIngredient(i)}
                                                        className="text-grey-dark hover:text-red-400 px-2"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        })}

                                        {formData.ingredients.length === 0 && (
                                            <div className="text-center py-6 border border-dashed border-white/10 rounded-sm">
                                                <p className="text-grey-dark text-xs">No ingredients added</p>
                                                <p className="text-grey-darker text-[10px] mt-1">Click "+ Add Ingredient" to start</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Prep Notes */}
                                <div>
                                    <label className="text-xs text-grey uppercase block mb-1">Prep Notes (optional)</label>
                                    <textarea
                                        value={formData.prep_notes}
                                        onChange={(e) => setFormData({ ...formData, prep_notes: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-sm px-3 py-2 text-sm focus:border-matcha focus:outline-none h-20"
                                        placeholder="Special instructions, timing, temperature..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                                <Button onClick={handleSave} disabled={saving || !formData.name} className="flex-1">
                                    {saving ? 'Saving...' : (editingRecipe ? 'Update Recipe' : 'Create Recipe')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
