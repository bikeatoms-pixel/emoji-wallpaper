/**
 * Emoji Asset & SVG Service
 * Fetches monochrome SVG paths dynamically on-demand from jsDelivr CDN
 * and recolors them before drawing to canvas.
 * Caches both raw SVG strings and recolored HTMLImageElements in memory.
 */

// In-memory cache of raw SVG text by hex key
const rawSvgCache = new Map<string, string>();

// In-memory cache of HTMLImageElements by key: `${emojiHex}_${outlineColor}`
const imageCache = new Map<string, HTMLImageElement>();

// Loading promises to avoid duplicate simultaneous fetches
const pendingFetches = new Map<string, Promise<string | null>>();

// Listeners to trigger redraws when an image finishes loading asynchronously
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeEmojiAssetUpdate(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Debounced notify to prevent micro-render cascading loops
let notifyRafId: number | null = null;
function notifyAssetLoaded() {
  if (notifyRafId !== null) return;
  notifyRafId = requestAnimationFrame(() => {
    notifyRafId = null;
    listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in asset listener:', e);
      }
    });
  });
}

/**
 * Convert an emoji string into candidate uppercase hex codes for OpenMoji.
 * e.g. "😀" -> ["1F600"]
 * e.g. "❤️" -> ["2764", "2764-FE0F"]
 */
export function emojiToHexCandidates(emoji: string): string[] {
  if (!emoji) return [];
  const codePoints: number[] = [];
  for (let i = 0; i < emoji.length; i++) {
    const code = emoji.codePointAt(i);
    if (code !== undefined) {
      codePoints.push(code);
      if (code > 0xffff) {
        i++; // skip second surrogate
      }
    }
  }

  // Candidate 1: Strip variation selectors (FE0F, FE0E) - OpenMoji standard
  const filtered = codePoints.filter((cp) => cp !== 0xfe0f && cp !== 0xfe0e);
  const candNoVs = filtered.map((cp) => cp.toString(16).toUpperCase()).join('-');
  const candFull = codePoints.map((cp) => cp.toString(16).toUpperCase()).join('-');

  if (candNoVs === candFull) {
    return [candNoVs];
  }
  return [candNoVs, candFull];
}

/**
 * Fetch monochrome SVG string from jsDelivr OpenMoji repository
 */
export async function fetchRawMonochromeSvg(emoji: string): Promise<string | null> {
  const candidates = emojiToHexCandidates(emoji);
  if (candidates.length === 0) return null;

  const primaryKey = candidates[0];
  if (rawSvgCache.has(primaryKey)) {
    return rawSvgCache.get(primaryKey)!;
  }

  if (pendingFetches.has(primaryKey)) {
    return pendingFetches.get(primaryKey)!;
  }

  const fetchPromise = (async () => {
    for (const hex of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        const url = `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@master/black/svg/${hex}.svg`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const svg = await res.text();
          rawSvgCache.set(primaryKey, svg);
          return svg;
        }
      } catch {
        // Network timeout, offline, or CORS error - safely ignored; fallback is active
      }
    }
    return null;
  })();

  pendingFetches.set(primaryKey, fetchPromise);
  const result = await fetchPromise;
  pendingFetches.delete(primaryKey);
  return result;
}

/**
 * Recolor SVG string using outline color
 */
export function recolorSvgString(rawSvg: string, outlineColor: string): string {
  // Replace #000000, #000, black with the chosen outline color
  // and enhance stroke boldness for plump, smooth Pixel-grade outlines
  let recolored = rawSvg
    .replace(/#000000/gi, outlineColor)
    .replace(/#000\b/gi, outlineColor)
    .replace(/stroke="black"/gi, `stroke="${outlineColor}"`)
    .replace(/fill="black"/gi, `fill="${outlineColor}"`)
    .replace(/stroke-width="2"/g, 'stroke-width="2.6"');

  // Ensure svg has xml namespace if missing
  if (!recolored.includes('xmlns=')) {
    recolored = recolored.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return recolored;
}

/**
 * Get cached recolored HTMLImageElement synchronously without initiating async load inside render
 */
export function getRecoloredEmojiImage(
  emoji: string,
  outlineColor: string
): HTMLImageElement | null {
  const candidates = emojiToHexCandidates(emoji);
  if (candidates.length === 0) return null;
  const primaryKey = candidates[0];
  const cacheKey = `${primaryKey}_${outlineColor.toLowerCase()}`;

  const cached = imageCache.get(cacheKey);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  return null;
}

/**
 * Pre-cache all emojis for a given list and color
 */
export function precacheEmojis(emojis: string[], outlineColor: string): Promise<void> {
  return new Promise((resolve) => {
    let pending = emojis.length;
    if (pending === 0) {
      resolve();
      return;
    }

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= pending) {
        resolve();
      }
    };

    emojis.forEach((emoji) => {
      const candidates = emojiToHexCandidates(emoji);
      if (candidates.length === 0) {
        checkDone();
        return;
      }
      const primaryKey = candidates[0];
      const cacheKey = `${primaryKey}_${outlineColor.toLowerCase()}`;
      if (imageCache.has(cacheKey)) {
        checkDone();
        return;
      }

      fetchRawMonochromeSvg(emoji).then((rawSvg) => {
        if (!rawSvg) {
          checkDone();
          return;
        }
        const recolored = recolorSvgString(rawSvg, outlineColor);
        const blob = new Blob([recolored], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          imageCache.set(cacheKey, img);
          notifyAssetLoaded();
          checkDone();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          checkDone();
        };
        img.src = url;
      });
    });

    // Safety timeout in case network is sluggish
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}
