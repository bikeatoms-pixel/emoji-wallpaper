import React, { useEffect, useRef, useCallback } from 'react';
import { WallpaperConfig } from '../types';
import { renderWallpaper } from '../services/canvasRenderer';
import { precacheEmojis, subscribeEmojiAssetUpdate } from '../services/emojiService';

interface WallpaperCanvasProps {
  config: WallpaperConfig;
  className?: string;
  onClick?: () => void;
}

export const WallpaperCanvas: React.FC<WallpaperCanvasProps> = ({
  config,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Redraw canvas helper with strict width > 0 && height > 0 validation
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Strict legality check: container width & height must be strictly positive
    const contW = container.clientWidth;
    const contH = container.clientHeight;
    if (!contW || !contH || contW <= 0 || contH <= 0 || isNaN(contW) || isNaN(contH)) {
      // Geometry not settled or canvas unmounted: pause drawing
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(contW * dpr);
    const height = Math.round(contH * dpr);

    if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
      return;
    }

    renderWallpaper({
      canvas,
      config,
      customWidth: width,
      customHeight: height,
    });
  }, [config]);

  // Render on animation frame when config updates or mounted
  useEffect(() => {
    const animId = requestAnimationFrame(() => {
      draw();
    });
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Non-blocking precaching of emojis in background
  useEffect(() => {
    precacheEmojis(config.emojis, config.palette.outline);
  }, [config.emojis, config.palette.outline]);

  // When newly fetched SVGs arrive from CDN, redraw safely
  useEffect(() => {
    const unsubscribe = subscribeEmojiAssetUpdate(() => {
      draw();
    });
    return unsubscribe;
  }, [draw]);

  // Robust resize observation with width/height validation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            draw();
          }
        }
      });
      resizeObserver.observe(container);
    }

    const handleWindowResize = () => {
      draw();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      id="wallpaper-canvas-container"
      onClick={onClick}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none ${className}`}
      style={{ backgroundColor: config.palette.bg }}
    >
      <canvas
        ref={canvasRef}
        id="wallpaper-canvas"
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
