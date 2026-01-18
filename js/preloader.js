/**
 * Frame Preloader
 * Preloads all 240 frames and shows loading progress
 */
class FramePreloader {
    constructor(options = {}) {
        this.frameCount = options.frameCount || 240;
        this.framePattern = options.framePattern || 'images/ezgif-frame-{index}.jpg';
        this.onProgress = options.onProgress || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.images = [];
        this.loaded = 0;
    }

    /**
     * Generate frame path from index (1-indexed, zero-padded to 3 digits)
     */
    getFramePath(index) {
        const paddedIndex = String(index).padStart(3, '0');
        return this.framePattern.replace('{index}', paddedIndex);
    }

    /**
     * Preload all frames
     * @returns {Promise<HTMLImageElement[]>}
     */
    async preload() {
        const promises = [];

        for (let i = 1; i <= this.frameCount; i++) {
            const promise = this.loadImage(i);
            promises.push(promise);
        }

        await Promise.all(promises);
        this.onComplete(this.images);
        return this.images;
    }

    /**
     * Load a single image
     */
    loadImage(index) {
        return new Promise((resolve) => {
            const img = new Image();

            img.onload = () => {
                this.images[index - 1] = img;
                this.loaded++;
                const progress = this.loaded / this.frameCount;
                this.onProgress(progress, this.loaded, this.frameCount);
                resolve(img);
            };

            img.onerror = () => {
                console.warn(`Failed to load frame ${index}`);
                this.loaded++;
                const progress = this.loaded / this.frameCount;
                this.onProgress(progress, this.loaded, this.frameCount);
                resolve(null);
            };

            img.src = this.getFramePath(index);
        });
    }
}

/**
 * Initialize preloader UI elements
 */
function initPreloaderUI() {
    const preloader = document.getElementById('preloader');
    const progressBar = preloader?.querySelector('.preloader__bar');
    const percentText = preloader?.querySelector('.preloader__percent');

    return {
        updateProgress(progress) {
            if (progressBar) {
                progressBar.style.width = `${progress * 100}%`;
            }
            if (percentText) {
                percentText.textContent = `${Math.round(progress * 100)}%`;
            }
        },
        hide() {
            if (preloader) {
                preloader.classList.add('preloader--hidden');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 600);
            }
        }
    };
}

// Export for use in main.js
window.FramePreloader = FramePreloader;
window.initPreloaderUI = initPreloaderUI;
