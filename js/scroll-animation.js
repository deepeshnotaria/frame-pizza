/**
 * Scroll-driven Frame Animation Controller
 * Uses GSAP ScrollTrigger for smooth frame sequencing
 */
class ScrollFrameAnimation {
    constructor(options = {}) {
        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.images = options.images || [];
        this.container = options.container;
        this.currentFrame = 0;

        // Performance optimization
        this.pendingFrame = null;
        this.lastDrawnFrame = -1;

        this.init();
    }

    init() {
        // Set canvas dimensions based on first valid image
        const firstImage = this.images.find(img => img !== null);
        if (firstImage) {
            this.setCanvasSize(firstImage);
        }

        // Handle window resize
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        // Initial draw
        this.drawFrame(0);

        // Setup GSAP ScrollTrigger
        this.setupScrollTrigger();
    }

    setCanvasSize(img) {
        if (!img) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imgAspect = img.width / img.height;
        const viewportAspect = viewportWidth / viewportHeight;

        let displayWidth, displayHeight;

        if (imgAspect > viewportAspect) {
            // Image is wider than viewport
            displayWidth = viewportWidth * 0.9;
            displayHeight = displayWidth / imgAspect;
        } else {
            // Image is taller than viewport
            displayHeight = viewportHeight * 0.85;
            displayWidth = displayHeight * imgAspect;
        }

        // Set internal resolution
        this.canvas.width = img.width;
        this.canvas.height = img.height;

        // Set display size
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
    }

    handleResize() {
        const firstImage = this.images.find(img => img !== null);
        if (firstImage) {
            this.setCanvasSize(firstImage);
            // Force redraw
            this.lastDrawnFrame = -1;
            this.drawFrame(this.currentFrame);
        }
    }

    drawFrame(frameIndex) {
        frameIndex = Math.max(0, Math.min(frameIndex, this.images.length - 1));

        // Skip if same frame or invalid
        if (frameIndex === this.lastDrawnFrame) return;

        const img = this.images[frameIndex];
        if (!img) return;

        // Cancel pending frame if exists
        if (this.pendingFrame) {
            cancelAnimationFrame(this.pendingFrame);
        }

        // Use RAF for smooth rendering
        this.pendingFrame = requestAnimationFrame(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            this.lastDrawnFrame = frameIndex;
            this.pendingFrame = null;
        });
    }

    setupScrollTrigger() {
        gsap.registerPlugin(ScrollTrigger);

        const frameCount = this.images.length;

        // Main scroll animation for frames
        gsap.to(this, {
            currentFrame: frameCount - 1,
            ease: 'none',
            scrollTrigger: {
                trigger: this.container,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.5,
                onUpdate: (self) => {
                    const frame = Math.round(self.progress * (frameCount - 1));
                    this.drawFrame(frame);
                }
            }
        });

        // Hero title fade animation
        const heroTitle = document.querySelector('.hero__title');
        const heroTagline = document.querySelector('.hero__tagline');
        const scrollHint = document.querySelector('.hero__scroll-hint');

        if (heroTitle) {
            gsap.to(heroTitle, {
                opacity: 0,
                y: -60,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: this.container,
                    start: 'top top',
                    end: '60% top',
                    scrub: true
                }
            });
        }

        if (heroTagline) {
            gsap.to(heroTagline, {
                opacity: 0,
                y: -40,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: this.container,
                    start: 'top top',
                    end: '50% top',
                    scrub: true
                }
            });
        }

        if (scrollHint) {
            gsap.to(scrollHint, {
                opacity: 0,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: this.container,
                    start: 'top top',
                    end: '5% top',
                    scrub: true
                }
            });
        }
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        if (this.pendingFrame) {
            cancelAnimationFrame(this.pendingFrame);
        }
    }
}

window.ScrollFrameAnimation = ScrollFrameAnimation;
