import {
  ColorPalette,
  DeviceCategory,
  Orientation,
  ResolutionTier,
  AspectRatioPreset,
  ResolvedExportDimension,
} from '../types';

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'sage-green',
    name: 'Sage Green',
    bg: '#B4CAB8',
    outline: '#76987F',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    bg: '#E3DCF5',
    outline: '#78609F',
  },
  {
    id: 'sand',
    name: 'Sand',
    bg: '#F0E5D8',
    outline: '#8D745E',
  },
  {
    id: 'slate-blue',
    name: 'Slate Blue',
    bg: '#CDD7E5',
    outline: '#4D6789',
  },
  {
    id: 'peach-coral',
    name: 'Peach Coral',
    bg: '#FBDCD2',
    outline: '#BC5E47',
  },
  {
    id: 'butter-yellow',
    name: 'Butter',
    bg: '#FDF1CD',
    outline: '#927725',
  },
  {
    id: 'mint-fresh',
    name: 'Mint',
    bg: '#CEEFE6',
    outline: '#3B7E72',
  },
  {
    id: 'plum-berry',
    name: 'Plum Berry',
    bg: '#F0D5E7',
    outline: '#8E4B7C',
  },
  {
    id: 'fog-charcoal',
    name: 'Charcoal',
    bg: '#E2E4EC',
    outline: '#3A3D46',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    bg: '#F3D2C4',
    outline: '#9A4C32',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    bg: '#F7D6E0',
    outline: '#A1536E',
  },
  {
    id: 'ocean-mist',
    name: 'Ocean Mist',
    bg: '#C5DCE8',
    outline: '#436B82',
  },
  {
    id: 'olive-grove',
    name: 'Olive',
    bg: '#CFD6BC',
    outline: '#5D6A3F',
  },
  {
    id: 'honey-amber',
    name: 'Honey',
    bg: '#FEE0B2',
    outline: '#B06F23',
  },
  {
    id: 'midnight',
    name: 'Midnight Dark',
    bg: '#252936',
    outline: '#6D7796',
  },
  {
    id: 'pure-mono',
    name: 'Monochrome',
    bg: '#EFEFEF',
    outline: '#444444',
  },
];

export const EMOJI_CATEGORIES = [
  {
    name: 'Nature',
    icon: '🌸',
    emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌿', '🌱', '🍃', '🍀', '🪴', '🌵', '🌴', '🌲', '🍁', '🍂', '🍄', '🌾', '🌊'],
  },
  {
    name: 'Animals',
    icon: '🐱',
    emojis: ['🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🦉', '🦋', '🐝', '🐞', '🐢', '🐬', '🐙'],
  },
  {
    name: 'Food',
    icon: '🍓',
    emojis: ['🍓', '🍒', '🍎', '🍉', '🍑', '🍊', '🍋', '🍌', '🍍', '🥑', '🍩', '🧁', '🍦', '🍰', '🍪', '☕', '🍵', '🧋'],
  },
  {
    name: 'Cosmic',
    icon: '✨',
    emojis: ['✨', '⭐', '🌟', '💫', '🌙', '🪐', '🚀', '🛸', '☄️', '🌌', '☀️', '☁️', '⚡', '🌈', '🔮', '💎', '🔥', '🪄'],
  },
  {
    name: 'Vibes',
    icon: '🤍',
    emojis: ['🤍', '💛', '💖', '💝', '🎉', '🎈', '🎨', '🎧', '🎸', '🕹️', '👾', '🧸', '🪷', '🕊️', '🫧', '🕯️', '🧿', '🎐'],
  },
];

export const PRESET_COMBINATIONS = [
  {
    name: 'Bloom',
    emojis: ['🌸', '🌺', '🌷', '✨'],
  },
  {
    name: 'Citrus',
    emojis: ['🍋', '🍊', '🌱', '⭐'],
  },
  {
    name: 'Zen',
    emojis: ['🪷', '🍃', '✨', '🤍'],
  },
  {
    name: 'Cosmos',
    emojis: ['🌙', '🪐', '✨', '🚀'],
  },
  {
    name: 'Bakery',
    emojis: ['🍩', '🧁', '🍪', '☕'],
  },
  {
    name: 'Ocean',
    emojis: ['🌊', '🐬', '🐚', '🏝️'],
  },
];

