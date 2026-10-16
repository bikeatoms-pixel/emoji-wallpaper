import { EmojiItem } from '../types';


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
 * Normalize style strings to the 3 standard options
 */
export function normalizeEmojiStyle(style?: string): 'outline' | 'vector' | 'native' {
  if (style === 'vector') return 'vector';
  if (style === 'native') return 'native';
  if (style === 'color') return 'vector';
  return 'outline';
}

/**
 * Recolor SVG string using outline color
 * - Thoroughly recolors all black/dark variants (#000000, #000, #231f20, rgb(0,0,0), black)
 * - Automatically injects fill="${outlineColor}" into unstyled paths, circles, ellipses
 *   (e.g. eyes, pupils, whiskers in OpenMoji that default to black in browser SVG rendering)
 * - Keeps fill="none" on wireframe outline paths while recoloring strokes
 */
export function recolorSvgString(rawSvg: string, outlineColor: string): string {
  let recolored = rawSvg;

  // 1. Ensure xml namespace
  if (!recolored.includes('xmlns=')) {
    recolored = recolored.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 2. Set default root svg fill and stroke
  recolored = recolored.replace(/<svg\b([^>]*)>/i, (_match, attrs) => {
    let newAttrs = attrs;
    if (!newAttrs.includes('fill=')) newAttrs += ` fill="${outlineColor}"`;
    return `<svg${newAttrs}>`;
  });

  // 3. Replace all variations of black in attributes and inline styles
  recolored = recolored
    .replace(/#000000/gi, outlineColor)
    .replace(/#000\b/gi, outlineColor)
    .replace(/#231f20\b/gi, outlineColor)
    .replace(/#1a1a1a\b/gi, outlineColor)
    .replace(/#111111\b/gi, outlineColor)
    .replace(/#222222\b/gi, outlineColor)
    .replace(/rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/gi, outlineColor)
    .replace(/stroke="black"/gi, `stroke="${outlineColor}"`)
    .replace(/fill="black"/gi, `fill="${outlineColor}"`)
    .replace(/stroke-width="2"/g, 'stroke-width="2.6"');

  // 4. Inject fill onto shape elements that do NOT declare fill
  // (Prevents SVG default fill="black" for eyes, pupils, nostrils, markings)
  recolored = recolored.replace(
    /<(path|circle|ellipse|polygon|rect|polyline)\b((?:(?!fill=)[^>])*)>/gi,
    (_match, tag, rest) => {
      return `<${tag} fill="${outlineColor}"${rest}>`;
    }
  );

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

// In-memory cache of HTMLImageElements for native/color emojis by key: `${emojiHex}_color`
const colorImageCache = new Map<string, HTMLImageElement>();
const pendingColorFetches = new Map<string, Promise<string | null>>();

/**
 * Fetch vector color SVG string from OpenMoji / Twemoji CDN for crisp color rendering
 */
export async function fetchRawColorSvg(emoji: string): Promise<string | null> {
  const candidates = emojiToHexCandidates(emoji);
  if (candidates.length === 0) return null;

  const primaryKey = candidates[0];
  if (rawSvgCache.has(`color_${primaryKey}`)) {
    return rawSvgCache.get(`color_${primaryKey}`)!;
  }

  if (pendingColorFetches.has(primaryKey)) {
    return pendingColorFetches.get(primaryKey)!;
  }

  const fetchPromise = (async () => {
    for (const hex of candidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);
        // OpenMoji color SVG CDN
        const url = `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@master/color/svg/${hex}.svg`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const svg = await res.text();
          rawSvgCache.set(`color_${primaryKey}`, svg);
          return svg;
        }
      } catch {
        // Fallback to Twemoji or native text font seamlessly
      }
    }
    return null;
  })();

  pendingColorFetches.set(primaryKey, fetchPromise);
  const result = await fetchPromise;
  pendingColorFetches.delete(primaryKey);
  return result;
}

/**
 * Get cached color HTMLImageElement synchronously without initiating async load inside render
 */
export function getColorEmojiImage(emoji: string): HTMLImageElement | null {
  const candidates = emojiToHexCandidates(emoji);
  if (candidates.length === 0) return null;
  const primaryKey = candidates[0];
  const cacheKey = `${primaryKey}_color`;

  const cached = colorImageCache.get(cacheKey);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  return null;
}

/**
 * Pre-cache all emojis for a given list and color
 * Accepts either string[] or EmojiItem[]
 */
export function precacheEmojis(
  emojis: Array<string | EmojiItem>,
  outlineColor: string
): Promise<void> {
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

    emojis.forEach((item) => {
      const emoji = typeof item === 'string' ? item : item.char;
      const rawStyle = typeof item === 'object' ? item.style : 'outline';
      const style = normalizeEmojiStyle(rawStyle);

      // 1. 'native' style uses system font directly on Canvas - zero network overhead!
      if (style === 'native') {
        checkDone();
        return;
      }

      const candidates = emojiToHexCandidates(emoji);
      // Not a standard emoji (e.g. Chinese word or custom text) - drawn by canvas font directly
      if (candidates.length === 0) {
        checkDone();
        return;
      }
      const primaryKey = candidates[0];

      if (style === 'vector') {
        const cacheKey = `${primaryKey}_color`;
        if (colorImageCache.has(cacheKey)) {
          checkDone();
          return;
        }
        fetchRawColorSvg(emoji).then((colorSvg) => {
          if (!colorSvg) {
            checkDone();
            return;
          }
          const blob = new Blob([colorSvg], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            colorImageCache.set(cacheKey, img);
            notifyAssetLoaded();
            checkDone();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            checkDone();
          };
          img.src = url;
        });
      } else {
        // 'outline' (monochrome)
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
      }
    });

    // Safety timeout in case network is sluggish
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}
