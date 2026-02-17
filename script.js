const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const navLinks = document.querySelectorAll('#main-nav a');
const tabTriggers = document.querySelectorAll('[data-tab-target]');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('[data-tab-panel]');
const tabsSection = document.querySelector('#tabs');
const siteHeader = document.querySelector('.site-header');
const mainContent = document.querySelector('main');
const aboutSection = document.querySelector('.about');
let isContentFrozen = false;
const mainFreezeSpacer = document.createElement('div');
mainFreezeSpacer.setAttribute('aria-hidden', 'true');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function activateTab(tabName) {
  tabPanels.forEach((panel) => {
    const isMatch = panel.dataset.tabPanel === tabName;
    panel.classList.toggle('is-active', isMatch);
  });

  tabButtons.forEach((button) => {
    const isMatch = button.dataset.tabTarget === tabName;
    button.classList.toggle('is-active', isMatch);
    button.setAttribute('aria-selected', String(isMatch));
  });

  navLinks.forEach((link) => {
    const isMatch = link.dataset.tabTarget === tabName;
    link.classList.toggle('is-active', isMatch);
  });
}

tabTriggers.forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    const tabName = trigger.dataset.tabTarget;

    if (!tabName) {
      return;
    }

    activateTab(tabName);

    if (tabsSection && !trigger.classList.contains('tab-btn')) {
      tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (mainNav && menuToggle) {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

activateTab('galerie');

const sectionsToReveal = document.querySelectorAll('.section, .hero');

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  },
  {
    threshold: 0.12
  }
);

sectionsToReveal.forEach((section) => {
  section.classList.add('reveal');
  observer.observe(section);
});

const yearSpan = document.querySelector('#year');
if (yearSpan) {
  yearSpan.textContent = String(new Date().getFullYear());
}

function syncHeaderHeight() {
  if (!siteHeader) {
    return;
  }

  const headerHeight = siteHeader.offsetHeight;
  document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
}

syncHeaderHeight();
window.addEventListener('resize', syncHeaderHeight, { passive: true });

function toggleFooterReveal() {
  const scrollTop = window.scrollY || window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScrollTop = Math.max(0, docHeight - viewportHeight);
  const revealDistance = Math.max(260, Math.round(viewportHeight * 0.85));
  const revealStart = Math.max(0, maxScrollTop - revealDistance);
  const freezeStart = aboutSection
    ? Math.max(0, aboutSection.offsetTop - viewportHeight * 0.5)
    : revealStart;
  const rawProgress = (scrollTop - revealStart) / revealDistance;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const shouldFreeze = scrollTop >= freezeStart;

  if (mainContent) {
    if (shouldFreeze && !isContentFrozen) {
      const mainTop = mainContent.getBoundingClientRect().top;
      const mainRect = mainContent.getBoundingClientRect();
      const freezeOffset = 28;
      const frozenTop = mainTop - freezeOffset;

      document.documentElement.style.setProperty('--main-freeze-top', `${frozenTop.toFixed(2)}px`);
      document.documentElement.style.setProperty('--main-freeze-width', `${mainRect.width.toFixed(2)}px`);

      mainFreezeSpacer.style.height = `${mainContent.offsetHeight}px`;
      if (!mainFreezeSpacer.isConnected && mainContent.parentNode) {
        mainContent.parentNode.insertBefore(mainFreezeSpacer, mainContent.nextSibling);
      }

      document.body.classList.add('content-frozen');
      isContentFrozen = true;
    } else if (!shouldFreeze && isContentFrozen) {
      document.body.classList.remove('content-frozen');
      document.documentElement.style.removeProperty('--main-freeze-top');
      document.documentElement.style.removeProperty('--main-freeze-width');
      if (mainFreezeSpacer.isConnected) {
        mainFreezeSpacer.remove();
      }
      isContentFrozen = false;
    }
  }

  document.documentElement.style.setProperty('--footer-progress', progress.toFixed(3));
  document.body.classList.toggle('footer-revealing', progress > 0);
  document.body.classList.toggle('footer-visible', progress >= 0.995);
}

window.addEventListener('scroll', toggleFooterReveal, { passive: true });
window.addEventListener('resize', toggleFooterReveal, { passive: true });
toggleFooterReveal();

const bgBirds = document.querySelectorAll('.bg-bird');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (bgBirds.length > 0 && !reduceMotionQuery.matches) {
  let ticking = false;

  function updateBirdParallax() {
    const scrollY = window.scrollY || window.pageYOffset;

    bgBirds.forEach((bird) => {
      const speedX = Number(bird.dataset.sx || 0);
      const speedY = Number(bird.dataset.sy || 0);
      const offsetX = scrollY * speedX;
      const offsetY = scrollY * speedY;

      bird.style.setProperty('--scroll-x', `${offsetX.toFixed(2)}px`);
      bird.style.setProperty('--scroll-y', `${offsetY.toFixed(2)}px`);
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateBirdParallax);
      ticking = true;
    }
  }, { passive: true });

  updateBirdParallax();
}

