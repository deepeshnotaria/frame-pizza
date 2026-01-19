'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        if (supabase) {
            await supabase.auth.signOut()
            router.push('/admin/login')
        }
    }

    const navItems = [
        { name: 'KDS Dashboard', href: '/admin/dashboard', icon: 'M4 6h16M4 12h16M4 18h16' }, // Menu/List icon
        { name: 'Menu Architect', href: '/admin/menu', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }, // Clipboard/Archive style
    ]

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col">
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

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-black relative">
                {/* Mobile Header (visible only on small screens) */}
                <header className="md:hidden h-16 border-b border-white/10 flex items-center justify-between px-4">
                    <span className="font-mono text-lg tracking-widest text-matcha">FRAME OS</span>
                    {/* Mobile menu toggle would go here */}
                </header>

                <div className="p-6 md:p-12 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
