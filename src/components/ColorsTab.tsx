import React, { useState } from 'react';
import { ColorPalette } from '../types';
import { COLOR_PALETTES } from '../constants/presets';
import { ArrowLeftRight, Check, SlidersHorizontal } from 'lucide-react';

interface ColorsTabProps {
  palette: ColorPalette;
  onPaletteChange: (palette: ColorPalette) => void;
  accentColor: string;
}

export const ColorsTab: React.FC<ColorsTabProps> = ({
  palette,
  onPaletteChange,
  accentColor,
}) => {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Invert current palette (swap bg and outline)
  const handleSwapColors = () => {
    onPaletteChange({
      ...palette,
      id: `${palette.id}-inverted`,
      bg: palette.outline,
      outline: palette.bg,
    });
  };

  const handleCustomBgChange = (bg: string) => {
    onPaletteChange({
      id: 'custom',
      name: 'Custom',
      bg,
      outline: palette.outline,
    });
  };

  const handleCustomOutlineChange = (outline: string) => {
    onPaletteChange({
      id: 'custom',
      name: 'Custom',
      bg: palette.bg,
      outline,
    });
  };

  return (
    <div id="colors-tab-panel" className="space-y-4">
      {/* Active Color Preview & Actions */}
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-3.5 border border-black/5 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Split Color Swatch preview */}
          <div
            className="w-11 h-11 rounded-full shadow-inner border border-black/10 overflow-hidden relative flex-shrink-0"
            style={{ backgroundColor: palette.bg }}
          >
            {/* Split diagonal or inner ring */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 border-l border-black/10"
              style={{ backgroundColor: palette.outline }}
            />
          </div>

          <div>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 block">
              {palette.name}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              BG {palette.bg.toUpperCase()} • OUTLINE {palette.outline.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Swap Colors button */}
          <button
            id="swap-colors-button"
            onClick={handleSwapColors}
            title="Invert background and outline colors"
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
          >
            <ArrowLeftRight size={13} />
            <span className="hidden sm:inline">Swap</span>
          </button>

          {/* Toggle Custom Picker button */}
          <button
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            title="Custom color pickers"
            className={`p-1.5 rounded-xl border text-xs cursor-pointer shadow-xs transition-all ${
              showCustomPicker
                ? 'bg-zinc-800 text-white border-zinc-800'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Custom Color Fine-Tuning */}
      {showCustomPicker && (
        <div className="p-3.5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
            Custom Hex Color Tuning
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-400 block mb-1 font-medium">
                Wallpaper Background
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={palette.bg}
                  onChange={(e) => handleCustomBgChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-black/10 cursor-pointer overflow-hidden"
                />
                <input
                  type="text"
                  value={palette.bg}
                  onChange={(e) => handleCustomBgChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-400 block mb-1 font-medium">
                Emoji Outline Tint
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={palette.outline}
                  onChange={(e) => handleCustomOutlineChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-black/10 cursor-pointer overflow-hidden"
                />
                <input
                  type="text"
                  value={palette.outline}
                  onChange={(e) => handleCustomOutlineChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material You Dual-Tone Preset Grid */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
          Material You Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
          {COLOR_PALETTES.map((item) => {
            const isSelected =
              palette.bg.toLowerCase() === item.bg.toLowerCase() &&
              palette.outline.toLowerCase() === item.outline.toLowerCase();

            return (
              <button
                key={item.id}
                onClick={() => onPaletteChange(item)}
                className={`flex items-center space-x-2.5 p-2 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-800 shadow-md ring-2'
                    : 'bg-white/50 dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 border-zinc-200/60 dark:border-zinc-700/60'
                }`}
                style={{
                  borderColor: isSelected ? accentColor : undefined,
                  boxShadow: isSelected ? `0 2px 10px -1px ${accentColor}25` : undefined,
                }}
              >
                {/* Dual-Tone Circular Swatch (Split 50/50) */}
                <div
                  className="w-8 h-8 rounded-full border border-black/10 relative overflow-hidden flex-shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.bg }}
                >
                  <div
                    className="absolute inset-y-0 right-0 w-1/2 border-l border-black/10"
                    style={{ backgroundColor: item.outline }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15 backdrop-blur-2xs">
                      <Check size={14} className="text-white drop-shadow-xs" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate block">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    {item.bg}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
