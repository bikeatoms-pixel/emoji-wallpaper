import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, Palette, Paintbrush } from 'lucide-react';
import { EmojiItem, EmojiStyle } from '../types';
import { EMOJI_CATEGORIES, PRESET_COMBINATIONS } from '../constants/presets';
import { normalizeEmojiStyle } from '../services/emojiService';

interface EmojiTabProps {
  emojis: EmojiItem[];
  onChange: (emojis: EmojiItem[]) => void;
  accentColor: string;
}

/**
 * Split input text into distinct items.
 * Keeps Chinese phrases, English words, and text intact when separated by spaces, commas, or punctuation.
 * Segments pure consecutive emoji sequences into individual emojis.
 */
export function parseInputTokens(val: string): string[] {
  const rawTokens = val.trim().split(/[\s,，、；;。\n\t]+/).filter(Boolean);
  const result: string[] = [];
  const hasWordChars = /[\p{sc=Han}\p{L}\p{N}]/u;

  for (const token of rawTokens) {
    if (hasWordChars.test(token)) {
      // Whole word / phrase (e.g. "吃火锅", "奶茶", "暴富", "Tiger")
      result.push(token);
    } else {
      // Pure emoji sequence or symbols -> segment per grapheme
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        for (const seg of segmenter.segment(token)) {
          if (seg.segment.trim()) {
            result.push(seg.segment);
          }
        }
      } else {
        result.push(...Array.from(token).filter((c) => c.trim().length > 0));
      }
    }
  }
  return result;
}

