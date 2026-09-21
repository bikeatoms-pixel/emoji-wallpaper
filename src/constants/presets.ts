import { ColorPalette, ExportOption } from '../types';

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
    bg: '#F7D6CA',
    outline: '#A65239',
  },
  {
    id: 'forest-moss',
    name: 'Forest Moss',
    bg: '#D4E5D4',
    outline: '#4B6E4E',
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    bg: '#D3E7FA',
    outline: '#3D6F9E',
  },
  // Dark mode pairs
  {
    id: 'midnight',
    name: 'Midnight',
    bg: '#1A1E29',
    outline: '#8CA5D8',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    bg: '#1F2024',
    outline: '#CACBD6',
  },
  {
    id: 'deep-pine',
    name: 'Deep Pine',
    bg: '#17251D',
    outline: '#88C096',
  },
  {
    id: 'espresso',
    name: 'Espresso',
    bg: '#271D18',
    outline: '#D6A581',
  },
];

export const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: ['😀', '😎', '🥹', '🥳', '🤩', '😇', '🤠', '😴', '🤓', '🤖', '👻', '👽', '👾', '🎃'],
  },
  {
    name: 'Nature & Animals',
    icon: '🦊',
    emojis: ['🦊', '🌿', '🌸', '🐱', '🐶', '🐻', '🐼', '🦁', '🐸', '🦋', '🐝', '🍄', '🌻', '🌵'],
  },
  {
    name: 'Food & Drink',
    icon: '☕',
    emojis: ['☕', '🍕', '🥑', '🍣', '🍦', '🍩', '🍓', '🍒', '🥐', '🍔', '🌮', '🧋', '🍿', '🍇'],
  },
  {
    name: 'Activities & Vibe',
    icon: '✨',
    emojis: ['✨', '🚀', '⚡', '🎮', '🎨', '🎵', '📚', '💡', '🔮', '💎', '🧭', '🛸', '🎯', '🏆'],
  },
  {
    name: 'Symbols & Sky',
    icon: '❤️',
    emojis: ['❤️', '💫', '🌙', '☀️', '☁️', '🌊', '🔥', '🌈', '🍀', '🪐', '🕊️', '⚓', '🧿', '⭐'],
  },
];

export const PRESET_COMBINATIONS = [
  {
    name: 'Pixel Botanic',
    emojis: ['🦊', '🌿', '☕', '✨'],
    pattern: 'mosaic' as const,
    density: 3,
    paletteId: 'sage-green',
  },
  {
    name: 'Cozy Morning',
    emojis: ['☕', '🥐', '✨', '🌸'],
    pattern: 'lotus' as const,
    density: 3,
    paletteId: 'sand',
  },
  {
    name: 'Cosmic Drift',
    emojis: ['🚀', '🪐', '🛸', '✨'],
    pattern: 'bloom' as const,
    density: 4,
    paletteId: 'midnight',
  },
  {
    name: 'Lavender Dreams',
    emojis: ['🦋', '🌸', '✨', '🌙'],
    pattern: 'prism' as const,
    density: 3,
    paletteId: 'lavender',
  },
  {
    name: 'Retro Arcade',
    emojis: ['👾', '🎮', '⚡', '🤖'],
    pattern: 'stacks' as const,
    density: 3,
    paletteId: 'slate-blue',
  },
  {
    name: 'Floating Meadow',
    emojis: ['🍄', '🌿', '🌼', '🐞'],
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

export const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'phone',
    name: 'Phone Resolution (Pixel 8/9 Pro)',
    width: 1440,
    height: 3120,
    description: '1440 × 3120 px (19.5:9 Ultra-sharp)',
  },
  {
    id: 'screen',
    name: 'Current Screen Size',
    width: 0, // dynamic
    height: 0, // dynamic
    description: 'Matches your current screen resolution',
  },
  {
    id: 'desktop',
    name: 'Desktop 4K',
    width: 3840,
    height: 2160,
    description: '3840 × 2160 px (16:9 Landscape)',
  },
  {
    id: 'square',
    name: 'Square / Social',
    width: 1440,
    height: 1440,
    description: '1440 × 1440 px (1:1 Ratio)',
  },
];
