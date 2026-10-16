import { WallpaperConfig, EmojiItem } from '../types';
import { getRecoloredEmojiImage, getColorEmojiImage, normalizeEmojiStyle } from './emojiService';

interface RenderOptions {
  canvas: HTMLCanvasElement;
  config: WallpaperConfig;
  customWidth?: number;
  customHeight?: number;
  resolutionScale?: number;
}

/**
 * Fast deterministic PRNG (Mulberry32)
 */
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Render wallpaper with true infinite tiling, viewport pan, and continuous zoom
 */
export function renderWallpaper({
  canvas,
  config,
  customWidth,
  customHeight,
  resolutionScale,
}: RenderOptions): void {
  if (!canvas) return;

  const width = customWidth || canvas.width;
  const height = customHeight || canvas.height;

  if (!width || !height || width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
    return;
  }

  const resScale = typeof resolutionScale === 'number' && resolutionScale > 0 ? resolutionScale : 1;
  const targetCanvasW = Math.round(width * resScale);
  const targetCanvasH = Math.round(height * resScale);

  if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
    canvas.width = targetCanvasW;
    canvas.height = targetCanvasH;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { emojis, pattern, palette, viewportOffset, scale: configScale, density } = config;
  const { bg, outline } = palette;

  // 1. Clear & Fill background
  ctx.save();
  if (resScale !== 1) {
    ctx.scale(resScale, resScale);
  }
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (!emojis || emojis.length === 0) {
    ctx.restore();
    return;
  }

  // Continuous Zoom Scale: clamp strictly between 0.2 and 5.0 (default 1.0)
  const userScale =
    typeof configScale === 'number' && !isNaN(configScale) && configScale > 0
      ? configScale
      : typeof density === 'number' && !isNaN(density) && density > 0
      ? density
      : 1.0;
  const scale = Math.max(0.2, Math.min(5.0, userScale));

  // High quality vector smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 2. Viewport Transform (Pan & Zoom in Canvas 2D World Space)
  // Center is anchored at canvas center (width/2, height/2) + pan offset
  const panX =
    viewportOffset && typeof viewportOffset.x === 'number' && !isNaN(viewportOffset.x)
      ? viewportOffset.x
      : 0;
  const panY =
    viewportOffset && typeof viewportOffset.y === 'number' && !isNaN(viewportOffset.y)
      ? viewportOffset.y
      : 0;

  // Screen center offset so origin (0, 0) starts right at canvas center
  const centerX = width / 2;
  const centerY = height / 2;

  // In World Coordinates:
  // screenX = centerX + panX + worldX * scale
  // worldX = (screenX - centerX - panX) / scale
  const buffer = Math.max(140, 240 / scale);
  const startX = (-centerX - panX) / scale - buffer;
  const endX = (width - centerX - panX) / scale + buffer;
  const startY = (-centerY - panY) / scale - buffer;
  const endY = (height - centerY - panY) / scale + buffer;

  ctx.save();
  ctx.translate(centerX + panX, centerY + panY);
  ctx.scale(scale, scale);

  try {
    switch (pattern) {
      case 'mosaic':
        renderMosaic(ctx, startX, endX, startY, endY, emojis, outline);
        break;
      case 'lotus':
        renderLotus(ctx, startX, endX, startY, endY, emojis, outline);
        break;
      case 'stacks':
        renderStacks(ctx, startX, endX, startY, endY, emojis, outline, bg);
        break;
      case 'scatter':
        renderScatter(ctx, startX, endX, startY, endY, emojis, outline, bg);
        break;
      case 'prism':
        renderPrism(ctx, startX, endX, startY, endY, emojis, outline);
        break;
      case 'bloom':
        renderBloom(ctx, startX, endX, startY, endY, emojis, outline);
        break;
      case 'constellation':
        renderConstellation(ctx, startX, endX, startY, endY, emojis, outline, bg);
        break;
      case 'convex':
        renderConvexLens(
          ctx,
          startX,
          endX,
          startY,
          endY,
          emojis,
          outline,
          width,
          height,
          centerX,
          centerY,
          panX,
          panY,
          scale
        );
        break;
      case 'concave':
        renderConcaveLens(
          ctx,
          startX,
          endX,
          startY,
          endY,
          emojis,
          outline,
          width,
          height,
          centerX,
          centerY,
          panX,
          panY,
          scale
        );
        break;
      default:
        renderMosaic(ctx, startX, endX, startY, endY, emojis, outline);
        break;
    }
  } catch (err) {
    console.error('Error rendering wallpaper pattern:', err);
  } finally {
    ctx.restore();
    ctx.restore();
  }
}

