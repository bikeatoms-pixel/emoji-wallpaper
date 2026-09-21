export type PatternType =
  | 'mosaic'
  | 'lotus'
  | 'bloom'
  | 'stacks'
  | 'prism'
  | 'scatter'
  | 'constellation';

export interface ColorPalette {
  id: string;
  name: string;
  bg: string;
  outline: string;
}

export interface WallpaperConfig {
  emojis: string[];
  pattern: PatternType;
  density: number; // 1 (sparse) to 5 (dense)
  palette: ColorPalette;
}

export type ActiveTab = 'emoji' | 'patterns' | 'colors';

export interface ExportOption {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
}
