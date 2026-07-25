import { DISTRICTS } from './data.js';

/**
 * UI controller: district info cards, nav dots, progress bar, toggle button
 */

const elements = {
  container: document.getElementById('ui-overlay'),
  eyebrow: document.getElementById('section-eyebrow'),
  title: document.getElementById('section-title'),
  desc: document.getElementById('section-description'),
  tags: document.getElementById('section-tags'),
  progress: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  loader: document.getElementById('loader'),
  loaderBar: document.getElementById('loader-bar'),
  navDots: document.querySelectorAll('.nav-dot'),
  toggle: document.getElementById('mode-toggle'),
};

let modeToggleCallback = null;
let lastIndex = -1;
let isVisible = false;

export function initUI() {
  elements.container.classList.add('visible');
  setTimeout(() => { isVisible = true; }, 300);

  // Nav dot clicks
  elements.navDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const target = parseInt(dot.dataset.index);
      if (!isNaN(target) && target >= 0 && target < DISTRICTS.length) {
        // Set hash and let ScrollTrigger handle it
        window.location.hash = `district-${target}`;
      }
    });
  });

  // Toggle button — just calls the main mode-switcher
  if (elements.toggle) {
    elements.toggle.addEventListener('click', () => {
      if (modeToggleCallback) modeToggleCallback();
    });
  }

  // Keyboard shortcut: T toggles mode
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      if (elements.toggle) elements.toggle.click();
    }
  });
}

export function onModeToggle(cb) {
  modeToggleCallback = cb;
}

export function updateProgress(progress) {
  const pct = Math.round(progress * 100);
  if (elements.progress) elements.progress.style.width = `${pct}%`;
  if (elements.progressText) elements.progressText.textContent = `${pct}%`;
}

export function updateLoaderProgress(val) {
  if (elements.loaderBar) elements.loaderBar.style.width = `${Math.round(val * 100)}%`;
}

export function hideLoader() {
  if (elements.loader) {
    elements.loader.style.opacity = '0';
    setTimeout(() => { elements.loader.style.display = 'none'; }, 600);
  }
}

export function checkAndUpdateDistrict(currentIndex) {
  if (currentIndex === lastIndex || currentIndex < 0) return;
  lastIndex = currentIndex;

  const d = DISTRICTS[currentIndex];
  if (!d) return;

  // Update info
  if (elements.eyebrow) elements.eyebrow.textContent = d.eyebrow;
  if (elements.title) elements.title.textContent = d.title;
  if (elements.desc) elements.desc.textContent = d.desc;

  if (elements.tags) {
    elements.tags.innerHTML = d.tags.map(t => `<span>${t}</span>`).join('');
  }

  // Color hint
  const color = d.colorNight || '#ffffff';
  document.documentElement.style.setProperty('--accent-color', color);

  // Active nav dot
  elements.navDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });

  // Animate in
  if (elements.container) {
    elements.container.classList.remove('info-enter');
    void elements.container.offsetWidth;
    elements.container.classList.add('info-enter');
  }
}
