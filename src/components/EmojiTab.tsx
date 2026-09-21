import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { EMOJI_CATEGORIES, PRESET_COMBINATIONS } from '../constants/presets';

interface EmojiTabProps {
  emojis: string[];
  onChange: (emojis: string[]) => void;
  accentColor: string;
}

export const EmojiTab: React.FC<EmojiTabProps> = ({ emojis, onChange, accentColor }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const maxEmojis = 14;

  const handleAddEmoji = (emoji: string) => {
    if (emojis.length >= maxEmojis) return;
    onChange([...emojis, emoji]);
  };

  const handleRemoveEmoji = (index: number) => {
    const next = [...emojis];
    next.splice(index, 1);
    onChange(next.length > 0 ? next : ['✨']); // keep at least 1
  };

  const handleClearAll = () => {
    onChange(['✨']);
  };

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    // Split string into unicode characters/emojis
    const segments = Array.from(inputVal.trim());
    const validEmojis = segments.filter((char) => char.trim().length > 0);

    const combined = [...emojis];
    for (const em of validEmojis) {
      if (combined.length < maxEmojis) {
        combined.push(em);
      }
    }
    onChange(combined);
    setInputVal('');
  };

  return (
    <div id="emoji-tab-panel" className="space-y-4">
      {/* Selected Emojis Tag Chips & Counter */}
      <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl p-3.5 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Selected Emojis
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

        {/* Live Tag Chips */}
        <div className="flex flex-wrap gap-2 min-h-11 items-center">
          {emojis.map((emoji, idx) => (
            <div
              key={`${emoji}-${idx}`}
              className="group flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80 animate-in fade-in zoom-in duration-150"
            >
              <span className="text-lg leading-none">{emoji}</span>
              {emojis.length > 1 && (
                <button
                  onClick={() => handleRemoveEmoji(idx)}
                  className="w-4 h-4 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove emoji"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}

          {emojis.length < maxEmojis && (
            <span className="text-xs text-zinc-400 italic pl-1">
              Add up to {maxEmojis - emojis.length} more
            </span>
          )}
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleManualInputSubmit} className="flex gap-2">
        <input
          id="custom-emoji-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type or paste emojis (e.g. 🦊 🌿 ☕)..."
          maxLength={10}
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
              onClick={() => onChange(preset.emojis)}
              className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>{preset.emojis.slice(0, 3).join('')}</span>
              <span className="text-zinc-700 dark:text-zinc-300">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills & Emoji Grid */}
      <div className="space-y-2.5">
        {/* Category Tabs */}
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
