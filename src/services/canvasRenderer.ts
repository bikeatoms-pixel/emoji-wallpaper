import { WallpaperConfig } from '../types';
import { getRecoloredEmojiImage } from './emojiService';

interface RenderOptions {
  canvas: HTMLCanvasElement;
  config: WallpaperConfig;
  customWidth?: number;
  customHeight?: number;
}

/**
 * Render wallpaper to a target canvas with full resolution fidelity
 */
export function renderWallpaper({
  canvas,
  config,
  customWidth,
  customHeight,
}: RenderOptions): void {
  if (!canvas) return;

  const width = customWidth || canvas.width;
  const height = customHeight || canvas.height;

  // Strict legality check: width > 0 && height > 0, pause if not ready
  if (!width || !height || width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const { emojis, pattern, density, palette } = config;
  const { bg, outline } = palette;

  // 1. Clear & Fill solid background color immediately
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (!emojis || emojis.length === 0) {
    ctx.restore();
    return;
  }

  // Density level: strictly clamped 1 to 5
  const safeDensity = Math.max(1, Math.min(5, density || 3));

  // High quality image smoothing for crisp emoji vector rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  try {
    switch (pattern) {
      case 'mosaic':
        renderMosaic(ctx, width, height, emojis, outline, safeDensity);
        break;
      case 'lotus':
        renderLotus(ctx, width, height, emojis, outline, safeDensity);
        break;
      case 'stacks':
        renderStacks(ctx, width, height, emojis, outline, bg, safeDensity);
        break;
      case 'scatter':
        renderScatter(ctx, width, height, emojis, outline, bg, safeDensity);
        break;
      case 'prism':
        renderPrism(ctx, width, height, emojis, outline, safeDensity);
        break;
      case 'bloom':
        renderBloom(ctx, width, height, emojis, outline, safeDensity);
        break;
      case 'constellation':
        renderConstellation(ctx, width, height, emojis, outline, bg, safeDensity);
        break;
      default:
        renderMosaic(ctx, width, height, emojis, outline, safeDensity);
        break;
    }
  } catch (err) {
    console.error('Error rendering wallpaper pattern:', err);
  } finally {
    ctx.restore();
  }
}

/**
 * Draw single emoji at (x, y) with rotation and size
 * Always provides instantaneous system font fallback so rendering is never blocked
 */
