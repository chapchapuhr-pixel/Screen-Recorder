import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DrawingPoint, DrawingStroke, DrawingToolType } from '../types';
import {
  Pen,
  Highlighter,
  ArrowUpRight,
  Square,
  Circle,
  Minus,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  X,
  Palette,
} from 'lucide-react';

interface DrawingOverlayProps {
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#FBBF24', // Amber / Yellow
  '#10B981', // Emerald / Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#FFFFFF', // White
  '#0F172A', // Slate Black
];

export const DrawingOverlay: React.FC<DrawingOverlayProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingToolType>('pen');
  const [color, setColor] = useState('#EF4444');
  const [size, setSize] = useState(4);
  const [opacity, setOpacity] = useState(1.0);

  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const isDrawingRef = useRef(false);

  // Redraw the entire canvas from strokes history
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStrokeRef.current
      ? [...strokes, currentStrokeRef.current]
      : strokes;

    for (const stroke of allStrokes) {
      if (stroke.points.length === 0) continue;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size;
      ctx.globalAlpha = stroke.opacity;

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 2.5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
      }

      const p0 = stroke.points[0];
      const pLast = stroke.points[stroke.points.length - 1];

      if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(pLast.x, pLast.y);
        ctx.stroke();
      } else if (stroke.tool === 'rectangle') {
        const width = pLast.x - p0.x;
        const height = pLast.y - p0.y;
        ctx.strokeRect(p0.x, p0.y, width, height);
      } else if (stroke.tool === 'circle') {
        const radius = Math.hypot(pLast.x - p0.x, pLast.y - p0.y);
        ctx.beginPath();
        ctx.arc(p0.x, p0.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stroke.tool === 'arrow') {
        // Draw main line
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(pLast.x, pLast.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(pLast.y - p0.y, pLast.x - p0.x);
        const headlen = Math.max(16, stroke.size * 3.5);
        ctx.beginPath();
        ctx.moveTo(pLast.x, pLast.y);
        ctx.lineTo(
          pLast.x - headlen * Math.cos(angle - Math.PI / 6),
          pLast.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(pLast.x, pLast.y);
        ctx.lineTo(
          pLast.x - headlen * Math.cos(angle + Math.PI / 6),
          pLast.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [strokes]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        redrawCanvas();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    const newStroke: DrawingStroke = {
      id: Math.random().toString(36).substring(2, 9),
      tool: currentTool,
      color,
      size,
      opacity,
      points: [{ x, y }],
    };
    currentStrokeRef.current = newStroke;
    setRedoStack([]); // Clear redo upon new action
    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      currentStrokeRef.current.points.push({ x, y });
    } else {
      // Shape tools: replace last point
      if (currentStrokeRef.current.points.length > 1) {
        currentStrokeRef.current.points[1] = { x, y };
      } else {
        currentStrokeRef.current.points.push({ x, y });
      }
    }
    redrawCanvas();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;
    setStrokes((prev) => [...prev, currentStrokeRef.current!]);
    currentStrokeRef.current = null;
    redrawCanvas();
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack((prev) => [...prev, last]);
    setStrokes((prev) => prev.slice(0, prev.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setStrokes((prev) => [...prev, last]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    setStrokes([]);
    setRedoStack([]);
  };

  return (
    <div id="screenpro-drawing-overlay" className="fixed inset-0 z-40 select-none">
      {/* Interactive Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2">
        {/* Colors & Size Bar */}
        <div className="flex items-center space-x-2 backdrop-blur-md bg-[#111111]/95 border border-[#2A2A2A] rounded-full px-4 py-2 shadow-2xl">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110 opacity-80'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="w-px h-5 bg-[#2A2A2A] mx-1" />

          {/* Stroke Size presets */}
          <div className="flex items-center space-x-1">
            {[2, 4, 8, 14].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSize(sz)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs text-white transition-all ${
                  size === sz
                    ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] font-bold shadow-sm'
                    : 'hover:bg-[#1E1E1E]'
                }`}
              >
                <div
                  className="rounded-full bg-white"
                  style={{ width: `${Math.min(16, sz * 1.5 + 4)}px`, height: `${Math.min(16, sz * 1.5 + 4)}px` }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Tools Bar */}
        <div className="flex items-center space-x-1.5 backdrop-blur-md bg-[#111111]/95 border border-[#2A2A2A] rounded-full px-3.5 py-2 shadow-2xl text-white">
          <button
            type="button"
            onClick={() => setCurrentTool('pen')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'pen'
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-md shadow-[#FF4B2B44] font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Pen"
          >
            <Pen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('highlighter')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'highlighter'
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-md shadow-[#FF4B2B44] font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('arrow')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'arrow'
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-md shadow-[#FF4B2B44] font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Arrow"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('rectangle')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'rectangle'
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-md shadow-[#FF4B2B44] font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('circle')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'circle'
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-md shadow-[#FF4B2B44] font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('line')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'line'
                ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white shadow-md shadow-[#FF4B2B44] font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Straight Line"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTool('eraser')}
            className={`p-2 rounded-full transition-all ${
              currentTool === 'eraser'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-[#AAA] hover:bg-[#1E1E1E] hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[#2A2A2A] mx-1" />

          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-2 rounded-full hover:bg-[#1E1E1E] disabled:opacity-30 text-[#AAA] hover:text-white transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-full hover:bg-[#1E1E1E] disabled:opacity-30 text-[#AAA] hover:text-white transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-400 disabled:opacity-30 transition-colors"
            title="Clear all drawings"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[#2A2A2A] mx-1" />

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white transition-colors"
            title="Close drawing mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