/**
 * Test whether the input text contains Chinese or letters/numbers (custom word)
 */
function isWordElement(text: string): boolean {
  return /[\p{sc=Han}\p{L}\p{N}]/u.test(text);
}

/**
 * Calculate proportional font size according to character/grapheme count
 * Ensures multi-character Chinese words (e.g. "吃火锅", "奶茶") fit harmoniously within grid cells
 */
function computeAdaptiveFontSize(text: string, boxSize: number): number {
  const charCount = Array.from(text).length;
  let scale = 0.82;
  if (charCount === 2) {
    scale = 0.48;
  } else if (charCount === 3) {
    scale = 0.35;
  } else if (charCount >= 4) {
    scale = 0.28;
  }
  return Math.max(Math.round(boxSize * scale), 11);
}

/**
 * Draw single emoji or custom word element at (x, y) with rotation and size.
 * Supports 3 distinctive rendering styles:
 * - 'outline' (线条化): Recolored Material You vector silhouette (OpenMoji black SVG), zero stray black
 * - 'vector'  (半线条化): Rich vector illustrated color artwork (OpenMoji color SVG)
 * - 'native'  (原图): Authentic 3D/full-color system native emoji, never overridden or converted to vector
 */
function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emojiItem: string | EmojiItem,
  x: number,
  y: number,
  size: number,
  rotation = 0,
  outlineColor: string,
  bgColor?: string
) {
  const char = typeof emojiItem === 'string' ? emojiItem : emojiItem.char;
  const rawStyle = typeof emojiItem === 'object' ? emojiItem.style : 'outline';
  const style = normalizeEmojiStyle(rawStyle);

  if (!char || size <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }

  // Smooth circular backing mask using background color to prevent transparent wireframes
  // from tangling together when icons overlap or stack
  if (bgColor) {
    ctx.beginPath();
    ctx.arc(0, 0, (size / 2) * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  // 1. STYLE: 'native' (原图 - System Native Full-Color Emoji)
  if (style === 'native') {
    // Directly render native OS glyph without requesting or awaiting OpenMoji SVG.
    // Guaranteed to preserve the user's authentic Apple / Google / Microsoft 3D emoji.
    drawNativeEmoji(ctx, char, size, outlineColor);
  } else if (style === 'vector') {
    // 2. STYLE: 'vector' (半线条化 - OpenMoji Illustrated Vector SVG)
    const colorImg = getColorEmojiImage(char);
    if (colorImg && colorImg.complete && colorImg.naturalWidth > 0) {
      try {
        ctx.drawImage(colorImg, -size / 2, -size / 2, size, size);
      } catch {
        drawNativeEmoji(ctx, char, size, outlineColor);
      }
    } else {
      drawNativeEmoji(ctx, char, size, outlineColor);
    }
  } else {
    // 3. STYLE: 'outline' (线条化 - Pure Monochrome / Recolor Silhouette)
    const img = getRecoloredEmojiImage(char, outlineColor);
    if (img && img.complete && img.naturalWidth > 0) {
      try {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      } catch {
        drawTextFallback(ctx, char, size, outlineColor);
      }
    } else {
      drawTextFallback(ctx, char, size, outlineColor);
    }
  }

  ctx.restore();
}

/**
 * Fallback / Text renderer for outline style (solid monochrome in theme outline color)
 */
function drawTextFallback(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  outlineColor: string
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = outlineColor;
  const fontSize = computeAdaptiveFontSize(text, size);
  ctx.font = `bold ${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif`;
  ctx.fillText(text, 0, 0);
}

/**
 * Native OS emoji and full color font renderer ('native' style & vector loading fallback)
 */
function drawNativeEmoji(
  ctx: CanvasRenderingContext2D,
  text: string,
  size: number,
  outlineColor: string
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = computeAdaptiveFontSize(text, size);

  // If this is a word phrase (Chinese/letters), use readable theme outlineColor
  if (isWordElement(text)) {
    ctx.fillStyle = outlineColor;
    ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif`;
  } else {
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
  }
  ctx.fillText(text, 0, 0);
}

/**
 * 1. Mosaic: True Infinite Tessellation (真·无限正方形错落密铺)
 * - 紧密嵌合算法，零缝隙、零遮挡、零穿透
 */
function renderMosaic(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string
) {
  const unitSize = 48; // Base square grid size in world pixels
  const blockSize = 12; // 12x12 cells per tessellation block
  const blockPx = blockSize * unitSize;

  const minBlockX = Math.floor(startX / blockPx);
  const maxBlockX = Math.ceil(endX / blockPx);
  const minBlockY = Math.floor(startY / blockPx);
  const maxBlockY = Math.ceil(endY / blockPx);

  let baseSeed = 54321;
  for (let i = 0; i < emojis.length; i++) {
    const char = typeof emojis[i] === 'string' ? (emojis[i] as string) : (emojis[i] as EmojiItem).char;
    baseSeed = (baseSeed * 37 + char.charCodeAt(0)) >>> 0;
  }

  for (let bx = minBlockX; bx <= maxBlockX; bx++) {
    for (let by = minBlockY; by <= maxBlockY; by++) {
      const blockHash = (Math.imul(bx, 1597334677) ^ Math.imul(by, 3812015801) ^ baseSeed) >>> 0;
      const rand = createPrng(blockHash);

      const occupied: boolean[][] = Array.from({ length: blockSize }, () =>
        Array(blockSize).fill(false)
      );

      interface PlacedSquare {
        r: number;
        c: number;
        span: number;
      }
      const blockPlaced: PlacedSquare[] = [];

      const canFit = (r: number, c: number, span: number): boolean => {
        if (r + span > blockSize || c + span > blockSize) return false;
        for (let dr = 0; dr < span; dr++) {
          for (let dc = 0; dc < span; dc++) {
            if (occupied[r + dr][c + dc]) return false;
          }
        }
        return true;
      };

      const markOccupied = (r: number, c: number, span: number) => {
        for (let dr = 0; dr < span; dr++) {
          for (let dc = 0; dc < span; dc++) {
            occupied[r + dr][c + dc] = true;
          }
        }
      };

      // Step 1: Place large 3x3 squares
      const largeCandidates: Array<{ r: number; c: number; score: number }> = [];
      for (let r = 0; r <= blockSize - 3; r++) {
        for (let c = 0; c <= blockSize - 3; c++) {
          const stagger = ((r % 2) ^ (c % 2)) ? 0.35 : 0;
          largeCandidates.push({ r, c, score: stagger + rand() });
        }
      }
      largeCandidates.sort((a, b) => b.score - a.score);

      const maxLarge = 4;
      let largePlacedCount = 0;
      for (const pos of largeCandidates) {
        if (largePlacedCount >= maxLarge) break;
        let tooClose = false;
        for (const p of blockPlaced) {
          if (p.span === 3 && Math.hypot(p.r - pos.r, p.c - pos.c) < 3.2) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        if (canFit(pos.r, pos.c, 3)) {
          markOccupied(pos.r, pos.c, 3);
          blockPlaced.push({ r: pos.r, c: pos.c, span: 3 });
          largePlacedCount++;
        }
      }

      // Step 2: 2x2 with preference, else 1x1
      for (let r = 0; r < blockSize; r++) {
        for (let c = 0; c < blockSize; c++) {
          if (occupied[r][c]) continue;

          if (canFit(r, c, 2) && rand() < 0.62) {
            markOccupied(r, c, 2);
            blockPlaced.push({ r, c, span: 2 });
          } else {
            markOccupied(r, c, 1);
            blockPlaced.push({ r, c, span: 1 });
          }
        }
      }

      // Step 3: Draw all placed squares
      for (const p of blockPlaced) {
        const gridX = bx * blockSize + p.c;
        const gridY = by * blockSize + p.r;
        const x = (gridX + p.span * 0.5) * unitSize;
        const y = (gridY + p.span * 0.5) * unitSize;
        const size = p.span * unitSize * 0.92;

        const prime = 31;
        const emojiIndex = ((Math.floor(gridX) + Math.floor(gridY) * prime) % emojis.length + emojis.length) % emojis.length;
        const emoji = emojis[emojiIndex];

        drawEmoji(ctx, emoji, x, y, size, 0, outlineColor);
      }
    }
  }
}

/**
 * 2. Lotus: True Polar Coordinate Spiral (唯一定位单圆心 · 极坐标双臂阿基米德螺旋)
 * - 与 Bloom、Prism 保持一致：只有世界原点 (0, 0) 一个中心，随手势平移自由移动
 * - 纯正极坐标连续螺旋特性：r = b * theta，彻底区别于 Bloom 的同心圆环，呈现优雅连贯的涡旋花序
 * - 绝不重叠：基于阿基米德螺旋精确微分弧长计算，层间距与弧间距严密隔离，绝对零遮挡
 * - 动态切线旋转：Emoji 沿着螺旋切线与径向角度动态偏转，呈现生机盎然的螺旋盛放律动
 */
function renderLotus(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string
) {
  // Center core emoji at single origin (0, 0)
  if (0 >= startX - 60 && 0 <= endX + 60 && 0 >= startY - 60 && 0 <= endY + 60) {
    drawEmoji(ctx, emojis[0], 0, 0, 44, 0, outlineColor);
  }

  // Maximum radius to reach the farthest visible corner from (0, 0)
  const maxRadius = Math.hypot(
    Math.max(Math.abs(startX), Math.abs(endX)),
    Math.max(Math.abs(startY), Math.abs(endY))
  ) + 80;

  const arms = 2; // Symmetric twin spiral arms (双臂对称螺旋，既具 180° 中心对称美感，又极富流动性)
  const pitchPerArm = 96; // 96px per 360° turn per arm -> 双臂交错径向距离严控在 48px
  const b = pitchPerArm / (2 * Math.PI); // r = b * theta
  const stepArc = 48; // Constant arc length between consecutive emojis
  const thetaInitial = 2.8; // Initial theta ensuring >42px clearance from center core

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = arm * Math.PI;
    let theta = thetaInitial;
    let r = b * theta;
    let stepCount = 0;

    while (r <= maxRadius) {
      const angle = theta + armOffset;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);

      // Fast viewport culling
      if (x >= startX - 50 && x <= endX + 50 && y >= startY - 50 && y <= endY + 50) {
        // Tangent angle along the spiral curve
        const tangentAngle = angle + Math.atan2(b, r);
        const rotation = tangentAngle + Math.PI / 2;
        const emojiIndex = (arm * 7 + stepCount) % emojis.length;
        const emoji = emojis[(emojiIndex + emojis.length) % emojis.length];

        drawEmoji(ctx, emoji, x, y, 30, rotation, outlineColor);
      }

      // Exact differential arc length: ds = sqrt(r^2 + b^2) * dtheta
      const dTheta = stepArc / Math.sqrt(r * r + b * b);
      theta += dTheta;
      r = b * theta;
      stepCount++;
    }
  }
}


/**
 * 3. Stacks: Infinite Vertical Wave Columns (真·无限竖向交错波浪列)
 */
function renderStacks(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string,
  bgColor: string
) {
  const colWidth = 72;
  const iconSize = colWidth * 0.94;
  const stepY = iconSize * 0.86;

  const minCol = Math.floor(startX / colWidth) - 1;
  const maxCol = Math.ceil(endX / colWidth) + 1;
  const minRow = Math.floor(startY / stepY) - 1;
  const maxRow = Math.ceil(endY / stepY) + 1;

  for (let c = minCol; c <= maxCol; c++) {
    const colOffsetY = (Math.abs(c) % 2 === 1) ? stepY * 0.5 : 0;
    const x = (c + 0.5) * colWidth;

    for (let r = minRow; r <= maxRow; r++) {
      const y = r * stepY + colOffsetY;
      const waveAngle = Math.sin(r * 0.75 + c * 1.2) * (8 * Math.PI / 180);
      const prime = 31;
      const emojiIndex = ((c + r * prime) % emojis.length + emojis.length) % emojis.length;
      const emoji = emojis[emojiIndex];

      drawEmoji(ctx, emoji, x, y, iconSize, waveAngle, outlineColor, bgColor);
    }
  }
}

/**
 * 4. Scatter: Wild & Stylized Mosaic-Scaled Field (歪七扭八 · 多级尺度错落)
 * - 歪七扭八：显著随机倾角 (-42° ~ +42° 随机偏转)，位置有机轻微抖动，打破生硬对齐
 * - 大小不均：参照 Mosaic 多层级尺度系统（Large 54px, Medium 44px, Standard 34px, Small 24px），有大有小错落有致
 * - 零碰撞保障：基于安全网格与尺寸自适应间距约束，保持高紧致度的同时绝不重叠
 */
function renderScatter(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string,
  _bgColor: string
) {
  const cellSize = 64; // Tight organic cell size
  const minCellX = Math.floor(startX / cellSize) - 1;
  const maxCellX = Math.ceil(endX / cellSize) + 1;
  const minCellY = Math.floor(startY / cellSize) - 1;
  const maxCellY = Math.ceil(endY / cellSize) + 1;

  for (let cx = minCellX; cx <= maxCellX; cx++) {
    for (let cy = minCellY; cy <= maxCellY; cy++) {
      const cellHash = (Math.imul(cx, 374761393) ^ Math.imul(cy, 668265263)) >>> 0;
      const rand1 = ((cellHash ^ (cellHash >>> 13)) * 1274126177 >>> 0) / 4294967296;
      const rand2 = ((cellHash ^ (cellHash >>> 17)) * 2654435761 >>> 0) / 4294967296;
      const rand3 = ((cellHash ^ (cellHash >>> 11)) * 3141592653 >>> 0) / 4294967296;
      const randRot = ((cellHash ^ (cellHash >>> 7)) * 19349663 >>> 0) / 4294967296;

      // 94% high density placement
      if (rand1 > 0.94) continue;

      // Multi-tier sizes like Mosaic (参照mosaic的大小比例)
      let size: number;
      let maxJitter: number;

      // Periodic deterministic large hero items
      const isHero = ((Math.abs(cx * 3 + cy * 5)) % 7 === 0) && rand1 > 0.35;
      if (isHero) {
        size = 54; // Large hero
        maxJitter = 4; // Lower jitter for large items to guarantee clearance
      } else if (rand1 < 0.22) {
        size = 24; // Small accent
        maxJitter = 16;
      } else if (rand1 < 0.58) {
        size = 34; // Standard
        maxJitter = 10;
      } else {
        size = 44; // Medium
        maxJitter = 8;
      }

      // Jitter
      const jitterX = (rand2 - 0.5) * (maxJitter * 2);
      const jitterY = (rand3 - 0.5) * (maxJitter * 2);
      const x = (cx + 0.5) * cellSize + jitterX;
      const y = (cy + 0.5) * cellSize + jitterY;

      // 歪七扭八：显著的随机偏转角 (-42度 ~ +42度)
      const rotation = (randRot - 0.5) * (84 * Math.PI / 180);

      const prime = 43;
      const emojiIndex = ((cx + cy * prime) % emojis.length + emojis.length) % emojis.length;
      drawEmoji(ctx, emojis[emojiIndex], x, y, size, rotation, outlineColor);
    }
  }
}

/**
 * 5. Prism: True Single Center Kaleidoscope Rays (唯一定位单圆心 · 万花筒几何光芒)
 * - 只有世界原点 (0, 0) 一个圆心，随手势平移自由移动，四周无限向外辐射
 */
function renderPrism(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string
) {
  // Center core emoji at single origin (0, 0)
  if (0 >= startX - 50 && 0 <= endX + 50 && 0 >= startY - 50 && 0 <= endY + 50) {
    drawEmoji(ctx, emojis[0], 0, 0, 46, 0, outlineColor);
  }

  // Calculate maximum distance needed from (0, 0) to cover the visible world rectangle
  const maxDist = Math.hypot(
    Math.max(Math.abs(startX), Math.abs(endX)),
    Math.max(Math.abs(startY), Math.abs(endY))
  ) + 80;

  const numRays = 16; // 16 radial kaleidoscope spokes (every 22.5 degrees)
  const stepR = 48; // Spacing along each spoke

  const maxStep = Math.ceil(maxDist / stepR);

  for (let s = 1; s <= maxStep; s++) {
    const r = 48 + (s - 1) * stepR;
    const isEvenRing = s % 2 === 0;

    for (let k = 0; k < numRays; k++) {
      // Angular offset alternating on even rings for breathtaking diamond facet effect
      const angle = (k * Math.PI * 2) / numRays + (isEvenRing ? Math.PI / numRays : 0);
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);

      // Viewport culling
      if (x < startX - 50 || x > endX + 50 || y < startY - 50 || y > endY + 50) {
        continue;
      }

      const emojiIndex = (s * 3 + k) % emojis.length;
      const emojiSize = s === 1 ? 30 : 34;
      drawEmoji(ctx, emojis[emojiIndex], x, y, emojiSize, angle + Math.PI / 2, outlineColor);
    }
  }
}

/**
 * 6. Bloom: True Single Center Floral Mandala (唯一定位单圆心 · 繁花盛放同心圆)
 * - 只有世界原点 (0, 0) 一个圆心，随手势平移自由移动，逐层向外递进绽放
 */
function renderBloom(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string
) {
  // Center core emoji at single origin (0, 0)
  if (0 >= startX - 50 && 0 <= endX + 50 && 0 >= startY - 50 && 0 <= endY + 50) {
    drawEmoji(ctx, emojis[0], 0, 0, 48, 0, outlineColor);
  }

  // Maximum radius to reach the farthest visible corner from (0, 0)
  const maxRadius = Math.hypot(
    Math.max(Math.abs(startX), Math.abs(endX)),
    Math.max(Math.abs(startY), Math.abs(endY))
  ) + 80;

  const ringSpacing = 46;
  const totalRings = Math.ceil(maxRadius / ringSpacing);

  for (let ring = 1; ring <= totalRings; ring++) {
    const r = 50 + (ring - 1) * ringSpacing;
    // Compute petal count proportional to circumference so petals are comfortably packed
    // Target arc spacing ~ 44px
    const petalCount = Math.max(6, Math.floor((2 * Math.PI * r) / 44));
    const angularStep = (Math.PI * 2) / petalCount;
    // Golden spiral rotation stagger per ring
    const ringAngleOffset = ring * 2.399963;

    for (let p = 0; p < petalCount; p++) {
      const angle = ringAngleOffset + p * angularStep;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);

      // Fast bounding box culling
      if (x < startX - 50 || x > endX + 50 || y < startY - 50 || y > endY + 50) {
        continue;
      }

      const emojiIndex = (ring * 5 + p) % emojis.length;
      drawEmoji(ctx, emojis[emojiIndex], x, y, 32, angle + Math.PI / 2, outlineColor);
    }
  }
}

/**
 * 7. Constellation: High-Density Cosmic Stardust (高密宇宙星系网)
 * - 大幅提高密度：扇区尺寸从 160px 缩减至 96px，密度提升 300%
 * - 增加星轨连线与伴随星光，营造空灵深邃的星座连线星空
 */
function renderConstellation(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string,
  _bgColor: string
) {
  const sectorSize = 96; // Enhanced high density
  const minSectorX = Math.floor(startX / sectorSize) - 1;
  const maxSectorX = Math.ceil(endX / sectorSize) + 1;
  const minSectorY = Math.floor(startY / sectorSize) - 1;
  const maxSectorY = Math.ceil(endY / sectorSize) + 1;

  interface StarNode {
    x: number;
    y: number;
    size: number;
    emojiIndex: number;
  }
  const nodes: StarNode[] = [];

  // Pass 1: Generate nodes
  for (let sx = minSectorX; sx <= maxSectorX; sx++) {
    for (let sy = minSectorY; sy <= maxSectorY; sy++) {
      const hash = (Math.imul(sx, 73856093) ^ Math.imul(sy, 19349663)) >>> 0;
      const rand = createPrng(hash);

      const nx = (sx + 0.18 + rand() * 0.64) * sectorSize;
      const ny = (sy + 0.18 + rand() * 0.64) * sectorSize;
      const prime = 37;
      const emojiIndex = ((sx * 11 + sy * prime) % emojis.length + emojis.length) % emojis.length;

      nodes.push({
        x: nx,
        y: ny,
        size: 34,
        emojiIndex,
      });

      // Secondary satellite star
      if (rand() > 0.45) {
        const dist = 32 + rand() * 22;
        const angle = rand() * Math.PI * 2;
        nodes.push({
          x: nx + dist * Math.cos(angle),
          y: ny + dist * Math.sin(angle),
          size: 22,
          emojiIndex: (emojiIndex + 1) % emojis.length,
        });
      }
    }
  }

  // Pass 2: Draw stardust constellation connection lines between neighboring stars
  ctx.save();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.0;
  ctx.globalAlpha = 0.28;

  const maxConnectDistSq = 110 * 110;
  for (let i = 0; i < nodes.length; i++) {
    const na = nodes[i];
    // Check next few nearby nodes
    const checkLimit = Math.min(nodes.length, i + 8);
    for (let j = i + 1; j < checkLimit; j++) {
      const nb = nodes[j];
      const dx = na.x - nb.x;
      const dy = na.y - nb.y;
      const dsq = dx * dx + dy * dy;
      if (dsq < maxConnectDistSq && dsq > 25 * 25) {
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // Pass 3: Draw stars & emojis
  for (const node of nodes) {
    if (
      node.x < startX - 40 ||
      node.x > endX + 40 ||
      node.y < startY - 40 ||
      node.y > endY + 40
    ) {
      continue;
    }
    drawEmoji(ctx, emojis[node.emojiIndex], node.x, node.y, node.size, 0, outlineColor);
  }
}

/**
 * 8. Convex Lens: Center Magnified Viewport Lens (凸面镜 · 视口物理动态透镜)
 * - 规则：
 *   1. 锁定大小区：长和宽的一半，居中，Emoji 达到最大，大小相同
 *   2. 旁边的区域随着越旁边越小，最边缘特别小（~0.25x）
 *   3. 中间最大区的 Emoji 大小由缩放手势/滚轮直接控制
 *   4. 拖动时：Emoji 从旁边被拖到中间过程中慢慢变大，在中间被拖到旁边过程中慢慢变小
 *   5. 底层网格：六边形蜂巢点阵（Hexagonal Honeycomb Grid）
 */
function renderConvexLens(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  panX: number,
  panY: number,
  scale: number
) {
  // Honeycomb grid spacing in world space
  const colStep = 60;
  const rowStep = colStep * (Math.sqrt(3) / 2); // ~51.96px

  const minCol = Math.floor(startX / colStep) - 1;
  const maxCol = Math.ceil(endX / colStep) + 1;
  const minRow = Math.floor(startY / rowStep) - 1;
  const maxRow = Math.ceil(endY / rowStep) + 1;

  // Viewport half sizes for locked region (长和宽的一半居中 => 左右各 width/4, 上下各 height/4)
  const halfW = width / 2;
  const halfH = height / 2;
  const lockHalfW = width / 4;
  const lockHalfH = height / 4;

  const baseMaxSize = 52; // Max size inside locked zone (scaled by world scale transform)

  for (let c = minCol; c <= maxCol; c++) {
    for (let r = minRow; r <= maxRow; r++) {
      // Hexagonal honeycomb offset
      const x = (c + (Math.abs(r) % 2 === 1 ? 0.5 : 0)) * colStep;
      const y = r * rowStep;

      // Compute exact screen coordinate of this world point
      const sx = centerX + panX + x * scale;
      const sy = centerY + panY + y * scale;

      // Culling: if fully off screen, skip
      if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) {
        continue;
      }

      // Offset from screen center
      const dx = sx - halfW;
      const dy = sy - halfH;

      // Check if inside locked max size region
      let factor = 1.0;
      if (Math.abs(dx) <= lockHalfW && Math.abs(dy) <= lockHalfH) {
        factor = 1.0;
      } else {
        // Outside locked region: calculate normalized excess distance
        const excessX = Math.max(0, Math.abs(dx) - lockHalfW) / (width / 4);
        const excessY = Math.max(0, Math.abs(dy) - lockHalfH) / (height / 4);
        const distExcess = Math.sqrt(excessX * excessX + excessY * excessY);
        // Smoothly decay to ~0.25 at the outer borders
        const t = Math.min(1.0, distExcess / 1.15);
        factor = 0.25 + 0.75 * Math.cos(t * Math.PI * 0.5);
      }

      const size = baseMaxSize * factor;
      const prime = 29;
      const emojiIndex = ((c * 17 + r * prime) % emojis.length + emojis.length) % emojis.length;

      drawEmoji(ctx, emojis[emojiIndex], x, y, size, 0, outlineColor);
    }
  }
}

/**
 * 9. Concave Lens: Center Minified Viewport Lens (凹面镜 · 景深反转透镜)
 * - 规则：
 *   1. 中间小、旁边大布局，以视口圆心径向向四周扩散
 *   2. 中间最小的 Emoji 大小由缩放手势/滚轮直接控制
 *   3. 拖动时：从中间拖向旁边过程中慢慢变大，从旁边拖向中间过程中慢慢变小
 *   4. 底层网格：六边形蜂巢点阵（Hexagonal Honeycomb Grid）
 */
function renderConcaveLens(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  startY: number,
  endY: number,
  emojis: Array<string | EmojiItem>,
  outlineColor: string,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  panX: number,
  panY: number,
  scale: number
) {
  // Honeycomb grid spacing in world space
  const colStep = 60;
  const rowStep = colStep * (Math.sqrt(3) / 2);

  const minCol = Math.floor(startX / colStep) - 1;
  const maxCol = Math.ceil(endX / colStep) + 1;
  const minRow = Math.floor(startY / rowStep) - 1;
  const maxRow = Math.ceil(endY / rowStep) + 1;

  const halfW = width / 2;
  const halfH = height / 2;
  // Screen diagonal radius reference
  const maxScreenR = Math.hypot(halfW, halfH) * 0.88;

  const baseMinSize = 22; // Smallest size at center (scaled by user zoom)

  for (let c = minCol; c <= maxCol; c++) {
    for (let r = minRow; r <= maxRow; r++) {
      const x = (c + (Math.abs(r) % 2 === 1 ? 0.5 : 0)) * colStep;
      const y = r * rowStep;

      // Exact screen coordinate
      const sx = centerX + panX + x * scale;
      const sy = centerY + panY + y * scale;

      // Culling
      if (sx < -70 || sx > width + 70 || sy < -70 || sy > height + 70) {
        continue;
      }

      // Radial distance from screen center
      const dx = sx - halfW;
      const dy = sy - halfH;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Normalized distance: 0 at center, 1 at outer boundaries
      const u = Math.min(1.25, dist / maxScreenR);

      // Concave expansion curve: center = 1.0 (min size), edges = up to 2.7x larger
      const factor = 1.0 + 1.7 * Math.pow(u, 1.25);

      const size = baseMinSize * factor;
      const prime = 31;
      const emojiIndex = ((c * 19 + r * prime) % emojis.length + emojis.length) % emojis.length;

      drawEmoji(ctx, emojis[emojiIndex], x, y, size, 0, outlineColor);
    }
  }
}

