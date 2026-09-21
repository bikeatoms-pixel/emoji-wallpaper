import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Camera, Flashlight, Fingerprint } from 'lucide-react';

interface LockScreenOverlayProps {
  color: string;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({ color }) => {
  const [time, setTime] = useState({ hours: '09', minutes: '30' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime({ hours, minutes });
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="lock-screen-overlay"
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 transition-opacity duration-300"
      style={{ color }}
    >
      {/* Top Status Bar */}
      <div className="flex items-center justify-between text-xs font-medium tracking-wide opacity-80 pt-1">
        <span>Google Fi</span>
        <div className="flex items-center space-x-2">
          <Signal size={13} />
          <Wifi size={13} />
          <div className="flex items-center space-x-0.5">
            <span className="text-[11px] font-semibold">98%</span>
            <BatteryMedium size={15} />
          </div>
        </div>
      </div>

      {/* Center Pixel Clock & At a Glance */}
      <div className="flex flex-col items-center justify-center my-auto transform -translate-y-10">
        <div
          className="text-center font-bold tracking-tight leading-none drop-shadow-sm select-none"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          <div className="text-7xl sm:text-8xl md:text-9xl">{time.hours}</div>
          <div className="text-7xl sm:text-8xl md:text-9xl -mt-2 sm:-mt-4 opacity-90">
            {time.minutes}
          </div>
        </div>

        {/* At a Glance Widget */}
        <div className="mt-4 px-4 py-1.5 rounded-full bg-black/10 backdrop-blur-xs flex items-center space-x-2 text-sm font-medium tracking-normal">
          <span>Sun, Sep 20</span>
          <span>•</span>
          <span>72°F ☀️</span>
        </div>
      </div>

      {/* Bottom Lock & Shortcuts */}
      <div className="flex flex-col items-center pb-24 sm:pb-32 space-y-4">
        {/* Fingerprint Scanner Icon */}
        <div className="w-13 h-13 rounded-full border-2 border-current/40 flex items-center justify-center opacity-75 backdrop-blur-xs bg-black/5 animate-pulse">
          <Fingerprint size={28} />
        </div>

        {/* Lock Screen Shortcuts */}
        <div className="w-full flex items-center justify-between px-4 opacity-75">
          <div className="w-10 h-10 rounded-full bg-black/15 backdrop-blur-xs flex items-center justify-center">
            <Flashlight size={18} />
          </div>
          <div className="w-10 h-10 rounded-full bg-black/15 backdrop-blur-xs flex items-center justify-center">
            <Camera size={18} />
          </div>
        </div>
      </div>
    </div>
  );
};
