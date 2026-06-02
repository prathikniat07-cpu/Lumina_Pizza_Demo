/**
 * Slice of Art - Pizza Animated Website
 * Main JavaScript Controller
 */

// --- CONFIGURATION ---
const TOTAL_FRAMES = 240;
const framesArray = [];
let loadedCount = 0;

// Canvas details
const canvas = document.getElementById('pizza-canvas');
const ctx = canvas.getContext('2d');

// Scroll Damping / Interpolation Variables
let targetFrame = 1;
let currentFrame = 1;
const damping = 0.08; // Damping constant (inertia factor)

// --- ELEMENTS ---
const preloader = document.getElementById('preloader');
const loadProgress = document.getElementById('load-progress');
const loadPercentage = document.getElementById('load-percentage');
const scrollContainer = document.getElementById('scroll-narrative');
const heroScrollText = document.getElementById('hero-scroll-text');

// --- PRELOADING SYSTEM ---
function initPreloader() {
  // Preload all 240 frames
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const frameNum = String(i).padStart(3, '0');
    // Vite serves files from public/ directly as relative root paths
    img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
    
    img.onload = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      loadProgress.style.width = `${progress}%`;
      loadPercentage.textContent = `${progress}%`;
      
      if (loadedCount === TOTAL_FRAMES) {
        onAllAssetsLoaded();
      }
    };
    
    img.onerror = () => {
      // Gracefully handle errors (like a missing frame) to avoid breaking the site
      console.warn(`Failed to load frame ${i}`);
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onAllAssetsLoaded();
      }
    };
    
    framesArray.push(img);
  }
}

function onAllAssetsLoaded() {
  // Hide preloader with a smooth fade
  setTimeout(() => {
    preloader.classList.add('fade-out');
    document.body.style.overflow = 'visible';
    
    // Set up canvas sizes and draw first frame
    resizeCanvas(canvas);
    drawFrame(1, canvas, ctx);
    
    // Run animation loops
    requestAnimationFrame(renderLoop);
    updateScrollStates();
  }, 600);
}

// --- CANVAS DRAWING UTILITIES ---
function resizeCanvas(c) {
  // Read CSS layout width/height
  const rect = c.parentElement.getBoundingClientRect();
  
  // Set canvas buffer sizes (use high DPI scale)
  const dpr = window.devicePixelRatio || 1;
  c.width = rect.width * dpr;
  c.height = rect.height * dpr;
  
  // Scale back context
  const context = c.getContext('2d');
  context.scale(dpr, dpr);
}

// Draw frame on canvas maintaining 'cover' aspect ratio
// Crops out the Veo watermark from the bottom-right corner of source frames
function drawFrame(frameIndex, c, context) {
  const imgIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameIndex))) - 1;
  const img = framesArray[imgIndex];
  
  if (!img || !img.complete) return;
  
  const rect = c.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  // Clear previous frame
  context.clearRect(0, 0, width, height);
  
  // Crop source image to exclude the Veo watermark (bottom-right corner)
  // Remove ~10% from right and ~8% from bottom of the source image
  const cropRight = 0.10;
  const cropBottom = 0.08;
  const srcW = img.width * (1 - cropRight);
  const srcH = img.height * (1 - cropBottom);
  
  // Use the cropped source dimensions for aspect ratio calculation
  const imgRatio = srcW / srcH;
  const canvasRatio = width / height;
  
  let drawWidth, drawHeight, x, y;
  
  if (imgRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = height * imgRatio;
  } else {
    drawWidth = width;
    drawHeight = width / imgRatio;
  }
  
  x = (width - drawWidth) / 2;
  y = (height - drawHeight) / 2;
  
  // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  // Source: crop from top-left, excluding right and bottom watermark areas
  context.drawImage(img, 0, 0, srcW, srcH, x, y, drawWidth, drawHeight);
}

// --- ANIMATION LOOP (DAMPING / INTERPOLATION) ---
function renderLoop() {
  // If current frame hasn't caught up to target frame, interpolate
  if (Math.abs(targetFrame - currentFrame) > 0.05) {
    currentFrame += (targetFrame - currentFrame) * damping;
    drawFrame(currentFrame, canvas, ctx);
  }
  
  requestAnimationFrame(renderLoop);
}

// --- SCROLL MANAGEMENT ENGINE ---
function handleScroll() {
  const containerTop = scrollContainer.offsetTop;
  const containerHeight = scrollContainer.offsetHeight;
  const viewHeight = window.innerHeight;
  
  // Calculate relative progress inside the scrolling container
  let progress = (window.pageYOffset - containerTop) / (containerHeight - viewHeight);
  progress = Math.max(0, Math.min(1, progress));
  
  // Map scroll progress to our 240 frames
  targetFrame = 1 + progress * (TOTAL_FRAMES - 1);
  
  // Fade out hero scroll text within the first 30% of the scroll
  if (heroScrollText) {
    const textProgress = Math.min(1, progress / 0.3); // 0 to 1 as progress goes 0 to 30%
    const opacity = 1 - textProgress;
    const translateY = -40 * textProgress; // Move up slightly
    
    heroScrollText.style.opacity = opacity;
    heroScrollText.style.transform = `translateY(${translateY}px)`;
    
    if (opacity <= 0) {
      heroScrollText.style.visibility = 'hidden';
    } else {
      heroScrollText.style.visibility = 'visible';
    }
  }
}

function updateScrollStates() {
  handleScroll();
}

// --- EVENT LISTENERS ---
window.addEventListener('scroll', handleScroll);

window.addEventListener('resize', () => {
  resizeCanvas(canvas);
  drawFrame(currentFrame, canvas, ctx);
});

// Start preloading frames immediately
initPreloader();
