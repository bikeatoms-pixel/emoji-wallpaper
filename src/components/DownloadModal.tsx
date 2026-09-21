import React, { useState } from 'react';
import { X, Download, Smartphone, Monitor, Square, Check, Loader2, Sparkles } from 'lucide-react';
import { WallpaperConfig, ExportOption } from '../types';
import { EXPORT_OPTIONS } from '../constants/presets';
import { renderWallpaper } from '../services/canvasRenderer';
import { precacheEmojis } from '../services/emojiService';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WallpaperConfig;
  accentColor: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  config,
  accentColor,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>('phone');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      // 1. Ensure emojis are cached
      await precacheEmojis(config.emojis, config.palette.outline);

      // 2. Determine target dimensions
      let targetWidth = 1440;
      let targetHeight = 3120;

      if (selectedOptionId === 'screen') {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        targetWidth = Math.round(window.innerWidth * dpr);
        targetHeight = Math.round(window.innerHeight * dpr);
      } else {
        const opt = EXPORT_OPTIONS.find((o) => o.id === selectedOptionId);
        if (opt && opt.width > 0 && opt.height > 0) {
          targetWidth = opt.width;
          targetHeight = opt.height;
        }
      }

      // 3. Create high-resolution offscreen canvas
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = targetWidth;
      offscreenCanvas.height = targetHeight;

      renderWallpaper({
        canvas: offscreenCanvas,
        config,
        customWidth: targetWidth,
        customHeight: targetHeight,
      });

      // 4. Convert to lossless PNG blob
      offscreenCanvas.toBlob((blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const patternName = config.pattern;
        const paletteName = config.palette.name.toLowerCase().replace(/\s+/g, '-');
        a.download = `pixel-emoji-workshop-${paletteName}-${patternName}-${targetWidth}x${targetHeight}.png`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        setDownloadSuccess(true);
        setTimeout(() => {
          setDownloadSuccess(false);
        }, 3000);
      }, 'image/png');
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'phone':
        return <Smartphone size={20} />;
      case 'desktop':
        return <Monitor size={20} />;
      case 'square':
        return <Square size={20} />;
      default:
        return <Sparkles size={20} />;
    }
  };

  return (
    <div
      id="download-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="download-modal-container"
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-zinc-800 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Download Wallpaper
            </h3>
            <p className="text-xs text-zinc-500">
              Export pixel-perfect lossless PNG
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Resolution Options */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
            Select Resolution
          </span>
          <div className="grid grid-cols-1 gap-2">
            {EXPORT_OPTIONS.map((opt: ExportOption) => {
              const isSelected = selectedOptionId === opt.id;
              const displayText =
                opt.id === 'screen'
                  ? `${window.innerWidth} × ${window.innerHeight} px (Current Window)`
                  : opt.description;

              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-50 dark:bg-zinc-800/90 shadow-xs ring-2'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                  }`}
                  style={{
                    borderColor: isSelected ? accentColor : undefined,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? `${accentColor}20` : '#F4F4F5',
                        color: isSelected ? accentColor : '#71717A',
                      }}
                    >
                      {getIcon(opt.id)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {opt.name}
                        </span>
                        {opt.id === 'phone' && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{displayText}</span>
                    </div>
                  </div>

                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: isSelected ? accentColor : '#A1A1AA',
                    }}
                  >
                    {isSelected && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="confirm-download-wallpaper-button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all hover:brightness-105 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor }}
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Rendering High-Res Wallpaper...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check size={18} />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Save Lossless PNG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
