import React from 'react';
import { PatternType } from '../types';

interface PatternsTabProps {
  pattern: PatternType;
  density: number;
  onPatternChange: (pattern: PatternType) => void;
  onDensityChange: (density: number) => void;
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
    subtitle: 'Polar Spiral (极坐标螺旋)',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        <circle cx="24" cy="24" r="2.8" fill={color} />
        <circle cx="27" cy="21" r="2.6" fill={color} />
        <circle cx="23" cy="18" r="2.8" fill={color} />
        <circle cx="18" cy="22" r="3.0" fill={color} />
        <circle cx="21" cy="29" r="3.2" fill={color} />
        <circle cx="29" cy="29" r="3.2" fill={color} />
        <circle cx="33" cy="20" r="3.2" fill={color} />
        <circle cx="26" cy="13" r="3.4" fill={color} />
        <circle cx="14" cy="16" r="3.4" fill={color} />
        <circle cx="13" cy="30" r="3.5" fill={color} />
        <circle cx="25" cy="38" r="3.5" fill={color} />
        <circle cx="37" cy="33" r="3.5" fill={color} />
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
    subtitle: 'Galaxy Scatter (三级多层次全景散布)',
    badge: '3 Tiers · 80~220+ Emojis',
    renderIcon: (color) => (
      <svg viewBox="0 0 48 48" className="w-9 h-9" fill="none">
        {/* Large 1.8x Hero Items */}
        <circle cx="16" cy="18" r="6.2" fill={color} />
        {/* Medium 1.0x Items */}
        <circle cx="34" cy="15" r="3.8" fill={color} />
        <circle cx="33" cy="34" r="3.8" fill={color} />
        {/* Small 0.55x Accent Items */}
        <circle cx="12" cy="36" r="2.2" fill={color} opacity="0.8" />
        <circle cx="23" cy="38" r="2.2" fill={color} opacity="0.8" />
        <circle cx="22" cy="7" r="2.2" fill={color} opacity="0.8" />
        <circle cx="41" cy="24" r="2.2" fill={color} opacity="0.8" />
        <circle cx="7" cy="22" r="2.0" fill={color} opacity="0.6" />
        <circle cx="39" cy="7" r="1.8" fill={color} opacity="0.6" />
        <circle cx="26" cy="22" r="1.6" fill={color} opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'prism',
    name: 'Prism',
    subtitle: 'Concentric Rings (同心几何环)',
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
        {/* Ring 2 (Outer circle guide + accents) */}
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
    subtitle: 'Radial floral petal rings',
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
    subtitle: 'Star Cluster (星系全景深度散布)',
    badge: '3 Tiers · 80~230+ Emojis',
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
];

const DENSITY_LABELS = ['Minimal', 'Sparse', 'Balanced', 'Dense', 'Compact'];

const getDensityEffectDescription = (pattern: PatternType, lvl: number): string => {
  switch (pattern) {
    case 'mosaic': {
      const cols = [14, 18, 22, 28, 34][lvl - 1] || 22;
      return `${cols} 列紧凑错落密铺 (自然七巧板嵌合 · 紧致饱满 · 严丝合缝填满矩形 · 绝对零遮挡)`;
    }
    case 'lotus':
      return `~${45 + (lvl - 1) * 54} Emojis (紧密螺旋总数与圈数)`;
    case 'stacks': {
      const cols = [3, 4, 5, 6, 7][lvl - 1] || 5;
      return `${cols} 竖向波浪交错列 (上层底座实体遮罩 · 自然前后贴纸层级)`;
    }
    case 'scatter': {
      const counts = [45, 75, 110, 160, 220][lvl - 1] || 110;
      return `~${counts} 个图元全画幅散布 (10% 大焦点 / 20% 中景 / 70% 极小星尘 · 零漏风)`;
    }
    case 'constellation': {
      const counts = [50, 80, 115, 170, 230][lvl - 1] || 115;
      return `~${counts} 个恒星系统与微尘卫星 (10% 核心恒星 / 20% 行星 / 70% 星尘 · 全景覆盖)`;
    }
    case 'prism':
      return `${1 + lvl} 圈同心几何环与对称图标环阵`;
    default:
      return `Density Level ${lvl}`;
  }
};

export const PatternsTab: React.FC<PatternsTabProps> = ({
  pattern,
  density,
  onPatternChange,
  onDensityChange,
  accentColor,
}) => {
  return (
    <div id="patterns-tab-panel" className="space-y-5">
      {/* 5 Pattern Layout Radio Selectors */}
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
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ml-2"
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

      {/* Density Slider */}
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-4 border border-black/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="uppercase tracking-wider text-zinc-500">Density</span>
          <span
            className="font-bold px-2 py-0.5 rounded-full text-white text-xs"
            style={{ backgroundColor: accentColor }}
          >
            Level {density}: {DENSITY_LABELS[density - 1]}
          </span>
        </div>

        {/* Parameter Definition Badge */}
        <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300">
          <span className="font-medium">当前排布参数:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {getDensityEffectDescription(pattern, density)}
          </span>
        </div>

        <div className="relative pt-1 pb-2">
          <input
            id="density-slider"
            type="range"
            min={1}
            max={5}
            step={1}
            value={density}
            onChange={(e) => onDensityChange(Number(e.target.value))}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-zinc-800"
            style={{ accentColor }}
          />

          {/* Step ticks and labels */}
          <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1.5 px-0.5 select-none">
            {DENSITY_LABELS.map((lbl, idx) => {
              const lvl = idx + 1;
              const isCurrent = density === lvl;
              return (
                <button
                  type="button"
                  key={lbl}
                  onClick={() => onDensityChange(lvl)}
                  className={`transition-all duration-150 cursor-pointer text-center ${
                    isCurrent
                      ? 'font-bold text-xs scale-105'
                      : 'hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  style={{
                    color: isCurrent ? accentColor : undefined,
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
