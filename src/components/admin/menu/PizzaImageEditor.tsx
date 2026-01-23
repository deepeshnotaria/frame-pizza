'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Upload, Sparkles, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { toast } from '@/components/ui/Toast'

interface PizzaImageEditorProps {
    imageUrl: string | null
    onUpdate: (url: string | null) => void
    pizzaName: string
    description: string
    toppings: string[]
}

export function PizzaImageEditor({ imageUrl, onUpdate, pizzaName, description, toppings }: PizzaImageEditorProps) {
    const [uploading, setUploading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !supabase) return

        setUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `menu-images/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath)

            onUpdate(publicUrl)
            toast.success('Image uploaded successfully')
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    const handleGenerate = async () => {
        if (generating) return
        setGenerating(true)
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: pizzaName,
                    description,
                    toppings
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to generate image')

            // We need to proxy the URL through Supabase storage to avoid Fal.ai temporary URL expiration
            // or just use it directly if the user is okay with it. 
            // Better to download and re-upload to our own storage.

            const imageRes = await fetch(data.url)
            const blob = await imageRes.blob()
            const fileName = `ai-gen-${Math.random().toString(36).substring(2)}.png`
            const filePath = `menu-images/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('menu-images')
                .upload(filePath, blob, { contentType: 'image/png' })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('menu-images')
                .getPublicUrl(filePath)

            onUpdate(publicUrl)
            toast.success('AI Image generated and saved')
        } catch (error: any) {
            console.error('Generation error:', error)
            toast.error(error.message || 'Failed to generate image')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-4">
            <label className="text-xs text-grey uppercase block mb-1">Pizza Visual</label>

            <div className="relative aspect-[4/3] bg-black/50 border border-white/10 rounded-sm overflow-hidden group">
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={pizzaName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                title="Change Image"
                            >
                                <Upload className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="p-2 bg-matcha/20 hover:bg-matcha/40 rounded-full transition-colors"
                                title="Regenerate with AI"
                            >
                                {generating ? <Loader2 className="w-5 h-5 text-matcha animate-spin" /> : <Sparkles className="w-5 h-5 text-matcha" />}
                            </button>
                            <button
                                onClick={() => onUpdate(null)}
                                className="p-2 bg-red-900/20 hover:bg-red-900/40 rounded-full transition-colors"
                                title="Remove Image"
                            >
                                <X className="w-5 h-5 text-red-500" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <ImageIcon className="w-12 h-12 text-grey-dark" />
                        <div className="space-y-2">
                            <p className="text-xs text-grey-dark font-mono uppercase">No visual blueprint</p>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="text-[10px] h-8"
                                >
                                    {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                                    Upload
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="text-[10px] h-8 bg-matcha/10 text-matcha border-matcha/30 hover:bg-matcha/20"
                                >
                                    {generating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                    AI Generate
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
                accept="image/*"
            />

            <p className="text-[10px] text-grey-darker font-mono italic">
                {generating ? 'Engineers are sketching your pizza...' : 'Upload a high-res photo or use AI to generate a photorealistic render based on ingredients.'}
            </p>
        </div>
    )
}
