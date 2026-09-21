import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { motion } from 'motion/react';

interface RandomizeButtonProps {
  onRandomize: () => void;
  accentColor?: string;
  bgColor?: string;
}

export const RandomizeButton: React.FC<RandomizeButtonProps> = ({
  onRandomize,
  accentColor = '#1F2937',
  bgColor = '#FFFFFF',
}) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleClick = () => {
    setIsRolling(true);
    onRandomize();
    setTimeout(() => setIsRolling(false), 550);
  };

  return (
    <motion.button
      id="floating-randomize-button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      aria-label="Randomize wallpaper"
      className="flex items-center space-x-2.5 px-5 py-3 rounded-full shadow-lg border border-black/10 backdrop-blur-md transition-all duration-200 cursor-pointer font-semibold text-sm tracking-wide group"
      style={{
        backgroundColor: bgColor,
        color: accentColor,
      }}
    >
      <motion.div
        animate={isRolling ? { rotate: 360, scale: [1, 1.25, 1] } : { rotate: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="flex items-center justify-center"
      >
        <Dices size={18} className="transition-transform group-hover:rotate-12" />
      </motion.div>
      <span className="font-medium text-sm whitespace-nowrap">Randomize</span>
    </motion.button>
  );
};
