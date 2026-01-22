'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Auth guard - check session on mount
    useEffect(() => {
        async function checkAuth() {
            if (!supabase) {
                router.push('/admin/login')
                return
            }

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/admin/login')
                return
            }

            setIsAuthenticated(true)
            setIsLoading(false)
        }

        checkAuth()

        // Listen for auth state changes
        const { data: { subscription } } = supabase?.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/admin/login')
            }
        }) || { data: { subscription: null } }

        return () => {
            subscription?.unsubscribe()
        }
    }, [router])

    const handleSignOut = async () => {
        if (supabase) {
            await supabase.auth.signOut()
            router.push('/admin/login')
        }
    }

    const navItems = [
        { name: 'KDS Dashboard', href: '/admin/dashboard', icon: 'M4 6h16M4 12h16M4 18h16' }, // Menu/List icon
        { name: 'Menu Architect', href: '/admin/menu', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }, // Clipboard/Archive style
        { name: 'Inventory', href: '/admin/inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' }, // Cube/box icon
        { name: 'Analytics', href: '/admin/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }, // Bar Chart icon
    ]

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="text-matcha font-mono text-xs uppercase tracking-widest animate-pulse">
                        AUTHENTICATING...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
            {/* Sidebar - Desktop */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col shrink-0 h-screen sticky top-0">
                <div className="p-6 border-b border-white/10">
                    <span className="font-mono text-xl tracking-widest text-matcha uppercase">Frame OS</span>
                    <span className="block text-[10px] text-grey-dark font-mono mt-1">v.2.0.1 SYSTEM</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${isActive
                                    ? 'bg-matcha/10 text-matcha border-l-2 border-matcha'
                                    : 'text-grey hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                </svg>
                                <span className="font-mono text-xs uppercase tracking-wider">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-grey-dark hover:text-red-400 transition-colors w-full"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        TERMINATE SESSION
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden h-16 border-b border-white/10 flex items-center justify-between px-4 bg-black sticky top-0 z-50">
                <span className="font-mono text-lg tracking-widest text-matcha">FRAME OS</span>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-white/70 hover:text-white"
                >
                    {isMobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-b border-white/10 bg-black overflow-hidden"
                    >
                        <nav className="p-4 space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`group flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${isActive
                                            ? 'bg-matcha/10 text-matcha border-l-2 border-matcha'
                                            : 'text-grey hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <svg className="w-5 h-5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                        </svg>
                                        <span className="font-mono text-xs uppercase tracking-wider">{item.name}</span>
                                    </Link>
                                )
                            })}
                            <div className="pt-4 mt-4 border-t border-white/10">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-grey-dark hover:text-red-400 transition-colors w-full"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    TERMINATE SESSION
                                </button>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black relative min-h-[calc(100vh-64px)] md:min-h-screen">
                <div className="p-4 md:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
