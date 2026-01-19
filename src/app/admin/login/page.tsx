'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

export default function AdminLoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Temporary toggle for initial setup
    const [isSignUp, setIsSignUp] = useState(false)

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!supabase) {
            setError('System offline (Supabase not configured)')
            setLoading(false)
            return
        }

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                alert('Account created! Please ask an admin to assign your role, or check the database.')
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                // Check role
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', data.user.id)
                    .single()

                if (!roleData || !['admin', 'staff'].includes(roleData.role)) {
                    // Note: In real app, might want to sign out if unauthorized
                    // For now, let's just warn
                    setError('Unauthorized: RESTRICTED ACCESS ONLY')
                    await supabase.auth.signOut()
                    return
                }

                router.push('/admin/dashboard')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-card border border-matcha/20"
            >
                <div className="text-center mb-8">
                    <div className="inline-block w-12 h-12 border border-matcha mb-4 flex items-center justify-center">
                        <div className="w-8 h-8 bg-matcha/20" />
                    </div>
                    <h1 className="font-mono text-xl tracking-[0.2em] text-matcha uppercase">
                        System Access
                    </h1>
                    <p className="text-xs text-grey-dark mt-2 font-mono">
                        RESTRICTED TERMINAL
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono text-grey-dark uppercase mb-2">Identifier</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 text-sm focus:border-matcha focus:outline-none transition-colors"
                            placeholder="ADMIN_ID"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-grey-dark uppercase mb-2">Keycode</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 p-3 text-sm focus:border-matcha focus:outline-none transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono">
                            ERROR: {error}
                        </div>
                    )}

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'AUTHENTICATING...' : (isSignUp ? 'INITIALIZE USER' : 'ENTER SYSTEM')}
                    </Button>

                    <div className="text-center pt-4">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[10px] text-grey-dark hover:text-matcha font-mono uppercase tracking-widest"
                        >
                            {isSignUp ? 'Switch to Login' : 'Initialize New User'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
