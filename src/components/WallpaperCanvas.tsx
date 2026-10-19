import React, { useEffect, useRef, useCallback, useState } from 'react';
import { WallpaperConfig, ViewportOffset } from '../types';
import { renderWallpaper } from '../services/canvasRenderer';
import { precacheEmojis, subscribeEmojiAssetUpdate } from '../services/emojiService';

interface WallpaperCanvasProps {
  config: WallpaperConfig;
  className?: string;
  onClick?: () => void;
  onViewportChange?: (offset: ViewportOffset, scale?: number) => void;
  interactive?: boolean; // defaults to true
}

export const WallpaperCanvas: React.FC<WallpaperCanvasProps> = ({
  config,
  className = '',
  onClick,
  onViewportChange,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag & Pinch state refs
  const isDraggingRef = useRef(false);
  const isPinchingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number } | null>(null);
  const pinchStartRef = useRef<{
    dist: number;
    scale: number;
    midX: number;
    midY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  // Redraw canvas helper
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const contW = container.clientWidth;
    const contH = container.clientHeight;
    if (!contW || !contH || contW <= 0 || contH <= 0 || isNaN(contW) || isNaN(contH)) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderWallpaper({
      canvas,
      config,
      customWidth: contW,
      customHeight: contH,
      resolutionScale: dpr,
    });
  }, [config]);

  // Render on animation frame
  useEffect(() => {
    const animId = requestAnimationFrame(() => {
      draw();
    });
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Precache emojis
  useEffect(() => {
    precacheEmojis(config.emojis, config.palette.outline);
  }, [config.emojis, config.palette.outline]);

  // Asset load subscription
  useEffect(() => {
    const unsubscribe = subscribeEmojiAssetUpdate(() => {
      draw();
    });
    return unsubscribe;
  }, [draw]);

  // ResizeObserver
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

    const handleWindowResize = () => draw();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [draw]);

  // Wheel Zoom Listener (Non-passive to allow e.preventDefault)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !interactive) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!onViewportChange) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentScale = Math.max(0.2, Math.min(5.0, config.scale || 1.0));
      const currentPanX = config.viewportOffset?.x || 0;
      const currentPanY = config.viewportOffset?.y || 0;

      // Smooth exponential zoom
      const zoomFactor = 1 - e.deltaY * 0.0015;
      const newScale = Math.min(Math.max(0.2, currentScale * zoomFactor), 5.0);

      // Invariant mouse cursor world coordinate compensation
      const scaleRatio = newScale / currentScale;
      const newPanX = mouseX - (mouseX - currentPanX) * scaleRatio;
      const newPanY = mouseY - (mouseY - currentPanY) * scaleRatio;

      onViewportChange({ x: newPanX, y: newPanY }, newScale);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [interactive, config.scale, config.viewportOffset, onViewportChange]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive || e.button !== 0) return;
    const currentOffset = config.viewportOffset || { x: 0, y: 0 };
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: currentOffset.x,
      startPanY: currentOffset.y,
    };
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    setIsCursorGrabbing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !isDraggingRef.current || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    if (onViewportChange) {
      onViewportChange(
        {
          x: dragStartRef.current.startPanX + dx,
          y: dragStartRef.current.startPanY + dy,
        },
        config.scale
      );
    }
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      setIsCursorGrabbing(false);
    }
  };

  // Touch gesture handlers (Single finger pan + Two-finger pinch-to-zoom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !interactive) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger pan
        const touch = e.touches[0];
        const currentOffset = config.viewportOffset || { x: 0, y: 0 };
        dragStartRef.current = {
          clientX: touch.clientX,
          clientY: touch.clientY,
          startPanX: currentOffset.x,
          startPanY: currentOffset.y,
        };
        isDraggingRef.current = true;
        isPinchingRef.current = false;
        hasMovedRef.current = false;
      } else if (e.touches.length === 2) {
        // Two finger pinch to zoom
        isDraggingRef.current = false;
        isPinchingRef.current = true;
        hasMovedRef.current = true;

        const rect = container.getBoundingClientRect();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

        pinchStartRef.current = {
          dist,
          scale: config.scale || 1.0,
          midX,
          midY,
          panX: config.viewportOffset?.x || 0,
          panY: config.viewportOffset?.y || 0,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current && dragStartRef.current) {
        // Single finger drag
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartRef.current.clientX;
        const dy = touch.clientY - dragStartRef.current.clientY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMovedRef.current = true;
        }

        if (onViewportChange) {
          onViewportChange(
            {
              x: dragStartRef.current.startPanX + dx,
              y: dragStartRef.current.startPanY + dy,
            },
            config.scale
          );
        }
      } else if (e.touches.length === 2 && isPinchingRef.current && pinchStartRef.current) {
        // Two-finger pinch to zoom & pan
        e.preventDefault();
        hasMovedRef.current = true;

        const rect = container.getBoundingClientRect();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const curMidX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const curMidY = (t1.clientY + t2.clientY) / 2 - rect.top;

        const { dist: startDist, scale: startScale, midX: startMidX, midY: startMidY, panX: startPanX, panY: startPanY } = pinchStartRef.current;
        if (startDist <= 0) return;

        const scaleRatio = curDist / startDist;
        const newScale = Math.min(Math.max(0.2, startScale * scaleRatio), 5.0);

        // Zoom around touch center + translation delta
        const panX_after_scale = curMidX - (curMidX - startPanX) * (newScale / startScale);
        const panY_after_scale = curMidY - (curMidY - startPanY) * (newScale / startScale);
        const newPanX = panX_after_scale + (curMidX - startMidX);
        const newPanY = panY_after_scale + (curMidY - startMidY);

        if (onViewportChange) {
          onViewportChange({ x: newPanX, y: newPanY }, newScale);
        }
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      isPinchingRef.current = false;
      dragStartRef.current = null;
      pinchStartRef.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [interactive, config.scale, config.viewportOffset, onViewportChange]);

  const handleClick = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={containerRef}
      id="wallpaper-canvas-container"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none touch-none ${
        interactive ? (isCursorGrabbing ? 'cursor-grabbing' : 'cursor-grab') : ''
      } ${className}`}
      style={{ backgroundColor: config.palette.bg }}
    >
      <canvas
        ref={canvasRef}
        id="wallpaper-canvas"
        className="w-full h-full block pointer-events-none"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
