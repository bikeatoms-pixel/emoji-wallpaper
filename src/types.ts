export type PatternType =
  | 'mosaic'
  | 'lotus'
  | 'bloom'
  | 'stacks'
  | 'prism'
  | 'scatter'
  | 'constellation'
  | 'convex'
  | 'concave';

export type EmojiStyle = 'outline' | 'vector' | 'native' | 'monochrome' | 'color';

export interface EmojiItem {
  id: string;
  char: string;
  style: EmojiStyle;
}

export interface ColorPalette {
  id: string;
  name: string;
  bg: string;
  outline: string;
}

export interface ViewportOffset {
  x: number;
  y: number;
}

export interface WallpaperConfig {
  emojis: EmojiItem[];
  pattern: PatternType;
  density: number;
  palette: ColorPalette;
  viewportOffset: ViewportOffset;
  scale: number;
}

export type ActiveTab = 'emoji' | 'patterns' | 'colors';

export type DeviceCategory = 'phone' | 'desktop' | 'tablet' | 'square';

export type Orientation = 'portrait' | 'landscape';

export type ResolutionTier = '1080p' | '1.5k' | '2k' | '4k';

export interface AspectRatioPreset {
  id: string;
  label: string; // e.g. "19.5:9", "16:9", "3:4"
  category: DeviceCategory;
  ratioWidth: number; // e.g. 9 in 9:16 portrait, or 19.5 in 19.5:9
  ratioHeight: number; // e.g. 19.5 in 9:19.5
  description: string;
}

export interface ResolvedExportDimension {
  width: number;
  height: number;
  label: string;
  aspectRatio: number; // width / height
}