export const EmojiTab: React.FC<EmojiTabProps> = ({ emojis, onChange, accentColor }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const maxEmojis = 14;

  const handleAddEmoji = (emojiChar: string) => {
    if (emojis.length >= maxEmojis) return;
    const newItem: EmojiItem = {
      id: `${emojiChar}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      char: emojiChar,
      style: 'outline', // 默认新增保持线条化
    };
    onChange([...emojis, newItem]);
  };

  /**
   * Cycle style through 3 states:
   * 'outline' (线条化) -> 'vector' (半线条化) -> 'native' (原图) -> 'outline'
   */
  const handleCycleStyle = (index: number) => {
    const next = [...emojis];
    const item = next[index];
    if (!item) return;

    const currentStyle = normalizeEmojiStyle(item.style);
    let nextStyle: EmojiStyle = 'outline';
    if (currentStyle === 'outline') {
      nextStyle = 'vector';
    } else if (currentStyle === 'vector') {
      nextStyle = 'native';
    } else {
      nextStyle = 'outline';
    }

    next[index] = {
      ...item,
      style: nextStyle,
    };
    onChange(next);
  };

  /**
   * Apply a specific style to ALL emojis currently selected
   */
  const handleBatchStyleChange = (targetStyle: EmojiStyle) => {
    const updated = emojis.map((item) => ({
      ...item,
      style: targetStyle,
    }));
    onChange(updated);
  };

  const handleRemoveEmoji = (index: number) => {
    const next = [...emojis];
    next.splice(index, 1);
    onChange(
      next.length > 0
        ? next
        : [{ id: `sparkle-${Date.now()}`, char: '✨', style: 'outline' }]
    );
  };

  const handleClearAll = () => {
    onChange([{ id: `sparkle-${Date.now()}`, char: '✨', style: 'outline' }]);
  };

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const tokens = parseInputTokens(inputVal);
    const combined = [...emojis];

    for (const token of tokens) {
      if (combined.length < maxEmojis) {
        combined.push({
          id: `${token}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          char: token,
          style: 'outline',
        });
      }
    }
    onChange(combined);
    setInputVal('');
  };

  const handleApplyPreset = (presetEmojis: string[]) => {
    const converted: EmojiItem[] = presetEmojis.map((char, idx) => ({
      id: `${char}-${idx}-${Date.now()}`,
      char,
      style: 'outline',
    }));
    onChange(converted);
  };

  // Determine if all selected emojis currently share the exact same style
  const firstNormalizedStyle = emojis.length > 0 ? normalizeEmojiStyle(emojis[0].style) : 'outline';
  const isUniformStyle = emojis.every(
    (item) => normalizeEmojiStyle(item.style) === firstNormalizedStyle
  );
  const activeBatchStyle = isUniformStyle ? firstNormalizedStyle : null;

  return (
    <div id="emoji-tab-panel" className="space-y-4">
      {/* Selected Emojis Tag Chips & Counter */}
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-3.5 border border-black/5 shadow-xs">
        {/* Header: Title, Counter & Clear */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Selected Elements
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: accentColor }}
            >
              {emojis.length} / {maxEmojis}
            </span>
          </div>
          {emojis.length > 1 && (
            <button
              id="clear-all-emojis-button"
              onClick={handleClearAll}
              className="text-xs text-zinc-500 hover:text-red-500 flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Trash2 size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Global Batch Style Switcher (Three-Style Segmented Selector) */}
        <div className="flex items-center justify-between mb-3 p-1 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5">
          <div className="text-[11px] font-medium text-zinc-500 pl-2 pr-1 shrink-0">
            全选风格:
          </div>
          <div className="grid grid-cols-3 gap-1 flex-1">
            <button
              type="button"
              onClick={() => handleBatchStyleChange('outline')}
              className={`py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeBatchStyle === 'outline'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="全部设为线条化风格 (双色调线框)"
            >
              <Paintbrush size={12} />
              <span>线条化</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchStyleChange('vector')}
              className={`py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeBatchStyle === 'vector'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="全部设为半线条矢量插画 (OpenMoji 矢量彩绘)"
            >
              <Palette size={12} />
              <span>半线条</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchStyleChange('native')}
              className={`py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                activeBatchStyle === 'native'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="全部设为原生系统原图 (保持真实 3D/全彩表情)"
            >
              <Sparkles size={12} />
              <span>原图</span>
            </button>
          </div>
        </div>

        {/* Live Tag Chips with 3-State Style Cycle Button */}
        <div className="flex flex-wrap gap-2 min-h-11 items-center">
          {emojis.map((item, idx) => {
            const style = normalizeEmojiStyle(item.style);
            const isOutline = style === 'outline';
            const isVector = style === 'vector';
            const isNative = style === 'native';

            return (
              <div
                key={item.id || `${item.char}-${idx}`}
                className={`group flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border transition-all animate-in fade-in zoom-in duration-150 ${
                  isNative
                    ? 'border-emerald-400/80 dark:border-emerald-500/80 ring-1 ring-emerald-400/30'
                    : isVector
                    ? 'border-amber-400/80 dark:border-amber-500/80 ring-1 ring-amber-400/30'
                    : 'border-zinc-200/80 dark:border-zinc-700/80'
                }`}
              >
                <span className="text-base font-medium leading-none select-none max-w-[120px] truncate">
                  {item.char}
                </span>

                {/* 3-State Style cycle button */}
                <button
                  type="button"
                  onClick={() => handleCycleStyle(idx)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                    isNative
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : isVector
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-700/60 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title={
                    isNative
                      ? '当前：原图 (点击切回单色线条化)'
                      : isVector
                      ? '当前：半线条矢量 (点击切至原生原图)'
                      : '当前：单色线条化 (点击切至半线条矢量)'
                  }
                >
                  {isNative ? (
                    <Sparkles size={13} />
                  ) : isVector ? (
                    <Palette size={13} />
                  ) : (
                    <Paintbrush size={13} />
                  )}
                </button>

                {/* Remove button */}
                {emojis.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmoji(idx)}
                    className="w-5 h-5 rounded-full text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}

          {emojis.length < maxEmojis && (
            <span className="text-xs text-zinc-400 italic pl-1">
              Add up to {maxEmojis - emojis.length} more
            </span>
          )}
        </div>

        {/* Style helper hint */}
        <div className="flex items-center space-x-1.5 mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Sparkles size={12} className="text-zinc-400 shrink-0" />
          <span>点击小按钮循环切换风格：线条化 ➔ 半线条矢量 ➔ 系统原图</span>
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleManualInputSubmit} className="flex gap-2">
        <input
          id="custom-emoji-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="输入中文词组或表情（如 吃火锅、奶茶、🐯 🌿）..."
          maxLength={60}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 shadow-xs placeholder:text-zinc-400"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || emojis.length >= maxEmojis}
          className="px-4 py-2.5 rounded-xl text-white font-medium text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: accentColor }}
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </form>

      {/* Quick Inspiration Presets */}
      <div>
        <div className="flex items-center space-x-1.5 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <Sparkles size={13} />
          <span>Style Combos</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {PRESET_COMBINATIONS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset.emojis)}
              className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>{preset.emojis.slice(0, 3).join('')}</span>
              <span className="text-zinc-700 dark:text-zinc-300">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs & Emoji Grid */}
      <div className="space-y-2.5">
        <div className="flex space-x-1 border-b border-zinc-200 dark:border-zinc-700 pb-1 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 transition-all cursor-pointer ${
                selectedCategory === idx
                  ? 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Emojis Grid */}
        <div className="grid grid-cols-7 gap-2 p-2 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/40 dark:border-zinc-800 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => {
            const isFull = emojis.length >= maxEmojis;
            return (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                disabled={isFull}
                title={isFull ? 'Limit reached (14 max)' : `Add ${emoji}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 shadow-2xs hover:scale-115 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
