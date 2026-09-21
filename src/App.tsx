import { useState, useCallback, useEffect } from 'react';
import { WallpaperConfig, PatternType, ColorPalette, ActiveTab } from './types';
import { COLOR_PALETTES, EMOJI_CATEGORIES } from './constants/presets';
import { WallpaperCanvas } from './components/WallpaperCanvas';
import { LockScreenOverlay } from './components/LockScreenOverlay';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavigation } from './components/BottomNavigation';
import { EmojiTab } from './components/EmojiTab';
import { PatternsTab } from './components/PatternsTab';
import { ColorsTab } from './components/ColorsTab';
import { RandomizeButton } from './components/RandomizeButton';
import { DownloadModal } from './components/DownloadModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
const PATTERNS: PatternType[] = [
  'mosaic',
  'lotus',
  'bloom',
  'stacks',
  'prism',
  'scatter',
  'constellation',
];

export default function App() {
  // Default Wallpaper Configuration initialized to Pixel signature Sage Green Mosaic
  const [config, setConfig] = useState<WallpaperConfig>({
    emojis: ['🦊', '🌿', '☕', '✨'],
    pattern: 'mosaic',
    density: 3,
    palette: COLOR_PALETTES[0], // Sage Green (#B4CAB8 & #76987F)
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('emoji');
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(true);
  const [isCleanView, setIsCleanView] = useState<boolean>(false);
  const [showLockOverlay, setShowLockOverlay] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  // Randomize all wallpaper dimensions
  const handleRandomize = useCallback(() => {
    // 1. Pick 2-4 random unique emojis
    const count = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...ALL_EMOJIS].sort(() => 0.5 - Math.random());
    const randomEmojis = shuffled.slice(0, count);

    // 2. Pick random layout
    const randomPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];

    // 3. Pick random palette
    const randomPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];

    // 4. Random density (1 to 5)
    const randomDensity = 1 + Math.floor(Math.random() * 5);

    setConfig({
      emojis: randomEmojis,
      pattern: randomPattern,
      palette: randomPalette,
      density: randomDensity,
    });
  }, []);

  // Keyboard shortcut: space to randomize (if not typing in input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        handleRandomize();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRandomize]);

  // Handle clicking wallpaper canvas
  const handleCanvasClick = () => {
    if (isCleanView) {
      setIsCleanView(false);
    }
  };

  const accentColor = config.palette.outline;

  return (
    <ErrorBoundary>
      <div
        id="app-container"
        className="fixed inset-0 w-full h-full overflow-hidden select-none font-sans"
        style={{
          backgroundColor: config.palette.bg,
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* 1. Full-Screen Wallpaper Preview in Background */}
        <WallpaperCanvas
          config={config}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />

      {/* 2. Optional Authentic Pixel Lock Screen Simulation Overlay */}
      {showLockOverlay && <LockScreenOverlay color={config.palette.outline} />}

      {/* 3. Clean View Exit Floating Pill (shown only when controls are hidden) */}
      <AnimatePresence>
        {isCleanView && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto"
          >
            <button
              onClick={() => setIsCleanView(false)}
              className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center space-x-2 shadow-lg border border-white/20 hover:bg-black/80 transition-all cursor-pointer"
            >
              <Eye size={14} />
              <span>Tap to Show Controls</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Top App Bar */}
      <AnimatePresence>
        {!isCleanView && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <TopAppBar
              showLockOverlay={showLockOverlay}
              onToggleLockOverlay={() => setShowLockOverlay(!showLockOverlay)}
              onToggleFullscreen={() => setIsCleanView(true)}
              onOpenDownload={() => setIsDownloadOpen(true)}
              accentColor={accentColor}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Floating 'Randomize' Button */}
      <AnimatePresence>
        {!isCleanView && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute right-6 z-30 pointer-events-auto"
            style={{
              bottom: isSheetExpanded ? 'calc(55vh + 16px)' : '80px',
              transition: 'bottom 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
          >
            <RandomizeButton
              onRandomize={handleRandomize}
              accentColor={accentColor}
              bgColor="#FFFFFF"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Material 3 Bottom Sheet / Drawer with 3 Tabs */}
      <AnimatePresence>
        {!isCleanView && (
          <motion.aside
            id="pixel-bottom-sheet"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            aria-label="Wallpaper controls"
            className="absolute bottom-0 inset-x-0 z-30 flex flex-col pointer-events-auto shadow-2xl rounded-t-3xl sm:rounded-t-[32px] overflow-hidden backdrop-blur-2xl bg-white/85 dark:bg-zinc-950/85 border-t border-black/10 dark:border-white/10 max-w-2xl mx-auto"
            style={{
              maxHeight: isSheetExpanded ? '55vh' : 'auto',
              transition: 'max-height 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
            }}
          >
            {/* Sheet Top Bar with Collapse/Expand Toggle */}
            <div className="relative flex items-center justify-between px-5 pt-3 pb-2 border-b border-black/5 dark:border-white/5">
              {/* Center Drag Handle / Pill */}
              <button
                onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 mx-auto cursor-pointer transition-colors block"
                title={isSheetExpanded ? 'Collapse panel' : 'Expand panel'}
              />

              <button
                onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                className="absolute right-4 top-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer transition-colors"
                title={isSheetExpanded ? 'Collapse' : 'Expand'}
              >
                {isSheetExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>

            {/* Tab Body Content (when expanded) */}
            {isSheetExpanded && (
              <div
                id="tab-content-container"
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
                style={{ maxHeight: 'calc(55vh - 110px)' }}
              >
                {activeTab === 'emoji' && (
                  <EmojiTab
                    emojis={config.emojis}
                    onChange={(newEmojis) => setConfig({ ...config, emojis: newEmojis })}
                    accentColor={accentColor}
                  />
                )}

                {activeTab === 'patterns' && (
                  <PatternsTab
                    pattern={config.pattern}
                    density={config.density}
                    onPatternChange={(pattern) => setConfig({ ...config, pattern })}
                    onDensityChange={(density) => setConfig({ ...config, density })}
                    accentColor={accentColor}
                  />
                )}

                {activeTab === 'colors' && (
                  <ColorsTab
                    palette={config.palette}
                    onPaletteChange={(palette) => setConfig({ ...config, palette })}
                    accentColor={accentColor}
                  />
                )}
              </div>
            )}

            {/* Bottom 3-Tab Navigation Bar */}
            <BottomNavigation
              activeTab={activeTab}
              onTabSelect={(tab) => {
                setActiveTab(tab);
                if (!isSheetExpanded) {
                  setIsSheetExpanded(true);
                }
              }}
              accentColor={accentColor}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 7. Download High-Res Wallpaper Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        config={config}
        accentColor={accentColor}
      />
      </div>
    </ErrorBoundary>
  );
}
