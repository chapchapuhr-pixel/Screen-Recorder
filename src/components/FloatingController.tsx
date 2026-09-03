import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Camera,
  PenTool,
  Video,
  ChevronRight,
  ChevronLeft,
  GripHorizontal,
} from 'lucide-react';
import { formatDuration } from '../utils/constants';

interface FloatingControllerProps {
  elapsedSeconds: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onScreenshot: () => void;
  isDrawingActive: boolean;
  onToggleDrawing: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
}

export const FloatingController: React.FC<FloatingControllerProps> = ({
  elapsedSeconds,
  isPaused,
  onPause,
  onResume,
  onStop,
  onScreenshot,
  isDrawingActive,
  onToggleDrawing,
  isCameraActive,
  onToggleCamera,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 160 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    
    // Keep within window bounds
    const newX = Math.max(12, Math.min(window.innerWidth - 180, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(60, Math.min(window.innerHeight - 80, dragStartRef.current.initialY + deltaY));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      id="screenpro-floating-controller"
      className="fixed z-50 select-none transition-shadow duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
    >
      <div
        className={`flex items-center backdrop-blur-md bg-[#111111]/95 border border-[#2A2A2A] text-[#E0E0E0] rounded-full shadow-2xl transition-all duration-300 ${
          isCollapsed ? 'px-2 py-1.5' : 'px-3.5 py-2 space-x-2'
        } ${isDragging ? 'scale-105 shadow-[#FF4B2B33] shadow-xl' : ''}`}
      >
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cursor-grab active:cursor-grabbing p-1 text-[#666] hover:text-[#E0E0E0] transition-colors"
          title="Drag controller"
        >
          <GripHorizontal className="w-4 h-4" />
        </div>

        {/* Pulsing record indicator & time */}
        <div className="flex items-center space-x-2 pr-1">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isPaused ? 'bg-amber-400' : 'bg-[#FF4B2B]'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isPaused ? 'bg-amber-400' : 'bg-[#FF4B2B]'
              }`}
            />
          </span>
          <span className="font-mono font-semibold text-xs text-white tracking-wider">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>

        {!isCollapsed && (
          <div className="flex items-center space-x-1.5 border-l border-[#2A2A2A] pl-2">
            {/* Pause / Resume */}
            <button
              id="btn-pause-resume"
              type="button"
              onClick={isPaused ? onResume : onPause}
              className={`p-2 rounded-full transition-colors ${
                isPaused
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              }`}
              title={isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>

            {/* Stop & Finalize */}
            <button
              id="btn-stop-recording"
              type="button"
              onClick={onStop}
              className="p-2 rounded-full bg-red-600/30 text-red-400 hover:bg-red-600/50 hover:text-white transition-colors"
              title="Stop and save recording"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Instant Screenshot */}
            <button
              id="btn-quick-screenshot"
              type="button"
              onClick={onScreenshot}
              className="p-2 rounded-full bg-[#1E1E1E] text-[#AAA] hover:bg-[#2A2A2A] hover:text-white transition-colors"
              title="Take screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Toggle Screen Annotation / Drawing */}
            <button
              id="btn-toggle-drawing"
              type="button"
              onClick={onToggleDrawing}
              className={`p-2 rounded-full transition-all ${
                isDrawingActive
                  ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-bold shadow-md shadow-[#FF4B2B44]'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#2A2A2A] hover:text-white'
              }`}
              title={isDrawingActive ? 'Hide drawing overlay' : 'Draw on screen'}
            >
              <PenTool className="w-4 h-4" />
            </button>

            {/* Toggle Face Camera bubble */}
            <button
              id="btn-toggle-camera"
              type="button"
              onClick={onToggleCamera}
              className={`p-2 rounded-full transition-all ${
                isCameraActive
                  ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-bold shadow-md shadow-[#FF4B2B44]'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#2A2A2A] hover:text-white'
              }`}
              title={isCameraActive ? 'Close face camera' : 'Show face camera bubble'}
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-[#666] hover:text-[#E0E0E0] transition-colors"
          title={isCollapsed ? 'Expand controller' : 'Minimize controller'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
