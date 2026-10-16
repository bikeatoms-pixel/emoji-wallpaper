import React from 'react';
import { Smile, Grid3X3, Palette } from 'lucide-react';
import { ActiveTab } from '../types';
import { motion } from 'motion/react';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onTabSelect: (tab: ActiveTab) => void;
  accentColor: string;
}

interface TabDef {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabSelect,
  accentColor,
}) => {
  const tabs: TabDef[] = [
    {
      id: 'emoji',
      label: 'Emoji',
      icon: <Smile size={20} />,
    },
    {
      id: 'patterns',
      label: 'Patterns',
      icon: <Grid3X3 size={20} />,
    },
    {
      id: 'colors',
      label: 'Colors',
      icon: <Palette size={20} />,
    },
  ];

  return (
    <div
      id="pixel-bottom-navigation"
      className="flex items-center justify-around w-full py-2.5 px-3 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => onTabSelect(tab.id)}
            className="relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors group"
          >
            {/* Material You Pill Indicator for Active Tab */}
            <div className="relative px-5 py-1.5 rounded-full flex items-center justify-center transition-all">
              {isActive && (
                <motion.div
                  layoutId="active-tab-pill"
                  className="absolute inset-0 rounded-full shadow-xs"
                  style={{
                    backgroundColor: `${accentColor}25`,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  isActive ? 'font-bold' : 'text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                }`}
                style={{ color: isActive ? accentColor : undefined }}
              >
                {tab.icon}
              </span>
            </div>

            {/* Label */}
            <span
              className={`text-xs mt-1 transition-all ${
                isActive
                  ? 'font-bold text-zinc-900 dark:text-zinc-100'
                  : 'font-medium text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
              }`}
              style={{ color: isActive ? accentColor : undefined }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
