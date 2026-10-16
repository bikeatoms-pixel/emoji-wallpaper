import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Check,
  Loader2,
  RotateCcw,
  Smartphone,
  Monitor,
  Tablet,
  Square,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import {
  WallpaperConfig,
  DeviceCategory,
  Orientation,
  ResolutionTier,
  AspectRatioPreset,
  ViewportOffset,
} from '../types';
import {
  ASPECT_RATIO_PRESETS,
  RESOLUTION_TIERS,
  calculateExportDimensions,
} from '../constants/presets';
import { WallpaperCanvas } from './WallpaperCanvas';
import { renderWallpaper } from '../services/canvasRenderer';
import { precacheEmojis } from '../services/emojiService';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WallpaperConfig;
  accentColor: string;
}

const CATEGORY_TABS: { id: DeviceCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'phone', label: '手机', icon: <Smartphone size={14} /> },
  { id: 'desktop', label: '电脑', icon: <Monitor size={14} /> },
  { id: 'tablet', label: '平板', icon: <Tablet size={14} /> },
  { id: 'square', label: '方图', icon: <Square size={14} /> },
];

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  config,
  accentColor,
}) => {
  // Category & Selected Preset
  const [activeCategory, setActiveCategory] = useState<DeviceCategory>('phone');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('19.5:9');

  // Orientation & Resolution
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [resolutionTier, setResolutionTier] = useState<ResolutionTier>('2k');

  // Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Local interactive viewport state inside preview frame
  const [previewOffset, setPreviewOffset] = useState<ViewportOffset>({ x: 0, y: 0 });
  const [previewScale, setPreviewScale] = useState<number>(1.0);

  // Reference for measuring preview frame dimensions
  const frameContainerRef = useRef<HTMLDivElement | null>(null);
  const [frameDimensions, setFrameDimensions] = useState<{ width: number; height: number }>({
    width: 180,
    height: 390,
  });

  // Filter presets by active category
  const categoryPresets = ASPECT_RATIO_PRESETS.filter((p) => p.category === activeCategory);
  const currentPreset =
    ASPECT_RATIO_PRESETS.find((p) => p.id === selectedPresetId) ||
    categoryPresets[0] ||
    ASPECT_RATIO_PRESETS[0];

  // Calculate real-time pixel dimensions
  const resolvedExport = calculateExportDimensions(currentPreset, orientation, resolutionTier);

  // Initialize preview viewport when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewOffset(config.viewportOffset || { x: 0, y: 0 });
      setPreviewScale(config.scale || 1.0);
      setDownloadSuccess(false);
    }
  }, [isOpen, config.viewportOffset, config.scale]);

  // Adjust default orientation when category changes
  const handleCategoryChange = (category: DeviceCategory) => {
    setActiveCategory(category);
    const presetsInCat = ASPECT_RATIO_PRESETS.filter((p) => p.category === category);
    if (presetsInCat.length > 0) {
      setSelectedPresetId(presetsInCat[0].id);
    }
    if (category === 'desktop') {
      setOrientation('landscape');
    } else if (category === 'phone') {
      setOrientation('portrait');
    }
  };

  // Compute responsive frame size based on aspect ratio and container limits
  useEffect(() => {
    const updateDimensions = () => {
      // Max preview area limits
      const maxH = Math.min(window.innerHeight * 0.40, 360);
      const maxW = Math.min(window.innerWidth - 64, 420);
      const ratio = resolvedExport.aspectRatio; // width / height

      let h = maxH;
      let w = Math.round(h * ratio);

      if (w > maxW) {
        w = maxW;
        h = Math.round(w / ratio);
      }

      setFrameDimensions({ width: Math.max(100, w), height: Math.max(100, h) });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [resolvedExport.aspectRatio]);

  if (!isOpen) return null;

  const previewConfig: WallpaperConfig = {
    ...config,
    viewportOffset: previewOffset,
    scale: previewScale,
  };

  const handleResetFrame = () => {
    setPreviewOffset({ x: 0, y: 0 });
    setPreviewScale(1.0);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      // 1. Ensure all emojis and recolored vectors are ready
      await precacheEmojis(config.emojis, config.palette.outline);

      const targetWidth = resolvedExport.width;
      const targetHeight = resolvedExport.height;
      const frameW = frameDimensions.width;
      const frameH = frameDimensions.height;

      // 2. High-precision offscreen canvas with resolutionScale WYSIWYG
      const offscreenCanvas = document.createElement('canvas');
      const resMultiplier = targetWidth / frameW;

      renderWallpaper({
        canvas: offscreenCanvas,
        config: previewConfig,
        customWidth: frameW,
        customHeight: frameH,
        resolutionScale: resMultiplier,
      });

      // 3. Lossless PNG export
      offscreenCanvas.toBlob((blob) => {
        if (!blob) {
          setIsExporting(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const patternName = config.pattern;
        const ratioSlug = currentPreset.label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        a.download = `pixel-wallpaper-${patternName}-${ratioSlug}-${orientation}-${resolutionTier}-${targetWidth}x${targetHeight}.png`;
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

  return (
    <div
      id="download-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="download-modal-container"
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-black/10 dark:border-zinc-800 space-y-4 my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <Sparkles size={18} style={{ color: accentColor }} />
              <span>壁纸裁切与多比例导出</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              支持各设备多比例、横竖屏切换与 1080P/1.5K/2K/4K 高清光栅化导出
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Device Category Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleCategoryChange(tab.id)}
                type="button"
                className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Aspect Ratio Selector within Category */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500 px-0.5">
            <span>比例选择 ({categoryPresets.length} 款)</span>
            <span className="text-zinc-400 text-[11px] truncate max-w-[240px]">
              {currentPreset.description}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {categoryPresets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow font-bold'
                      : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-transparent'
                  }`}
                  style={{
                    borderColor: isSelected ? accentColor : undefined,
                  }}
                >
                  <span className="text-xs font-semibold">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Orientation & Resolution Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
          {/* Orientation Toggle */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-500">屏幕方向 (Orientation)</span>
            <div className="flex space-x-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Smartphone size={13} />
                <span>竖屏 (Portrait)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Monitor size={13} />
                <span>横屏 (Landscape)</span>
              </button>
            </div>
          </div>

          {/* Resolution Tier Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
              <span>分辨率画质 (Resolution)</span>
              <span className="font-mono text-[10px] text-zinc-400">
                {resolvedExport.width} × {resolvedExport.height}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
              {RESOLUTION_TIERS.map((tier) => {
                const isSelected = resolutionTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setResolutionTier(tier.id)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Interactive WYSIWYG Preview Safe Frame */}
        <div
          ref={frameContainerRef}
          className="relative flex items-center justify-center py-2 px-4 rounded-2xl bg-zinc-100/90 dark:bg-zinc-950/90 border border-black/5 dark:border-white/5 overflow-hidden"
          style={{ minHeight: '220px' }}
        >
          {/* Wallpaper Aspect Ratio Bounding Safe Box */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl ring-2 ring-black/20 dark:ring-white/20 transition-all duration-300"
            style={{
              width: `${frameDimensions.width}px`,
              height: `${frameDimensions.height}px`,
              backgroundColor: config.palette.bg,
            }}
          >
            {/* Interactive Canvas directly inside Frame */}
            <WallpaperCanvas
              config={previewConfig}
              onViewportChange={(offset, scale) => {
                setPreviewOffset(offset);
                if (typeof scale === 'number') {
                  setPreviewScale(scale);
                }
              }}
              interactive={true}
              className="absolute inset-0 w-full h-full"
            />

            {/* Smartphone Notch / Punch-hole Overlay for Phone Portrait Ratios */}
            {activeCategory === 'phone' && orientation === 'portrait' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3 rounded-full bg-black/40 backdrop-blur-xs pointer-events-none z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-black/60" />
              </div>
            )}

            {/* Subtle Rule-of-Thirds Safety Grid & Corner Marks */}
            <div className="absolute inset-0 pointer-events-none border border-black/10 dark:border-white/10 rounded-2xl" />

            {/* Floating Zoom & Pan Info Indicator */}
            <div className="absolute bottom-2 left-2 z-20 pointer-events-none bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-mono text-white/90">
              {previewScale.toFixed(2)}x
            </div>

            {/* Floating Reset Center Button */}
            <button
              onClick={handleResetFrame}
              type="button"
              title="重置居中"
              className="absolute bottom-2 right-2 z-20 p-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* 5. Export Action Bar */}
        <div className="pt-1 space-y-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`w-full py-3 px-5 rounded-2xl font-bold text-sm text-white flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'hover:brightness-105 active:scale-[0.99]'
            }`}
            style={{
              backgroundColor: downloadSuccess ? undefined : accentColor,
            }}
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>正在以物理分辨率高精光栅化生成...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check size={18} />
                <span>已成功下载高清壁纸！</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>确认下载高清 PNG ({resolvedExport.width} × {resolvedExport.height})</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
            <span className="flex items-center space-x-1">
              <Maximize2 size={11} />
              <span>{resolvedExport.label}</span>
            </span>
            <span>无损 PNG · 所见即所得</span>
          </div>
        </div>
      </div>
    </div>
  );
};
