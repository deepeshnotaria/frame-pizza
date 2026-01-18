/**
 * Frame Pizza - Main Application Entry
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize preloader UI
    const preloaderUI = initPreloaderUI();

    // Create frame preloader
    const preloader = new FramePreloader({
        frameCount: 240,
        framePattern: 'images/ezgif-frame-{index}.jpg',
        onProgress: (progress) => {
            preloaderUI.updateProgress(progress);
        },
        onComplete: (images) => {
            const validFrames = images.filter(img => img !== null).length;
            console.log(`Loaded ${validFrames}/${images.length} frames`);
        }
    });

    try {
        // Preload all frames
        const images = await preloader.preload();

        // Small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));

        // Hide preloader with animation
        preloaderUI.hide();

        // Initialize scroll animation
        const canvas = document.getElementById('hero-canvas');
        const container = document.getElementById('hero');

        if (canvas && container && images.some(img => img !== null)) {
            new ScrollFrameAnimation({
                canvas,
                container,
                images
            });
        }

        // Initialize section reveal animations
        initSectionAnimations();

        // Initialize CTA interactions
        initCTAInteractions();

        // Initialize smooth scroll
        initSmoothScroll();

        console.log('Frame Pizza initialized successfully');

    } catch (error) {
        console.error('Failed to initialize:', error);

        // Hide preloader even on error
        preloaderUI.hide();
    }
});
