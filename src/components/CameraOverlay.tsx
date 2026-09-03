import React, { useState, useRef, useEffect } from 'react';
import { CameraBubbleShape, CameraBubbleSize } from '../types';
import { FlipHorizontal, X, Maximize2, Minimize2 } from 'lucide-react';

interface CameraOverlayProps {
  onClose: () => void;
  shape?: CameraBubbleShape;
  size?: CameraBubbleSize;
  mirrored?: boolean;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  onClose,
  shape: initialShape = 'circle',
  size: initialSize = 'medium',
  mirrored: initialMirrored = true,
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 220, y: 80 });
  const [shape, setShape] = useState<CameraBubbleShape>(initialShape);
  const [size, setSize] = useState<CameraBubbleSize>(initialSize);
  const [isMirrored, setIsMirrored] = useState(initialMirrored);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Size mapping in pixels
  const sizePx = size === 'small' ? 120 : size === 'medium' ? 170 : 230;

  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (!active) return;
        console.warn('Face camera access error:', err);
        setErrorMsg('Camera unavailable or permission denied.');
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Avoid drag if clicked on a button
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const newX = Math.max(10, Math.min(window.innerWidth - sizePx - 10, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - sizePx - 10, dragStartRef.current.initialY + deltaY));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const toggleSize = () => {
    if (size === 'small') setSize('medium');
    else if (size === 'medium') setSize('large');
    else setSize('small');
  };

  const toggleShape = () => {
    setShape((prev) => (prev === 'circle' ? 'rounded-square' : 'circle'));
  };

  return (
    <div
      id="screenpro-camera-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`fixed z-50 select-none cursor-grab active:cursor-grabbing group shadow-2xl transition-all duration-150 ${
        shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
      } ${isDragging ? 'scale-105 ring-4 ring-[#FF4B2B]/60' : 'ring-2 ring-[#2A2A2A]'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        touchAction: 'none',
      }}
    >
      <div
        className={`w-full h-full overflow-hidden bg-[#0A0A0A] border-2 border-[#2A2A2A] ${
          shape === 'circle' ? 'rounded-full' : 'rounded-3xl'
        } relative`}
      >
        {errorMsg ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#111] text-xs text-[#888]">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 text-red-400 text-xs underline hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* Hover / Touch Quick Toolbar */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 p-2">
          {/* Mirror toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMirrored(!isMirrored);
            }}
            className="p-1.5 bg-[#1A1A1A]/90 hover:bg-[#FF4B2B] rounded-full text-white text-xs backdrop-blur-sm transition-colors"
            title="Mirror camera"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Shape toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleShape();
            }}
            className="p-1.5 bg-[#1A1A1A]/90 hover:bg-[#FF4B2B] rounded-full text-white text-xs backdrop-blur-sm transition-colors"
            title={shape === 'circle' ? 'Square bubble' : 'Circular bubble'}
          >
            <div className={`w-3.5 h-3.5 border border-white ${shape === 'circle' ? 'rounded-sm' : 'rounded-full'}`} />
          </button>

          {/* Size cycle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSize();
            }}
            className="p-1.5 bg-[#1A1A1A]/90 hover:bg-[#FF4B2B] rounded-full text-white text-xs backdrop-blur-sm transition-colors"
            title="Cycle size (S / M / L)"
          >
            {size === 'large' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close camera */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 bg-red-600/80 hover:bg-red-700 rounded-full text-white text-xs backdrop-blur-sm transition-colors"
            title="Close face camera"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
