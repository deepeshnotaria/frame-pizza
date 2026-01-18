/**
 * Effects Module
 * Section reveal animations and CTA interactions
 */

/**
 * Initialize section reveal animations using GSAP ScrollTrigger
 */
function initSectionAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Blueprint cards stagger animation
    const blueprintCards = document.querySelectorAll('.blueprint__card');
    if (blueprintCards.length) {
        gsap.from(blueprintCards, {
            y: 60,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.blueprint',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // Blueprint header animation
    const blueprintHeader = document.querySelector('.blueprint__header');
    if (blueprintHeader) {
        gsap.from(blueprintHeader, {
            y: 40,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.blueprint',
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // Critique quotes animation
    const critiqueQuotes = document.querySelectorAll('.critique__quote');
    if (critiqueQuotes.length) {
        gsap.from(critiqueQuotes, {
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.critique',
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // Critique header animation
    const critiqueHeader = document.querySelector('.critique__header');
    if (critiqueHeader) {
        gsap.from(critiqueHeader, {
            y: 30,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.critique',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // Acquisition section animation
    const acquisitionContent = document.querySelector('.acquisition__content');
    if (acquisitionContent) {
        gsap.from(acquisitionContent, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.acquisition',
                start: 'top 70%',
                toggleActions: 'play none none reverse'
            }
        });
    }

    // Header CTA fade out when reaching acquisition section
    const headerCta = document.querySelector('.header__cta');
    const acquisitionSection = document.querySelector('.acquisition');
    if (headerCta && acquisitionSection) {
        ScrollTrigger.create({
            trigger: acquisitionSection,
            start: 'top bottom',
            onEnter: () => {
                gsap.to(headerCta, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
                headerCta.style.pointerEvents = 'none';
            },
            onLeaveBack: () => {
                gsap.to(headerCta, {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
                headerCta.style.pointerEvents = 'auto';
            }
        });
    }
}

/**
 * Initialize CTA button interactions
 */
function initCTAInteractions() {
    const button = document.getElementById('cta-button');
    if (!button) return;

    button.addEventListener('click', () => {
        // Placeholder action - could open modal, navigate, etc.
        console.log('CTA clicked - Find Today\'s Batch');

        // Example: Scroll to top or show a modal
        // window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Export functions
window.initSectionAnimations = initSectionAnimations;
window.initCTAInteractions = initCTAInteractions;
window.initSmoothScroll = initSmoothScroll;
