import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, StickerItem, TextOverlayItem, VideoEditorConfig } from '../types';
import {
  Scissors,
  Crop,
  RotateCw,
  Gauge,
  Type,
  Smile,
  Music,
  Download,
  Play,
  Pause,
  X,
  Check,
  Plus,
  Trash2,
  Volume2,
} from 'lucide-react';
import { formatBytes, formatDuration, generateFilename } from '../utils/constants';
import { mediaStorage } from '../services/MediaStorageService';

interface VideoEditorProps {
  item: MediaItem;
  onClose: () => void;
  onSaved: (newItem: MediaItem) => void;
}

type EditorTab = 'trim' | 'crop' | 'rotate' | 'speed' | 'text' | 'stickers' | 'music';

const STICKER_EMOJIS = ['🔥', '✨', '⚡', '🎯', '💡', '🚀', '⭐', '❤️', '👍', '👀', '💯', '🔔'];

export const VideoEditor: React.FC<VideoEditorProps> = ({ item, onClose, onSaved }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState<EditorTab>('trim');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 3);

  // Editor State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(item.duration || 3);
  const [cropRatio, setCropRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '9:16'>('free');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [speed, setSpeed] = useState<0.25 | 0.5 | 1 | 1.5 | 2>(1);

  // Overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlayItem[]>([]);
  const [newTextVal, setNewTextVal] = useState('My Highlight');
  const [stickers, setStickers] = useState<StickerItem[]>([]);

  // Music
  const [musicFile, setMusicFile] = useState<{ name: string; url: string; volume: number } | null>(null);

  // Export progress
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        setTrimEnd(video.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Loop inside trim bounds
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
        if (!video.paused) video.play();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [trimStart, trimEnd]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleAddText = () => {
    if (!newTextVal.trim()) return;
    const item: TextOverlayItem = {
      id: Math.random().toString(36).substring(2, 9),
      text: newTextVal.trim(),
      color: '#FFFFFF',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      fontSize: 22,
      fontFamily: 'system-ui',
      xPercent: 50,
      yPercent: 40,
      opacity: 1,
    };
    setTextOverlays([...textOverlays, item]);
    setNewTextVal('');
  };

  const handleAddSticker = (emoji: string) => {
    const item: StickerItem = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      xPercent: 50,
      yPercent: 50,
      scale: 1.5,
      rotation: 0,
    };
    setStickers([...stickers, item]);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMusicFile({ name: file.name, url, volume: 0.8 });
    }
  };

  /**
   * Real Export Pipeline:
   * Uses HTML5 Canvas and MediaRecorder to render the processed video frames,
   * applying trim range, crop ratio, rotation, text overlays, and stickers!
   */
  const handleExport = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsExporting(true);
    setExportProgress(0);
    video.pause();
    setIsPlaying(false);

    try {
      const targetDuration = Math.max(0.5, trimEnd - trimStart);
      const canvas = document.createElement('canvas');

      // Calculate canvas dimensions based on video & crop & rotation
      let baseWidth = video.videoWidth || 720;
      let baseHeight = video.videoHeight || 1280;

      if (rotation === 90 || rotation === 270) {
        const temp = baseWidth;
        baseWidth = baseHeight;
        baseHeight = temp;
      }

      // Crop ratio adjustments
      let targetW = baseWidth;
      let targetH = baseHeight;
      if (cropRatio === '1:1') {
        const side = Math.min(baseWidth, baseHeight);
        targetW = side;
        targetH = side;
      } else if (cropRatio === '16:9') {
        targetW = baseWidth;
        targetH = Math.round((baseWidth * 9) / 16);
      } else if (cropRatio === '9:16') {
        targetH = baseHeight;
        targetW = Math.round((baseHeight * 9) / 16);
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;

      // MediaStream from canvas
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: 6000000,
        });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const exportPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      });

      recorder.start();

      video.currentTime = trimStart;
      await new Promise((r) => setTimeout(r, 200));

      const fps = 30;
      const totalFrames = Math.max(15, Math.round(targetDuration * fps));
      const frameStepTime = targetDuration / totalFrames;

      for (let f = 0; f < totalFrames; f++) {
        const videoTime = trimStart + f * frameStepTime;
        video.currentTime = videoTime;
        await new Promise((r) => setTimeout(r, 25));

        // Draw frame with rotation & crop
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetW, targetH);

        // Center transform
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const drawW = rotation === 90 || rotation === 270 ? targetH : targetW;
        const drawH = rotation === 90 || rotation === 270 ? targetW : targetH;
        ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Render Text Overlays
        for (const t of textOverlays) {
          ctx.save();
          ctx.font = `bold ${t.fontSize}px ${t.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const tx = (t.xPercent / 100) * targetW;
          const ty = (t.yPercent / 100) * targetH;

          if (t.backgroundColor) {
            const metrics = ctx.measureText(t.text);
            const padX = 14;
            const padY = 8;
            ctx.fillStyle = t.backgroundColor;
            ctx.beginPath();
            ctx.roundRect(
              tx - metrics.width / 2 - padX,
              ty - t.fontSize / 2 - padY,
              metrics.width + padX * 2,
              t.fontSize + padY * 2,
              8
            );
            ctx.fill();
          }

          ctx.fillStyle = t.color;
          ctx.fillText(t.text, tx, ty);
          ctx.restore();
        }

        // Render Stickers
        for (const s of stickers) {
          ctx.save();
          ctx.font = `${36 * s.scale}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const sx = (s.xPercent / 100) * targetW;
          const sy = (s.yPercent / 100) * targetH;
          ctx.fillText(s.emoji, sx, sy);
          ctx.restore();
        }

        setExportProgress(Math.round(((f + 1) / totalFrames) * 100));
      }

      recorder.stop();
      const outputBlob = await exportPromise;

      const newFilename = item.filename.replace(/\.([^.]+)$/, '_edited.$1');
      const thumb = await mediaStorage.generateVideoThumbnail(outputBlob);

      const editedItem: MediaItem = {
        id: 'edited_' + Date.now(),
        type: 'video',
        title: `${item.title} (Edited)`,
        filename: newFilename,
        createdAt: Date.now(),
        duration: targetDuration,
        fileSize: outputBlob.size,
        mimeType: mime,
        blob: outputBlob,
        url: URL.createObjectURL(outputBlob),
        thumbnailUrl: thumb,
        width: targetW,
        height: targetH,
        fps: 30,
        bitrate: '6 Mbps',
      };

      await mediaStorage.save(editedItem);
      setIsExporting(false);
      onSaved(editedItem);
    } catch (err: any) {
      console.error('Export failed:', err);
      setIsExporting(false);
      alert('Video export encountered an issue. The original file remains safe.');
    }
  };

  return (
    <div
      id="screenpro-video-editor"
      className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0A] text-[#E0E0E0] select-none overflow-hidden"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0F0F0F] border-b border-[#1A1A1A]">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#1A1A1A] text-[#888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm text-white">Video Editor — {item.title}</span>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-white font-semibold text-xs transition-all shadow-lg shadow-[#FF4B2B33] disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? `Exporting (${exportProgress}%)` : 'Export Video'}</span>
        </button>
      </div>

      {/* Video Preview Surface */}
      <div className="flex-1 relative flex items-center justify-center bg-black/95 p-4 overflow-hidden">
        <div
          className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <video
            ref={videoRef}
            src={item.url}
            onClick={togglePlay}
            playsInline
            className="max-h-[55vh] max-w-[85vw] rounded-lg shadow-2xl object-contain cursor-pointer"
          />

          {/* Dynamic Overlays on top of video */}
          {textOverlays.map((t) => (
            <div
              key={t.id}
              className="absolute font-bold text-center px-3 py-1 rounded select-none pointer-events-none"
              style={{
                left: `${t.xPercent}%`,
                top: `${t.yPercent}%`,
                transform: 'translate(-50%, -50%)',
                color: t.color,
                backgroundColor: t.backgroundColor,
                fontSize: `${t.fontSize}px`,
              }}
            >
              {t.text}
            </div>
          ))}

          {stickers.map((s) => (
            <div
              key={s.id}
              className="absolute text-center select-none pointer-events-none"
              style={{
                left: `${s.xPercent}%`,
                top: `${s.yPercent}%`,
                transform: `translate(-50%, -50%) scale(${s.scale})`,
                fontSize: '32px',
              }}
            >
              {s.emoji}
            </div>
          ))}
        </div>

        {/* Play/Pause center overlay button */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute p-4 rounded-full bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-white shadow-xl shadow-[#FF4B2B44] transition-transform hover:scale-110"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
        )}

        {/* Export Progress Modal */}
        {isExporting && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30">
            <div className="w-full max-w-sm bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl text-center">
              <h3 className="text-base font-semibold text-white mb-2">Rendering Edited Video</h3>
              <p className="text-xs text-[#888] mb-4">
                Applying trim, crop, rotation, overlays, and encoding frames...
              </p>

              <div className="w-full bg-[#1A1A1A] rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#FF4B2B] to-[#FF416C] h-full rounded-full transition-all duration-150"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-[#888]">
                <span>{exportProgress}%</span>
                <span>Est. {formatBytes(item.fileSize * 0.8)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrub & Trim Bar */}
      <div className="px-6 py-2 bg-[#0F0F0F] border-t border-[#1A1A1A]">
        <div className="flex items-center justify-between text-xs font-mono text-[#888] mb-1">
          <span>Start: {formatDuration(trimStart)}</span>
          <span className="text-[#FF4B2B] font-semibold">{formatDuration(currentTime)}</span>
          <span>End: {formatDuration(trimEnd)}</span>
        </div>

        <div className="relative flex items-center h-8">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-[#FF4B2B]"
          />
        </div>
      </div>

      {/* Bottom Tool Panels */}
      <div className="bg-[#0F0F0F] border-t border-[#1A1A1A] p-3">
        {/* Sub-toolbar Controls */}
        <div className="min-h-[70px] flex items-center justify-center">
          {activeTab === 'trim' && (
            <div className="w-full flex items-center justify-center space-x-6 text-xs">
              <div className="flex flex-col items-center">
                <span className="text-[#888] mb-1">Trim Start</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setTrimStart(Math.max(0, trimStart - 0.5))}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-lg transition-colors"
                  >
                    -0.5s
                  </button>
                  <span className="font-mono text-white">{formatDuration(trimStart)}</span>
                  <button
                    type="button"
                    onClick={() => setTrimStart(Math.min(trimEnd - 0.5, trimStart + 0.5))}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-lg transition-colors"
                  >
                    +0.5s
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[#888] mb-1">Trim End</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setTrimEnd(Math.max(trimStart + 0.5, trimEnd - 0.5))}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-lg transition-colors"
                  >
                    -0.5s
                  </button>
                  <span className="font-mono text-white">{formatDuration(trimEnd)}</span>
                  <button
                    type="button"
                    onClick={() => setTrimEnd(Math.min(duration, trimEnd + 0.5))}
                    className="px-2.5 py-1 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-lg transition-colors"
                  >
                    +0.5s
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="flex items-center space-x-3 text-xs">
              {(['free', '1:1', '4:3', '16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setCropRatio(ratio)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    cropRatio === ratio
                      ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-bold shadow-md shadow-[#FF4B2B33]'
                      : 'bg-[#1A1A1A] text-[#888] hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'rotate' && (
            <div className="flex items-center space-x-3 text-xs">
              {([0, 90, 180, 270] as const).map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setRotation(deg)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    rotation === deg
                      ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-bold shadow-md shadow-[#FF4B2B33]'
                      : 'bg-[#1A1A1A] text-[#888] hover:text-white'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          )}

          {activeTab === 'speed' && (
            <div className="flex items-center space-x-3 text-xs font-mono">
              {([0.25, 0.5, 1, 1.5, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSpeed(s);
                    if (videoRef.current) videoRef.current.playbackRate = s;
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    speed === s
                      ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-bold shadow-md shadow-[#FF4B2B33]'
                      : 'bg-[#1A1A1A] text-[#888] hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="flex items-center space-x-2 text-xs w-full max-w-md">
              <input
                type="text"
                value={newTextVal}
                onChange={(e) => setNewTextVal(e.target.value)}
                placeholder="Enter text on video..."
                className="flex-1 bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-1.5 text-white outline-none focus:border-[#FF4B2B]"
              />
              <button
                type="button"
                onClick={handleAddText}
                className="flex items-center space-x-1 px-3.5 py-1.5 bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold rounded-xl hover:brightness-110 shadow-md shadow-[#FF4B2B33] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              {textOverlays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTextOverlays([])}
                  className="p-1.5 bg-red-900/50 text-red-300 rounded-xl hover:bg-red-900"
                  title="Clear all text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {activeTab === 'stickers' && (
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              {STICKER_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddSticker(emoji)}
                  className="text-2xl p-1.5 bg-[#1A1A1A] hover:bg-[#252525] rounded-xl transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
              {stickers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStickers([])}
                  className="p-1.5 bg-red-900/50 text-red-300 rounded-xl hover:bg-red-900 ml-2"
                  title="Clear stickers"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {activeTab === 'music' && (
            <div className="flex items-center space-x-3 text-xs">
              <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#252525] text-white rounded-xl border border-[#333]">
                <Music className="w-3.5 h-3.5 text-[#FF4B2B]" />
                <span>{musicFile ? musicFile.name : 'Select Audio Track'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleMusicUpload}
                  className="hidden"
                />
              </label>

              {musicFile && (
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-[#888]" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={musicFile.volume}
                    onChange={(e) =>
                      setMusicFile({ ...musicFile, volume: parseFloat(e.target.value) })
                    }
                    className="w-20 h-1 bg-[#252525] rounded accent-[#FF4B2B]"
                  />
                  <button
                    type="button"
                    onClick={() => setMusicFile(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-around border-t border-[#1A1A1A] pt-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('trim')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'trim' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Trim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crop')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'crop' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span>Crop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rotate')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'rotate' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('speed')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'speed' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Speed</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'text' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stickers')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'stickers' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Stickers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`flex flex-col items-center space-y-1 py-1 px-2 rounded-lg transition-colors ${
              activeTab === 'music' ? 'text-[#FF4B2B] font-semibold' : 'text-[#666] hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Music</span>
          </button>
        </div>
      </div>
    </div>
  );
};
