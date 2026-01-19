'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const FRAME_COUNT = 240
const FRAME_PATTERN = '/images/ezgif-frame-{index}.jpg'

function getFramePath(index: number): string {
  const paddedIndex = String(index).padStart(3, '0')
  return FRAME_PATTERN.replace('{index}', paddedIndex)
}

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([])
  const currentFrameRef = useRef(0)
  const lastDrawnFrameRef = useRef(-1)
  const pendingFrameRef = useRef<number | null>(null)

  // Draw a specific frame to canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    frameIndex = Math.max(0, Math.min(frameIndex, imagesRef.current.length - 1))

    // Skip if same frame
    if (frameIndex === lastDrawnFrameRef.current) return

    const img = imagesRef.current[frameIndex]
    if (!img) return

    // Cancel pending frame
    if (pendingFrameRef.current) {
      cancelAnimationFrame(pendingFrameRef.current)
    }

    // Use RAF for smooth rendering
    pendingFrameRef.current = requestAnimationFrame(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      lastDrawnFrameRef.current = frameIndex
      pendingFrameRef.current = null
    })
  }, [])

  // Set canvas size based on image dimensions
  const setCanvasSize = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas || !img) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const imgAspect = img.width / img.height
    const viewportAspect = viewportWidth / viewportHeight

    let displayWidth: number
    let displayHeight: number

    if (imgAspect > viewportAspect) {
      displayWidth = viewportWidth * 0.9
      displayHeight = displayWidth / imgAspect
    } else {
      displayHeight = viewportHeight * 0.85
      displayWidth = displayHeight * imgAspect
    }

    // Set internal resolution
    canvas.width = img.width
    canvas.height = img.height

    // Set display size
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
  }, [])

  // Preload all images
  useEffect(() => {
    let isMounted = true
    const images: (HTMLImageElement | null)[] = []

    const loadImage = (index: number): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image()

        img.onload = () => {
          if (isMounted) {
            images[index - 1] = img
            setLoadProgress((prev) => {
              const newProgress = Math.min(prev + (1 / FRAME_COUNT), 1)
              return newProgress
            })
          }
          resolve(img)
        }

        img.onerror = () => {
          console.warn(`Failed to load frame ${index}`)
          if (isMounted) {
            setLoadProgress((prev) => Math.min(prev + (1 / FRAME_COUNT), 1))
          }
          resolve(null)
        }

        img.src = getFramePath(index)
      })
    }

    const preloadAll = async () => {
      const promises = []
      for (let i = 1; i <= FRAME_COUNT; i++) {
        promises.push(loadImage(i))
      }
      await Promise.all(promises)

      if (isMounted) {
        imagesRef.current = images

        // Set initial canvas size
        const firstImage = images.find((img) => img !== null)
        if (firstImage) {
          setCanvasSize(firstImage)
          drawFrame(0)
        }

        setIsLoading(false)
      }
    }

    preloadAll()

    return () => {
      isMounted = false
    }
  }, [setCanvasSize, drawFrame])

  // Setup scroll animations after loading
  useEffect(() => {
    if (isLoading || !containerRef.current) return

    const container = containerRef.current
    const frameCount = imagesRef.current.length

    // Main scroll animation for frames
    const scrollTween = gsap.to(currentFrameRef, {
      current: frameCount - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          const frame = Math.round(self.progress * (frameCount - 1))
          drawFrame(frame)
        },
      },
    })

    // Hero title fade animation
    const heroTitle = container.querySelector('.hero__title')
    const heroTagline = container.querySelector('.hero__tagline')
    const scrollHint = container.querySelector('.hero__scroll-hint')

    const titleTween = heroTitle && gsap.to(heroTitle, {
      opacity: 0,
      y: -60,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '60% top',
        scrub: true,
      },
    })

    const taglineTween = heroTagline && gsap.to(heroTagline, {
      opacity: 0,
      y: -40,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '50% top',
        scrub: true,
      },
    })

    const scrollHintTween = scrollHint && gsap.to(scrollHint, {
      opacity: 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '5% top',
        scrub: true,
      },
    })

    // Handle resize
    const handleResize = () => {
      const firstImage = imagesRef.current.find((img) => img !== null)
      if (firstImage) {
        setCanvasSize(firstImage)
        lastDrawnFrameRef.current = -1
        drawFrame(currentFrameRef.current)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      scrollTween.kill()
      titleTween?.kill()
      taglineTween?.kill()
      scrollHintTween?.kill()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [isLoading, drawFrame, setCanvasSize])

  return (
    <>
      {/* Preloader */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[1000] bg-black flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-center">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-grey-dark block mb-6">
                Loading
              </span>
              <div className="w-48 h-px bg-white/10 relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-matcha"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadProgress * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <span className="font-mono text-sm text-white mt-4 block">
                {Math.round(loadProgress * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section
        ref={containerRef}
        className="relative h-[200vh]"
      >
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-black">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="hero__canvas absolute z-10"
          />

          {/* Inverted Text Overlay - uses mix-blend-difference for knockout effect */}
          <div className="hero__content absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="hero__title font-display text-[clamp(4rem,3rem+8vw,12rem)] font-semibold tracking-[-0.02em] text-white mix-blend-difference">
              FRAME
            </h1>
            <p className="hero__tagline mt-4 text-xl md:text-2xl text-white font-light tracking-[0.2em] uppercase mix-blend-difference">
              The Architecture of Pizza
            </p>
          </div>

          {/* Subtle border frame around text */}
          <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
            <div className="relative w-[80vw] max-w-4xl h-[40vh] border border-white/10 mix-blend-difference" />
          </div>

          {/* Scroll Hint */}
          <div className="hero__scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 z-20 mix-blend-difference">
            <motion.div
              className="flex flex-col items-center gap-3"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white">
                Scroll
              </span>
              <div className="w-px h-8 bg-white/50" />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