const heroVisual = document.querySelector('.hero-visual');
const galleryItems = document.querySelectorAll('.gallery-item');
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let cachedHeroColor = null;
const galleryColorCache = new WeakMap();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(r, g, b) {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rNorm:
        h = 60 * (((gNorm - bNorm) / delta) % 6);
        break;
      case gNorm:
        h = 60 * ((bNorm - rNorm) / delta + 2);
        break;
      default:
        h = 60 * ((rNorm - gNorm) / delta + 4);
        break;
    }
  }

  return {
    h: Math.round((h + 360) % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function applyAccentFromColor(rgbColor) {
  const isDarkMode = colorSchemeQuery.matches;
  const hsl = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);
  const accentHue = hsl.h;
  const accentSat = clamp(hsl.s + 10, 50, 82);
  const accentLight = isDarkMode ? clamp(hsl.l + 10, 52, 66) : clamp(hsl.l - 10, 36, 48);
  const accent2Light = isDarkMode ? clamp(hsl.l + 28, 72, 84) : clamp(hsl.l - 22, 22, 34);
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty('--accent', `hsl(${accentHue}, ${accentSat}%, ${accentLight}%)`);
  rootStyle.setProperty('--accent-2', `hsl(${accentHue}, ${accentSat}%, ${accent2Light}%)`);
}

function getHeroImageUrl() {
  if (!heroVisual) {
    return null;
  }

  const backgroundImage = window.getComputedStyle(heroVisual).backgroundImage;
  const urlMatches = [...backgroundImage.matchAll(/url\((['"]?)(.*?)\1\)/g)];

  if (urlMatches.length === 0) {
    return null;
  }

  const imageUrl = urlMatches[urlMatches.length - 1][2];
  return new URL(imageUrl, window.location.href).href;
}

function parseUrlFromCssValue(cssValue) {
  const match = cssValue.match(/url\((['"]?)(.*?)\1\)/);
  if (!match) {
    return null;
  }

  return new URL(match[2], window.location.href).href;
}

function getDominantColorFromImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.crossOrigin = 'anonymous';

    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (!context) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      const sampleSize = 48;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      context.drawImage(image, 0, 0, sampleSize, sampleSize);

      const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
      let redWeighted = 0;
      let greenWeighted = 0;
      let blueWeighted = 0;
      let weightSum = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 160) {
          continue;
        }

        const hsl = rgbToHsl(r, g, b);
        const lightnessWeight = 1 - Math.abs(hsl.l - 50) / 50;
        const saturationWeight = Math.max(0.15, hsl.s / 100);
        const weight = saturationWeight * lightnessWeight;

        redWeighted += r * weight;
        greenWeighted += g * weight;
        blueWeighted += b * weight;
        weightSum += weight;
      }

      if (weightSum === 0) {
        reject(new Error('No usable pixels found'));
        return;
      }

      resolve({
        r: Math.round(redWeighted / weightSum),
        g: Math.round(greenWeighted / weightSum),
        b: Math.round(blueWeighted / weightSum)
      });
    });

    image.addEventListener('error', () => {
      reject(new Error('Unable to load hero image'));
    });

    image.src = url;
  });
}

async function syncAccentWithHeroVisual() {
  const heroImageUrl = getHeroImageUrl();

  if (!heroImageUrl) {
    return;
  }

  try {
    cachedHeroColor = await getDominantColorFromImage(heroImageUrl);
    applyAccentFromColor(cachedHeroColor);
  } catch (error) {
    // Keep CSS fallback accent colors when color extraction fails.
  }
}

function applyGalleryShadowFromColor(item, rgbColor) {
  const isDarkMode = colorSchemeQuery.matches;
  const hsl = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);
  const shadowAlpha = isDarkMode ? 0.4 : 0.34;
  const shadowSpread = isDarkMode ? '0 18px 40px' : '0 16px 34px';
  const shadowSat = clamp(hsl.s + 8, 45, 90);
  const shadowLight = isDarkMode ? clamp(hsl.l + 4, 34, 62) : clamp(hsl.l - 6, 24, 48);

  item.style.setProperty(
    '--gallery-shadow',
    `${shadowSpread} hsl(${hsl.h} ${shadowSat}% ${shadowLight}% / ${shadowAlpha})`
  );
}

async function syncGalleryShadows() {
  if (galleryItems.length === 0) {
    return;
  }

  const tasks = [...galleryItems].map(async (item) => {
    const imageVar = window.getComputedStyle(item).getPropertyValue('--gallery-image').trim();
    const imageUrl = parseUrlFromCssValue(imageVar);

    if (!imageUrl) {
      return;
    }

    try {
      const rgbColor = await getDominantColorFromImage(imageUrl);
      galleryColorCache.set(item, rgbColor);
      applyGalleryShadowFromColor(item, rgbColor);
    } catch (error) {
      // Keep CSS fallback shadow when color extraction fails.
    }
  });

  await Promise.all(tasks);
}

if (heroVisual) {
  syncAccentWithHeroVisual();
  colorSchemeQuery.addEventListener('change', () => {
    if (!cachedHeroColor) {
      return;
    }

    applyAccentFromColor(cachedHeroColor);
  });
}

if (galleryItems.length > 0) {
  syncGalleryShadows();
  colorSchemeQuery.addEventListener('change', () => {
    galleryItems.forEach((item) => {
      const cachedColor = galleryColorCache.get(item);
      if (!cachedColor) {
        return;
      }

      applyGalleryShadowFromColor(item, cachedColor);
    });
  });
}
