import React from 'react';
import { PatternType, ViewportOffset } from '../types';
import { RotateCcw, Move, MousePointer, ZoomIn } from 'lucide-react';

interface PatternsTabProps {
  pattern: PatternType;
  scale: number;
  viewportOffset?: ViewportOffset;
  onPatternChange: (pattern: PatternType) => void;
  onResetViewport?: () => void;
  accentColor: string;
}

interface PatternOption {
  id: PatternType;
  name: string;
  subtitle: string;
  badge?: string;
  renderIcon: (color: string) => React.ReactNode;
}

const PATTERNS: PatternOption[] = [
  {
    id: 'mosaic',
    name: 'Mosaic',
    subtitle: 'Staggered Grid (正向交错嵌合 · 绝对零遮挡)',
    badge: 'Zero Overlap',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Row 1 */}
        <circle cx="10" cy="11" r="4.2" fill={color} />
        <circle cx="24" cy="11" r="2.4" fill={color} />
        <circle cx="38" cy="11" r="3.2" fill={color} />
        {/* Row 2 (half-cell staggered offset) */}
        <circle cx="17" cy="24" r="3.2" fill={color} />
        <circle cx="31" cy="24" r="4.2" fill={color} />
        <circle cx="45" cy="24" r="2.4" fill={color} opacity="0.6" />
        <circle cx="3" cy="24" r="3.2" fill={color} opacity="0.6" />
        {/* Row 3 */}
        <circle cx="10" cy="37" r="2.4" fill={color} />
        <circle cx="24" cy="37" r="3.2" fill={color} />
        <circle cx="38" cy="37" r="4.2" fill={color} />
      </svg>
    ),
  },
  {
    id: 'lotus',
    name: 'Lotus',
    subtitle: 'Polar Spiral (单圆心极坐标双螺旋 · 绝不重叠)',
    badge: 'Polar Spiral',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Central Core */}
        <circle cx="24" cy="24" r="3.5" fill={color} />
        {/* Arm 1 (Clockwise winding spiral arm) */}
        <circle cx="29" cy="20" r="2.5" fill={color} />
        <circle cx="28" cy="13" r="2.3" fill={color} />
        <circle cx="19" cy="10" r="2.1" fill={color} />
        <circle cx="11" cy="15" r="1.9" fill={color} opacity="0.85" />
        <circle cx="9" cy="25" r="1.7" fill={color} opacity="0.7" />
        <circle cx="14" cy="35" r="1.5" fill={color} opacity="0.55" />
        {/* Arm 2 (Symmetrical opposite spiral arm) */}
        <circle cx="19" cy="28" r="2.5" fill={color} />
        <circle cx="20" cy="35" r="2.3" fill={color} />
        <circle cx="29" cy="38" r="2.1" fill={color} />
        <circle cx="37" cy="33" r="1.9" fill={color} opacity="0.85" />
        <circle cx="39" cy="23" r="1.7" fill={color} opacity="0.7" />
        <circle cx="34" cy="13" r="1.5" fill={color} opacity="0.55" />
      </svg>
    ),
  },
  {
    id: 'stacks',
    name: 'Stacks',
    subtitle: 'Wave Columns (竖向波浪交错列)',
    badge: 'Wave Stacks',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Col 1 */}
        <circle cx="12" cy="10" r="5" fill={color} opacity="0.8" />
        <circle cx="12" cy="21" r="5" fill={color} opacity="0.9" />
        <circle cx="12" cy="32" r="5" fill={color} />
        {/* Col 2 (vertical shift) */}
        <circle cx="24" cy="16" r="5" fill={color} opacity="0.8" />
        <circle cx="24" cy="27" r="5" fill={color} opacity="0.9" />
        <circle cx="24" cy="38" r="5" fill={color} />
        {/* Col 3 */}
        <circle cx="36" cy="10" r="5" fill={color} opacity="0.8" />
        <circle cx="36" cy="21" r="5" fill={color} opacity="0.9" />
        <circle cx="36" cy="32" r="5" fill={color} />
      </svg>
    ),
  },
  {
    id: 'scatter',
    name: 'Scatter',
    subtitle: 'Wild & Stylized (歪七扭八 · 多级尺度错落)',
    badge: 'Organic & Wild',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Large skewed */}
        <rect x="12" y="12" width="10" height="10" rx="3" transform="rotate(-18 17 17)" fill={color} />
        {/* Medium skewed */}
        <rect x="29" y="11" width="7" height="7" rx="2" transform="rotate(25 32.5 14.5)" fill={color} />
        <rect x="28" y="29" width="8" height="8" rx="2.5" transform="rotate(-30 32 33)" fill={color} />
        {/* Small skewed */}
        <rect x="9" y="32" width="5" height="5" rx="1.5" transform="rotate(35 11.5 34.5)" fill={color} opacity="0.8" />
        <circle cx="22" cy="38" r="2.2" fill={color} opacity="0.8" />
        <circle cx="22" cy="7" r="2.2" fill={color} opacity="0.8" />
        <circle cx="41" cy="24" r="2.2" fill={color} opacity="0.8" />
        <circle cx="7" cy="22" r="2.0" fill={color} opacity="0.6" />
        <circle cx="39" cy="7" r="1.8" fill={color} opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'prism',
    name: 'Prism',
    subtitle: 'Concentric Rings (同心几何环 · 单圆心)',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Center */}
        <circle cx="24" cy="24" r="3.6" fill={color} />
        {/* Ring 1 (6 points) */}
        <circle cx="24" cy="14" r="2.6" fill={color} />
        <circle cx="32.6" cy="19" r="2.6" fill={color} />
        <circle cx="32.6" cy="29" r="2.6" fill={color} />
        <circle cx="24" cy="34" r="2.6" fill={color} />
        <circle cx="15.4" cy="29" r="2.6" fill={color} />
        <circle cx="15.4" cy="19" r="2.6" fill={color} />
        {/* Ring 2 */}
        <circle cx="24" cy="5" r="2.0" fill={color} opacity="0.8" />
        <circle cx="40.5" cy="14.5" r="2.0" fill={color} opacity="0.8" />
        <circle cx="40.5" cy="33.5" r="2.0" fill={color} opacity="0.8" />
        <circle cx="24" cy="43" r="2.0" fill={color} opacity="0.8" />
        <circle cx="7.5" cy="33.5" r="2.0" fill={color} opacity="0.8" />
        <circle cx="7.5" cy="14.5" r="2.0" fill={color} opacity="0.8" />
      </svg>
    ),
  },
  {
    id: 'bloom',
    name: 'Bloom',
    subtitle: 'Radial Floral (单圆心向外层层绽放)',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        <circle cx="24" cy="24" r="3.5" fill={color} />
        <circle cx="24" cy="14" r="2.8" fill={color} />
        <circle cx="32.5" cy="19" r="2.8" fill={color} />
        <circle cx="32.5" cy="29" r="2.8" fill={color} />
        <circle cx="24" cy="34" r="2.8" fill={color} />
        <circle cx="15.5" cy="29" r="2.8" fill={color} />
        <circle cx="15.5" cy="19" r="2.8" fill={color} />
      </svg>
    ),
  },
  {
    id: 'constellation',
    name: 'Constellation',
    subtitle: 'Star Cluster (高密度星系深空全景)',
    badge: 'Dense Stars',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        <circle cx="17" cy="17" r="5" fill={color} />
        <circle cx="11" cy="12" r="1.8" fill={color} />
        <circle cx="24" cy="12" r="2" fill={color} />
        <circle cx="35" cy="24" r="4.5" fill={color} />
        <circle cx="41" cy="18" r="1.8" fill={color} />
        <circle cx="22" cy="36" r="4.5" fill={color} />
        <circle cx="15" cy="40" r="1.8" fill={color} />
        <circle cx="30" cy="10" r="1.5" fill={color} opacity="0.7" />
        <circle cx="38" cy="36" r="1.5" fill={color} opacity="0.7" />
        <circle cx="8" cy="28" r="1.5" fill={color} opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'convex',
    name: 'Convex Lens',
    subtitle: '中间大边缘小 (凸面镜 · 视口物理动态透镜)',
    badge: 'Convex FX',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Big center emoji representation */}
        <circle cx="24" cy="24" r="6.8" fill={color} />
        <circle cx="15" cy="24" r="4.2" fill={color} />
        <circle cx="33" cy="24" r="4.2" fill={color} />
        <circle cx="24" cy="15" r="4.2" fill={color} />
        <circle cx="24" cy="33" r="4.2" fill={color} />
        {/* Tiny outer edge icons */}
        <circle cx="7" cy="7" r="1.8" fill={color} opacity="0.5" />
        <circle cx="24" cy="5" r="2.0" fill={color} opacity="0.6" />
        <circle cx="41" cy="7" r="1.8" fill={color} opacity="0.5" />
        <circle cx="43" cy="24" r="2.0" fill={color} opacity="0.6" />
        <circle cx="41" cy="41" r="1.8" fill={color} opacity="0.5" />
        <circle cx="24" cy="43" r="2.0" fill={color} opacity="0.6" />
        <circle cx="7" cy="41" r="1.8" fill={color} opacity="0.5" />
        <circle cx="5" cy="24" r="2.0" fill={color} opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'concave',
    name: 'Concave Lens',
    subtitle: '中间小边缘大 (凹面镜 · 景深反转透镜)',
    badge: 'Concave FX',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Tiny center emoji */}
        <circle cx="24" cy="24" r="2.4" fill={color} />
        <circle cx="18" cy="24" r="3.0" fill={color} />
        <circle cx="30" cy="24" r="3.0" fill={color} />
        <circle cx="24" cy="18" r="3.0" fill={color} />
        <circle cx="24" cy="30" r="3.0" fill={color} />
        {/* Huge outer edge icons */}
        <circle cx="8" cy="8" r="5.5" fill={color} opacity="0.9" />
        <circle cx="24" cy="6" r="5.0" fill={color} opacity="0.9" />
        <circle cx="40" cy="8" r="5.5" fill={color} opacity="0.9" />
        <circle cx="42" cy="24" r="5.0" fill={color} opacity="0.9" />
        <circle cx="40" cy="40" r="5.5" fill={color} opacity="0.9" />
        <circle cx="24" cy="42" r="5.0" fill={color} opacity="0.9" />
        <circle cx="8" cy="40" r="5.5" fill={color} opacity="0.9" />
        <circle cx="6" cy="24" r="5.0" fill={color} opacity="0.9" />
      </svg>
    ),
  },
];

