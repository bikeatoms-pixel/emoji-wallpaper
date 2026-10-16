import React from 'react';
import { Download, Smartphone, Maximize2, Sparkles } from 'lucide-react';

interface TopAppBarProps {
  showLockOverlay: boolean;
  onToggleLockOverlay: () => void;
  onToggleFullscreen: () => void;
  onOpenDownload: () => void;
  accentColor: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  showLockOverlay,
  onToggleLockOverlay,
  onToggleFullscreen,
  onOpenDownload,
  accentColor,
}) => {
  return (
    <header
      id="top-app-bar"
      className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 pointer-events-auto transition-opacity duration-200"
    >
      {/* Brand Title Pill */}
      <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs border border-black/5">
        <div
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex items-center space-x-1.5">
          <Sparkles size={14} style={{ color: accentColor }} />
          <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Emoji Workshop
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Toggle Lock Screen Simulation */}
        <button
          id="toggle-lock-screen-button"
          onClick={onToggleLockOverlay}
          title={showLockOverlay ? 'Hide Lock Screen Preview' : 'Show Lock Screen Preview'}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs border border-black/5 transition-all cursor-pointer ${
            showLockOverlay
              ? 'bg-zinc-900 text-white'
              : 'bg-white/70 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-200 hover:bg-white'
          }`}
        >
          <Smartphone size={14} />
          <span className="hidden sm:inline">
            {showLockOverlay ? 'Mockup On' : 'Lock Screen'}
          </span>
        </button>

        {/* Fullscreen Clean View */}
        <button
          id="toggle-fullscreen-button"
          onClick={onToggleFullscreen}
          title="Full-screen clean wallpaper preview"
          className="w-8 h-8 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-xs border border-black/5 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-white transition-all cursor-pointer"
        >
          <Maximize2 size={14} />
        </button>

        {/* Prominent Download Button */}
        <button
          id="download-wallpaper-header-button"
          onClick={onOpenDownload}
          title="Download Wallpaper (PNG)"
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-md transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          <Download size={14} />
          <span>Download</span>
        </button>
      </div>
    </header>
  );
};
