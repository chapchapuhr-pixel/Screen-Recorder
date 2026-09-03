import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface CountdownOverlayProps {
  initialCount: number;
  onComplete: () => void;
  onCancel: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  initialCount,
  onComplete,
  onCancel,
}) => {
  const [currentCount, setCurrentCount] = useState(initialCount);

  useEffect(() => {
    if (currentCount <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentCount, onComplete]);

  return (
    <div
      id="screenpro-countdown-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm select-none"
    >
      <div className="flex flex-col items-center animate-pulse">
        <span className="text-8xl md:text-9xl font-black font-mono text-[#FF4B2B] drop-shadow-[0_0_35px_rgba(255,75,43,0.5)]">
          {currentCount > 0 ? currentCount : 'GO!'}
        </span>
        <span className="mt-4 text-sm font-medium tracking-wider uppercase text-[#888]">
          Recording starts shortly...
        </span>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="mt-12 flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#252525] text-white text-sm font-medium border border-[#333] transition-colors shadow-xl"
      >
        <X className="w-4 h-4" />
        <span>Cancel</span>
      </button>
    </div>
  );
};