export const PRESET_THEMES = [
  {
    name: 'Desert Bloom',
    emojis: ['🌸', '🌵', '🌺', '☀️'],
    pattern: 'bloom' as const,
    density: 3,
    paletteId: 'sand',
  },
  {
    name: 'Ocean Wave',
    emojis: ['🌊', '🐬', '🐚', '🏝️'],
    pattern: 'stacks' as const,
    density: 2,
    paletteId: 'ocean-mist',
  },
  {
    name: 'Zen Lotus',
    emojis: ['🪷', '🍃', '✨', '🤍'],
    pattern: 'lotus' as const,
    density: 2,
    paletteId: 'sage-green',
  },
  {
    name: 'Citrus Fresh',
    emojis: ['🍋', '🍊', '🌱', '⭐'],
    pattern: 'mosaic' as const,
    density: 3,
    paletteId: 'butter-yellow',
  },
  {
    name: 'Night Sky',
    emojis: ['🌙', '⭐', '🪐', '✨'],
    pattern: 'prism' as const,
    density: 3,
    paletteId: 'midnight',
  },
  {
    name: 'Sweet Treats',
    emojis: ['🍩', '🧁', '🍪', '☕'],
    pattern: 'scatter' as const,
    density: 3,
    paletteId: 'peach-coral',
  },
  {
    name: 'Botanical Garden',
    emojis: ['🌿', '🪴', '🍃', '🌼'],
    pattern: 'scatter' as const,
    density: 3,
    paletteId: 'sage-green',
  },
  {
    name: 'Starlight Galaxy',
    emojis: ['✨', '🪐', '🌙', '🚀'],
    pattern: 'constellation' as const,
    density: 4,
    paletteId: 'midnight',
  },
];

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  // --- Phone Series (9-series) ---
  {
    id: '19.5:9',
    label: '19.5:9',
    category: 'phone',
    ratioWidth: 9,
    ratioHeight: 19.5,
    description: 'iPhone / Galaxy S / Pixel 全面屏旗舰',
  },
  {
    id: '20:9',
    label: '20:9',
    category: 'phone',
    ratioWidth: 9,
    ratioHeight: 20,
    description: '主流修长全面屏手机',
  },
  {
    id: '20.5:9',
    label: '20.5:9',
    category: 'phone',
    ratioWidth: 9,
    ratioHeight: 20.5,
    description: '超修长比例旗舰机型',
  },
  {
    id: '19:9',
    label: '19:9',
    category: 'phone',
    ratioWidth: 9,
    ratioHeight: 19,
    description: '经典水滴全面屏手机',
  },
  {
    id: '18:9',
    label: '18:9 (2:1)',
    category: 'phone',
    ratioWidth: 9,
    ratioHeight: 18,
    description: '2:1 经典对称全面屏',
  },
  {
    id: '16:9-phone',
    label: '16:9',
    category: 'phone',
    ratioWidth: 9,
    ratioHeight: 16,
    description: '经典传统手机屏幕',
  },

  // --- Desktop Series ---
  {
    id: '16:9-desktop',
    label: '16:9',
    category: 'desktop',
    ratioWidth: 16,
    ratioHeight: 9,
    description: '主流高清/4K PC 显示器',
  },
  {
    id: '32:9',
    label: '32:9',
    category: 'desktop',
    ratioWidth: 32,
    ratioHeight: 9,
    description: '双屏超宽曲面带鱼屏 (Dual QHD/UHD)',
  },

  // --- Tablet Series ---
  {
    id: '3:4',
    label: '3:4 (4:3)',
    category: 'tablet',
    ratioWidth: 3,
    ratioHeight: 4,
    description: 'iPad / 生产力平板标准',
  },
  {
    id: '10:16',
    label: '10:16 (16:10)',
    category: 'tablet',
    ratioWidth: 10,
    ratioHeight: 16,
    description: 'Android 平板 / 华为 MatePad / 小米平板',
  },
  {
    id: '3:2',
    label: '3:2',
    category: 'tablet',
    ratioWidth: 2,
    ratioHeight: 3,
    description: 'Surface / 生产力二合一轻薄本',
  },

  // --- Square Series ---
  {
    id: '1:1',
    label: '1:1',
    category: 'square',
    ratioWidth: 1,
    ratioHeight: 1,
    description: '社交高清头像 / 正方壁纸 / 唱片封面',
  },
];

export const RESOLUTION_TIERS: {
  id: ResolutionTier;
  label: string;
  badge: string;
  shortDimension: number;
}[] = [
  { id: '1080p', label: '1080P', badge: '全高清 FHD', shortDimension: 1080 },
  { id: '1.5k', label: '1.5K', badge: '超清 Retina', shortDimension: 1260 },
  { id: '2k', label: '2K', badge: '极清 2K QHD', shortDimension: 1440 },
  { id: '4k', label: '4K', badge: '原画 4K UHD', shortDimension: 2160 },
];

/**
 * Calculates exact physical pixel dimensions for export given preset, orientation, and resolution tier.
 */
export function calculateExportDimensions(
  preset: AspectRatioPreset,
  orientation: Orientation,
  resolutionTier: ResolutionTier
): ResolvedExportDimension {
  const tierConfig =
    RESOLUTION_TIERS.find((t) => t.id === resolutionTier) ||
    RESOLUTION_TIERS[0];
  const shortBase = tierConfig.shortDimension;

  // Determine normalized ratio: wRatio and hRatio
  let wRatio = preset.ratioWidth;
  let hRatio = preset.ratioHeight;

  // If orientation is landscape and the preset was originally defined as vertical (wRatio < hRatio)
  if (orientation === 'landscape' && wRatio < hRatio) {
    const temp = wRatio;
    wRatio = hRatio;
    hRatio = temp;
  } else if (orientation === 'portrait' && wRatio > hRatio) {
    const temp = wRatio;
    wRatio = hRatio;
    hRatio = temp;
  }

  // Calculate width and height such that the shorter side matches shortBase (or square for 1:1)
  let width: number;
  let height: number;

  if (wRatio === hRatio) {
    width = shortBase;
    height = shortBase;
  } else if (wRatio > hRatio) {
    // Landscape: short side is height
    height = shortBase;
    width = Math.round((shortBase * wRatio) / hRatio);
  } else {
    // Portrait: short side is width
    width = shortBase;
    height = Math.round((shortBase * hRatio) / wRatio);
  }

  // Ensure dimensions are even numbers (standard video & graphics requirement)
  width = Math.round(width / 2) * 2;
  height = Math.round(height / 2) * 2;

  const orientationText = orientation === 'portrait' ? '竖屏' : '横屏';
  return {
    width,
    height,
    label: `${width} × ${height} px (${preset.label} ${orientationText} · ${tierConfig.label})`,
    aspectRatio: width / height,
  };
}