function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
  rotation = 0,
  outlineColor: string,
  bgColor?: string
) {
  if (!emoji || size <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  if (rotation !== 0) {
    ctx.rotate(rotation);
  }

  // Smooth circular backing mask using background color to prevent transparent wireframes
  // from tangling together when icons overlap or cluster closely
  if (bgColor) {
    ctx.beginPath();
    ctx.arc(0, 0, (size / 2) * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
  }

  // Attempt to load recolored SVG vector
  const img = getRecoloredEmojiImage(emoji, outlineColor);

  if (img && img.complete && img.naturalWidth > 0) {
    // 1. Crisp SVG vector rendering
    try {
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } catch {
      drawTextFallback(ctx, emoji, size, outlineColor);
    }
  } else {
    // 2. Immediate local fallback using system emoji font
    drawTextFallback(ctx, emoji, size, outlineColor);
  }

  ctx.restore();
}

/**
 * Clean local text-based emoji fallback
 */
function drawTextFallback(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  size: number,
  outlineColor: string
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = outlineColor;
  const fontSize = Math.max(Math.round(size * 0.82), 12);
  ctx.font = `bold ${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
  ctx.fillText(emoji, 0, 0);
}

/**
 * 1. Mosaic Layout (紧凑错落有致正方形密铺算法 - Tight Interlocking Square Tessellation):
 * - 紧致度升级：基准列数精细化（Level 1~5 分别为 14, 18, 22, 28, 34 列），图标大小饱满（占方格 92%~94%），告别空旷。
 * - 三种正方形尺寸 (等比 1:2:3):
 *   * 大号 (Large): 3x3 单元方格
 *   * 中号 (Medium): 2x2 单元方格
 *   * 小号 (Small): 1x1 单元方格
 * - 错落有致深度优化：
 *   1. 优先在未占用的空间以加权概率随机分配大、中、小正方形，模拟高质量砖墙/七巧板多晶密铺（Polyomino/Mondrian-like Tessellation）。
 *   2. 严格的互斥与边缘紧咬，任何一个表情与四周相邻表情紧紧相依，但绝对零遮挡、零穿透！
 *   3. 比例自然均衡：大号作为视觉焦点（约 15%~20%），中号紧密过渡（约 35%~40%），小号紧致嵌缝（约 40%~45%）。
 */
function renderMosaic(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  safeDensity: number
) {
  // Density controls the base grid columns - tuned for tight, detailed feeling
  // L1: 14 cols, L2: 18 cols, L3: 22 cols, L4: 28 cols, L5: 34 cols
  const colsMap: Record<number, number> = {
    1: 14,
    2: 18,
    3: 22,
    4: 28,
    5: 34,
  };
  const numCols = colsMap[safeDensity] || 22;
  const unitSize = width / numCols;
  const numRows = Math.ceil(height / unitSize);

  // 2D grid tracking occupied cells: occupied[row][col]
  const occupied: boolean[][] = Array.from({ length: numRows }, () =>
    Array(numCols).fill(false)
  );

  // Deterministic PRNG
  let seed = 24681 + safeDensity * 13579;
  for (let i = 0; i < emojis.length; i++) {
    seed = (seed * 37 + emojis[i].charCodeAt(0)) >>> 0;
  }
  const rand = createPrng(seed);

  interface PlacedSquare {
    gridCol: number;
    gridRow: number;
    span: number; // 3, 2, or 1
    x: number;
    y: number;
    size: number;
    tier: 'large' | 'medium' | 'small';
    emoji: string;
  }
  const placed: PlacedSquare[] = [];
  let emojiCounter = 0;

  // Helper: check if a span x span square can be placed at (r, c)
  const canFit = (r: number, c: number, span: number): boolean => {
    if (r + span > numRows || c + span > numCols) return false;
    for (let dr = 0; dr < span; dr++) {
      for (let dc = 0; dc < span; dc++) {
        if (occupied[r + dr][c + dc]) return false;
      }
    }
    return true;
  };

  // Helper: mark a span x span square as occupied
  const markOccupied = (r: number, c: number, span: number) => {
    for (let dr = 0; dr < span; dr++) {
      for (let dc = 0; dc < span; dc++) {
        occupied[r + dr][c + dc] = true;
      }
    }
  };

  // Step 1: 在整个画幅内，以优美的错落交错方式撒下大号 (3x3)
  // 大号之间保持距离，避免大号连成排，形成全屏起伏的视觉重心
  const largeCandidates: Array<{ r: number; c: number; score: number }> = [];
  for (let r = 0; r <= numRows - 3; r++) {
    for (let c = 0; c <= numCols - 3; c++) {
      // 奇偶交错微调权重，形成自然梅花桩错落
      const stagger = ((r % 2) ^ (c % 2)) ? 0.3 : 0;
      largeCandidates.push({ r, c, score: stagger + rand() });
    }
  }
  largeCandidates.sort((a, b) => b.score - a.score);

  // 大号目标数量适中，占据画面约 20%~25% 的网格面积
  const maxLarge = Math.max(3, Math.round((numCols * numRows) / 42));
  let largeCount = 0;
  const minLargeDist = Math.max(3, Math.floor(Math.sqrt((numCols * numRows) / maxLarge) * 0.75));

  for (const pos of largeCandidates) {
    if (largeCount >= maxLarge) break;

    // 空间避让检查，保证大号错开
    let tooClose = false;
    for (const p of placed) {
      if (p.span === 3) {
        if (Math.hypot(p.gridRow - pos.r, p.gridCol - pos.c) < minLargeDist) {
          tooClose = true;
          break;
        }
      }
    }
    if (tooClose) continue;

    if (canFit(pos.r, pos.c, 3)) {
      markOccupied(pos.r, pos.c, 3);
      const spanPx = 3 * unitSize;
      const x = pos.c * unitSize + spanPx * 0.5;
      const y = pos.r * unitSize + spanPx * 0.5;
      const emoji = emojis[emojiCounter % emojis.length];
      emojiCounter++;
      // 饱满紧凑的尺寸比例 (0.91)，紧致贴合
      const size = spanPx * 0.91;
      placed.push({
        gridCol: pos.c,
        gridRow: pos.r,
        span: 3,
        x,
        y,
        size,
        tier: 'large',
        emoji,
      });
      largeCount++;
    }
  }

  // Step 2: 前向扫描与紧致错落嵌合 (Tight Interlocking Tiling)
  // 逐行扫描每一个未占用单元格，结合概率动态尝试放入 2x2 (中号) 或 1x1 (小号)
  // 让中号和小号在各个大号之间穿插、包裹、错开，极具节奏感
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (occupied[r][c]) continue;

      // 检查是否能放置 2x2 中号
      const canFitMedium = canFit(r, c, 2);

      // 错落判定：以 65% 的概率优先放入中号，35% 放入小号
      // 若右侧或下方空间有限，则顺畅回退为小号，形成丰富的凹凸嵌合
      const preferMedium = canFitMedium && rand() < 0.65;

      if (preferMedium) {
        markOccupied(r, c, 2);
        const spanPx = 2 * unitSize;
        const x = c * unitSize + spanPx * 0.5;
        const y = r * unitSize + spanPx * 0.5;
        const emoji = emojis[emojiCounter % emojis.length];
        emojiCounter++;
        const size = spanPx * 0.91;
        placed.push({
          gridCol: c,
          gridRow: r,
          span: 2,
          x,
          y,
          size,
          tier: 'medium',
          emoji,
        });
      } else {
        // 放入 1x1 小号
        markOccupied(r, c, 1);
        const spanPx = 1 * unitSize;
        const x = c * unitSize + spanPx * 0.5;
        const y = r * unitSize + spanPx * 0.5;
        const emoji = emojis[emojiCounter % emojis.length];
        emojiCounter++;
        const size = spanPx * 0.92;
        placed.push({
          gridCol: c,
          gridRow: r,
          span: 1,
          x,
          y,
          size,
          tier: 'small',
          emoji,
        });
      }
    }
  }

  // 绘制每一个正方形单元格里的 Emoji（正向居中、紧凑饱满、错落有致、100% 严密密铺、绝对零遮挡）
  for (const p of placed) {
    drawEmoji(ctx, p.emoji, p.x, p.y, p.size, 0, outlineColor);
  }
}

/**
 * 2. Lotus Layout: Tight Polar Spiral (紧密的极坐标螺旋)
 * Radiates tightly outward from the center.
 * DENSITY directly controls total turns and icon count.
 * Icons are tightly packed with minimal negative space.
 */
function renderLotus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  safeDensity: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy) * 1.04;

  // DENSITY controls total count & turns: from 45 icons (Level 1) to 260 icons (Level 5)
  const totalCount = Math.round(45 + (safeDensity - 1) * 54);

  // Vogel's golden angle phyllotaxis for optimal circle packing
  const goldenAngle = 2.399963229728653; // ~137.507764 degrees
  const cSpread = maxRadius / Math.sqrt(totalCount);

  // Calibrated size so icons touch or nestle closely against adjacent neighbors
  const iconSize = Math.max(12, cSpread * 1.22);

  for (let i = 0; i < totalCount; i++) {
    const r = cSpread * Math.sqrt(i + 0.5);
    const theta = i * goldenAngle;

    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);

    // Tangential rotation along spiral curve
    const rotation = theta + Math.PI / 2;
    const emoji = emojis[i % emojis.length];

    drawEmoji(ctx, emoji, x, y, iconSize, rotation, outlineColor);
  }
}

/**
 * 3. Stacks Layout: Vertical Wave Columns (竖向波浪交错列 - Pixel 原版 Stacks 真实逻辑)
 * - 列与列之间水平交错排列（奇数列 Y 轴偏移半个单元步长）。
 * - 每一列内部表情自上而下稍微紧密贴合（带轻微重叠感，重叠量不超过 15%）。
 * - 【核心遮挡层次保护】：在绘制上层表情时，在底层自动填充与“背景同色”的平滑遮罩（Fill with Background Color），
 *   形成真实的前后物理贴纸遮挡层次，彻底杜绝透明线稿杂糅穿透！
 * - 密度 Density 真实联动列数：Level 1: 3 列, Level 2: 4 列, Level 3: 5 列, Level 4: 6 列, Level 5: 7 列。
 */
function renderStacks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  bgColor: string,
  safeDensity: number
) {
  const colsMap: Record<number, number> = {
    1: 3,
    2: 4,
    3: 5,
    4: 6,
    5: 7,
  };
  const numCols = colsMap[safeDensity] || 5;
  const colWidth = width / numCols;
  const iconSize = colWidth * 0.94;
  // Step is ~86% of icon size, creating ~14% overlap (within requested <= 15% limit)
  const stepY = iconSize * 0.86;

  const numRows = Math.ceil(height / stepY) + 3;

  let emojiIndex = 0;
  for (let c = 0; c < numCols; c++) {
    // Staggered column vertical phase shift (波浪交错列)
    const colOffsetY = (c % 2 === 1) ? stepY * 0.5 : 0;
    const x = (c + 0.5) * colWidth;

    // Draw from top to bottom so each lower emoji sits over previous with background mask
    for (let r = -1; r <= numRows; r++) {
      const y = r * stepY + colOffsetY;
      // Gentle natural vertical column sway / micro-rotation
      const waveAngle = Math.sin(r * 0.75 + c * 1.2) * (8 * Math.PI / 180);
      const emoji = emojis[emojiIndex % emojis.length];
      emojiIndex++;

      // Draw with solid background mask under emoji to form crisp physical sticker stacking
      drawEmoji(ctx, emoji, x, y, iconSize, waveAngle, outlineColor, bgColor);
    }
  }
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
 * 4. Scatter Layout: Multi-Tier Galaxy Scatter (严格零遮挡泊松圆盘散布)
 * - 元素总量丰富，覆盖全屏。
 * - 严格防碰撞算法（Zero Overlap Collision Detection）：
 *   * 每一个 Emoji 放置前计算与已放置 Emoji 的中心距。
 *   * dist >= (r1 + r2 + minGap)，绝不发生任何遮挡或交叉碰撞！
 *   * 若遇阻碍，支持多次重试候选位置与平滑降级，确保画面充盈且完全无重叠。
 */
function renderScatter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  _bgColor: string,
  safeDensity: number
) {
  const countMap: Record<number, number> = {
    1: 45,
    2: 70,
    3: 105,
    4: 150,
    5: 200,
  };
  const targetCount = countMap[safeDensity] || 105;
  const baseSize = Math.max(12, (width / 9.5) * Math.pow(105 / targetCount, 0.42));

  let seed = 8819 + safeDensity * 12345;
  for (let i = 0; i < emojis.length; i++) {
    seed = (seed * 31 + emojis[i].charCodeAt(0)) >>> 0;
  }
  const rand = createPrng(seed);

  interface PlacedItem {
    x: number;
    y: number;
    size: number;
    radius: number;
    rotation: number;
    emoji: string;
  }
  const placed: PlacedItem[] = [];

  const numLarge = Math.max(2, Math.round(targetCount * 0.10));
  const numMedium = Math.max(4, Math.round(targetCount * 0.22));
  const numSmall = targetCount - numLarge - numMedium;

  interface Candidate {
    tier: 'large' | 'medium' | 'small';
    scale: number;
  }
  const candidates: Candidate[] = [];
  for (let i = 0; i < numLarge; i++) candidates.push({ tier: 'large', scale: 1.55 + rand() * 0.35 });
  for (let i = 0; i < numMedium; i++) candidates.push({ tier: 'medium', scale: 0.92 + rand() * 0.16 });
  for (let i = 0; i < numSmall; i++) candidates.push({ tier: 'small', scale: 0.50 + rand() * 0.18 });

  // Place large first, then medium, then small
  const tierOrder = { large: 3, medium: 2, small: 1 };
  candidates.sort((a, b) => tierOrder[b.tier] - tierOrder[a.tier]);

  let emojiCounter = 0;
  const minGap = Math.max(2.5, width * 0.006);

  for (const cand of candidates) {
    let currentScale = cand.scale;
    let size = baseSize * currentScale;
    let radius = size * 0.45;
    let placedSuccess = false;

    const maxAttempts = cand.tier === 'large' ? 45 : 30;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const margin = size * 0.4;
      const x = margin + rand() * (width - margin * 2);
      const y = margin + rand() * (height - margin * 2);

      let collides = false;
      for (const p of placed) {
        const dist = Math.hypot(x - p.x, y - p.y);
        if (dist < radius + p.radius + minGap) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        const rotation = (rand() - 0.5) * (50 * Math.PI / 180);
        const emoji = emojis[emojiCounter % emojis.length];
        emojiCounter++;
        placed.push({ x, y, size, radius, rotation, emoji });
        placedSuccess = true;
        break;
      }
    }

    // If large/medium couldn't fit, try once with smaller size
    if (!placedSuccess && cand.tier !== 'small') {
      currentScale = 0.55;
      size = baseSize * currentScale;
      radius = size * 0.45;
      for (let attempt = 0; attempt < 25; attempt++) {
        const margin = size * 0.3;
        const x = margin + rand() * (width - margin * 2);
        const y = margin + rand() * (height - margin * 2);
        let collides = false;
        for (const p of placed) {
          const dist = Math.hypot(x - p.x, y - p.y);
          if (dist < radius + p.radius + minGap) {
            collides = true;
            break;
          }
        }
        if (!collides) {
          const rotation = (rand() - 0.5) * (50 * Math.PI / 180);
          const emoji = emojis[emojiCounter % emojis.length];
          emojiCounter++;
          placed.push({ x, y, size, radius, rotation, emoji });
          break;
        }
      }
    }
  }

  // Draw strictly collision-free emojis
  for (const item of placed) {
    drawEmoji(ctx, item.emoji, item.x, item.y, item.size, item.rotation, outlineColor);
  }
}

/**
 * 5. Prism Layout: Concentric Geometric Rings (同心几何环)
 * Emojis are neatly arranged on one or multiple concentric circular rings.
 * DENSITY modulates the number of rings and icon density on each ring.
 */
function renderPrism(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  safeDensity: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy) * 1.0;

  // DENSITY controls the number of concentric rings: 2 (Level 1) to 6 (Level 5)
  const numRings = Math.round(1 + safeDensity);
  const ringSpacing = maxRadius / (numRings + 0.3);
  const iconSize = Math.max(12, ringSpacing * 0.62);

  // Center focal emoji
  drawEmoji(ctx, emojis[0], cx, cy, iconSize * 1.18, 0, outlineColor);

  let emojiCounter = 1;
  // Concentric geometric rings
  for (let r = 1; r <= numRings; r++) {
    const radius = r * ringSpacing;
    // Multiples of 6 or 8 for crystalline mandala symmetry
    const baseSymmetry = safeDensity >= 4 ? 8 : 6;
    const itemsOnRing = r * baseSymmetry;
    const angleStep = (Math.PI * 2) / itemsOnRing;

    // Alternate ring offset to interleave icons in interstitial gaps
    const ringOffset = (r % 2) * (angleStep * 0.5);

    for (let i = 0; i < itemsOnRing; i++) {
      const angle = i * angleStep + ringOffset;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      // Tangential circular rotation
      const rotation = angle + Math.PI / 2;
      const emoji = emojis[emojiCounter % emojis.length];
      emojiCounter++;

      drawEmoji(ctx, emoji, x, y, iconSize, rotation, outlineColor);
    }
  }
}

/**
 * 6. Bloom Layout: Concentric floral petal rings blooming outward
 */
function renderBloom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  safeDensity: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.hypot(cx, cy) * 1.0;

  const numRings = Math.round(2 + safeDensity * 1.2);
  const ringStep = maxRadius / (numRings + 0.2);
  const baseSize = Math.max(12, ringStep * 0.64);

  // Center emoji
  drawEmoji(ctx, emojis[0], cx, cy, baseSize * 1.15, 0, outlineColor);

  let emojiIndex = 1;
  for (let ring = 1; ring <= numRings; ring++) {
    const r = ring * ringStep;
    const petalsInRing = Math.round(ring * (4 + safeDensity * 0.8));
    const angleStep = (Math.PI * 2) / petalsInRing;
    const ringAngleOffset = ring * 0.35;

    for (let p = 0; p < petalsInRing; p++) {
      const angle = p * angleStep + ringAngleOffset;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      const emoji = emojis[emojiIndex % emojis.length];
      emojiIndex++;

      const rotation = angle + Math.PI / 2;
      drawEmoji(ctx, emoji, x, y, baseSize, rotation, outlineColor);
    }
  }
}

/**
 * 7. Constellation Layout: Deep Space Star Cluster (严格零遮挡星群散布)
 * - 核心星系聚类与均匀星尘
 * - 强制距离碰撞检测算法，保证星辰之间绝对不穿透、不重叠、零互相遮挡！
 */
function renderConstellation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  emojis: string[],
  outlineColor: string,
  _bgColor: string,
  safeDensity: number
) {
  const countMap: Record<number, number> = {
    1: 50,
    2: 75,
    3: 110,
    4: 155,
    5: 210,
  };
  const totalCount = countMap[safeDensity] || 110;
  const baseSize = Math.max(12, (width / 9) * Math.pow(110 / totalCount, 0.44));

  let seed = 31415 + safeDensity * 7919;
  for (let i = 0; i < emojis.length; i++) {
    seed = (seed * 37 + emojis[i].charCodeAt(0)) >>> 0;
  }
  const rand = createPrng(seed);

  const numNexus = Math.min(6, 2 + safeDensity);
  const nexusCenters: Array<{ x: number; y: number; size: number }> = [];

  for (let n = 0; n < numNexus; n++) {
    const margin = width * 0.12;
    const nx = margin + rand() * (width - margin * 2);
    const ny = margin + rand() * (height - margin * 2);
    const nSize = baseSize * (1.6 + rand() * 0.35);
    nexusCenters.push({ x: nx, y: ny, size: nSize });
  }

  interface PlacedStar {
    x: number;
    y: number;
    size: number;
    radius: number;
    rotation: number;
    emoji: string;
  }
  const placed: PlacedStar[] = [];

  let emojiCounter = 0;
  const minGap = Math.max(2.5, width * 0.006);

  const canPlace = (x: number, y: number, radius: number): boolean => {
    for (const p of placed) {
      if (Math.hypot(x - p.x, y - p.y) < radius + p.radius + minGap) {
        return false;
      }
    }
    return true;
  };

  // 1. Place nexus core stars first
  for (const center of nexusCenters) {
    const radius = center.size * 0.45;
    if (canPlace(center.x, center.y, radius)) {
      const emoji = emojis[emojiCounter % emojis.length];
      emojiCounter++;
      placed.push({
        x: center.x,
        y: center.y,
        size: center.size,
        radius,
        rotation: (rand() - 0.5) * (30 * Math.PI / 180),
        emoji,
      });
    }
  }

  // 2. Medium stars (~20%)
  const numMedium = Math.max(4, Math.round(totalCount * 0.20));
  for (let i = 0; i < numMedium; i++) {
    const size = baseSize * (0.92 + rand() * 0.16);
    const radius = size * 0.45;

    for (let attempt = 0; attempt < 35; attempt++) {
      let mx: number;
      let my: number;
      if (rand() < 0.65 && nexusCenters.length > 0) {
        const parent = nexusCenters[Math.floor(rand() * nexusCenters.length)];
        const orbitDist = parent.size * (1.1 + rand() * 1.5);
        const angle = rand() * Math.PI * 2;
        mx = parent.x + orbitDist * Math.cos(angle);
        my = parent.y + orbitDist * Math.sin(angle);
      } else {
        mx = rand() * width;
        my = rand() * height;
      }
      mx = Math.max(12, Math.min(width - 12, mx));
      my = Math.max(12, Math.min(height - 12, my));

      if (canPlace(mx, my, radius)) {
        const emoji = emojis[emojiCounter % emojis.length];
        emojiCounter++;
        placed.push({
          x: mx,
          y: my,
          size,
          radius,
          rotation: (rand() - 0.5) * (45 * Math.PI / 180),
          emoji,
        });
        break;
      }
    }
  }

  // 3. Small star dust (~70%)
  const numSmall = Math.max(10, totalCount - placed.length);
  for (let i = 0; i < numSmall; i++) {
    const size = baseSize * (0.48 + rand() * 0.18);
    const radius = size * 0.45;

    for (let attempt = 0; attempt < 30; attempt++) {
      let sx: number;
      let sy: number;
      if (rand() < 0.45 && nexusCenters.length > 0) {
        const parent = nexusCenters[Math.floor(rand() * nexusCenters.length)];
        const dist = parent.size * (0.9 + rand() * 2.2);
        const angle = rand() * Math.PI * 2;
        sx = parent.x + dist * Math.cos(angle);
        sy = parent.y + dist * Math.sin(angle);
      } else {
        sx = rand() * width;
        sy = rand() * height;
      }
      sx = Math.max(8, Math.min(width - 8, sx));
      sy = Math.max(8, Math.min(height - 8, sy));

      if (canPlace(sx, sy, radius)) {
        const emoji = emojis[emojiCounter % emojis.length];
        emojiCounter++;
        placed.push({
          x: sx,
          y: sy,
          size,
          radius,
          rotation: (rand() - 0.5) * (60 * Math.PI / 180),
          emoji,
        });
        break;
      }
    }
  }

  // Draw strictly collision-free constellation stars
  for (const item of placed) {
    drawEmoji(ctx, item.emoji, item.x, item.y, item.size, item.rotation, outlineColor);
  }
}