export const PatternsTab: React.FC<PatternsTabProps> = ({
  pattern,
  scale,
  viewportOffset,
  onPatternChange,
  onResetViewport,
  accentColor,
}) => {
  const panX = Math.round(viewportOffset?.x || 0);
  const panY = Math.round(viewportOffset?.y || 0);
  const currentScale = Number(scale || 1.0).toFixed(2);

  return (
    <div id="patterns-tab-panel" className="space-y-4">
      {/* 7 Pattern Layout Radio Selectors */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <span>Layout Arrangement</span>
          <span className="text-zinc-400 capitalize">{pattern}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PATTERNS.map((p) => {
            const isSelected = pattern === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onPatternChange(p.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-800 shadow-md ring-2'
                    : 'bg-white/50 dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 border-zinc-200/70 dark:border-zinc-700/70'
                }`}
                style={{
                  borderColor: isSelected ? accentColor : undefined,
                  boxShadow: isSelected ? `0 4px 14px -2px ${accentColor}33` : undefined,
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
                    style={{
                      backgroundColor: isSelected ? `${accentColor}18` : '#F4F4F5',
                    }}
                  >
                    {p.renderIcon(isSelected ? accentColor : '#71717A')}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </span>
                      {p.badge && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {p.subtitle}
                    </span>
                  </div>
                </div>

                {/* Radio Indicator */}
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ml-2 shrink-0"
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

      {/* Viewport & Gesture Status Card (Continuous Smooth Zoom & Infinite Pan) */}
      <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-2xl p-4 border border-black/5 dark:border-white/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              全手势自由视口
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              ({currentScale}x · X:{panX} Y:{panY})
            </span>
          </div>

          {onResetViewport && (
            <button
              onClick={onResetViewport}
              type="button"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>重置居中</span>
            </button>
          )}
        </div>

        {/* 3 Gesture Action Items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center space-x-2 p-2 rounded-xl bg-black/3 dark:bg-white/5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              <ZoomIn size={15} />
            </div>
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">鼠标滚轮 / 触控板</div>
              <div className="text-[10px] text-zinc-500">以光标为中心无级缩放</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-black/3 dark:bg-white/5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              <Move size={15} />
            </div>
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">单指 / 鼠标左键拖拽</div>
              <div className="text-[10px] text-zinc-500">真·无限平铺自由平移</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-xl bg-black/3 dark:bg-white/5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
            >
              <MousePointer size={15} />
            </div>
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-200">双指捏合缩放</div>
              <div className="text-[10px] text-zinc-500">移动端丝滑无级手势</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

