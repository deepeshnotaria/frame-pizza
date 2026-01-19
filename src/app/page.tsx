'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { HeroSection } from '@/components/HeroSection'
import { BatchProgress } from '@/components/ui/BatchProgress'
import { mockTodaysPizza } from '@/lib/mockData'
import { getTodaysPizzas, supabase } from '@/lib/supabase'
import type { DailyPizzaWithToppings } from '@/types/database'

export default function HomePage() {
  const [pizza, setPizza] = useState<DailyPizzaWithToppings>(mockTodaysPizza)
  const [headerVisible, setHeaderVisible] = useState(false)

  // Fetch real data on mount
  useEffect(() => {
    async function fetchPizza() {
      if (!supabase) return
      try {
        const data = await getTodaysPizzas()
        if (data && data.length > 0) setPizza(data[0] as DailyPizzaWithToppings)
      } catch (err) {
        console.error('Failed to fetch pizza:', err)
      }
    }
    fetchPizza()
  }, [])

  // Show header after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const threshold = window.innerHeight * 0.4
      setHeaderVisible(scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-frame-bg">
      {/* Header - appears after scrolling */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-frame-bg/80 backdrop-blur-md border-b border-white/5"
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: headerVisible ? 1 : 0,
          y: headerVisible ? 0 : -20,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: headerVisible ? 'auto' : 'none' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-mono text-lg tracking-wider text-white">FRAME</span>
          <Link
            href="/order"
            className="font-mono text-xs uppercase tracking-wider text-grey-dark hover:text-matcha transition-colors"
          >
            Find Today&apos;s Batch
          </Link>
        </div>
      </motion.header>

      {/* Hero Section with Scroll Animation */}
      <HeroSection />

      {/* Blueprint Section */}
      <section className="py-24 px-6 border-t border-white/5 blueprint-grid">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Technical Specifications</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-medium tracking-tight">The Blueprint</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'Foundation',
                subtitle: `${pizza.fermentation_time} Dough`,
                specs: [
                  { key: 'hydration', value: pizza.hydration },
                  { key: 'fermentation', value: pizza.fermentation_time },
                  { key: 'flour', value: 'Caputo Tipo 00' },
                  { key: 'crust', value: pizza.crust_type },
                ],
              },
              {
                number: '02',
                title: 'Structure',
                subtitle: pizza.pizza_toppings.find(t => t.category === 'cheese')?.name || 'Cheese Blend',
                specs: pizza.pizza_toppings
                  .filter(t => t.category === 'cheese')
                  .map((t, i) => ({
                    key: i === 0 ? 'primary' : 'blend',
                    value: t.name
                  }))
                  .concat(
                    // Fallback if no cheese found
                    !pizza.pizza_toppings.some(t => t.category === 'cheese')
                      ? [{ key: 'cheese', value: 'House Mozzarella' }]
                      : []
                  )
                  .slice(0, 4),
              },
              {
                number: '03',
                title: 'Finish',
                subtitle: 'Toppings & Finish',
                specs: pizza.pizza_toppings
                  .filter(t => ['base', 'topping', 'finish'].includes(t.category))
                  .slice(0, 4)
                  .map(t => ({
                    key: t.category,
                    value: t.name
                  })),
              },
            ].map((card, index) => (
              <motion.article
                key={card.number}
                className="glass-card glass-card-hover p-6 md:p-8 relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="corner-accent corner-accent-tl" />
                <div className="corner-accent corner-accent-br" />

                <span className="font-mono text-4xl text-white/10">{card.number}</span>
                <h3 className="mt-4 text-xl font-medium">{card.title}</h3>
                <p className="mt-1 text-sm text-matcha">{card.subtitle}</p>

                <ul className="mt-6 space-y-2">
                  {card.specs.map((spec, i) => (
                    <li key={i} className="spec-row">
                      <span className="spec-key">{spec.key}</span>
                      <span className="spec-value">{spec.value}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Batch Status Section */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Production Status</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-medium tracking-tight">Today&apos;s Build</h2>
          </motion.div>

          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <BatchProgress current={pizza.current_batch} max={pizza.max_batch} />

            <div className="mt-8 text-center">
              <Link href="/order">
                <motion.button
                  className="relative px-10 py-4 font-mono text-sm uppercase tracking-widest border border-matcha text-matcha overflow-hidden group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-matcha"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <span className="relative z-20 mix-blend-difference text-matcha">
                    Reserve Your Unit
                  </span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-white/5 blueprint-grid">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Critical Reception</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-display font-medium tracking-tight">The Critique</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'A masterclass in restraint. Every element serves the whole.',
                cite: 'The Food Architect',
              },
              {
                quote: "They've deconstructed pizza and rebuilt it as sculpture.",
                cite: 'Culinary Review',
              },
              {
                quote: 'The negative space between toppings speaks volumes.',
                cite: 'Minimalist Dining',
              },
            ].map((testimonial, index) => (
              <motion.blockquote
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <p className="text-lg text-grey italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <cite className="mt-4 block font-mono text-xs uppercase tracking-wider text-grey-dark not-italic">
                  — {testimonial.cite}
                </cite>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-forest">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight">Today&apos;s Architecture</h2>
          <p className="mt-4 text-grey">Limited batch. Precision crafted. Available now.</p>

          <div className="mt-8">
            <Link href="/order">
              <motion.button
                className="relative px-10 py-4 font-mono text-sm uppercase tracking-widest bg-white text-black overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Find Today&apos;s Batch
              </motion.button>
            </Link>
          </div>

          <p className="mt-8 font-mono text-xs text-grey-dark uppercase tracking-wider">
            Chicago, IL
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-mono text-sm text-grey-dark">
            FRAME © {new Date().getFullYear()}
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="font-mono text-xs text-grey-dark hover:text-white transition-colors">
              Instagram
            </a>
            <a href="#" className="font-mono text-xs text-grey-dark hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
