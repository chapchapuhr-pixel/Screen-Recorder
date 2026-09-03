import React, { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Scissors,
  Share2,
  Trash2,
  X,
  Clock,
  HardDrive,
  Film,
} from 'lucide-react';
import { formatBytes, formatDuration } from '../utils/constants';

interface VideoPlayerProps {
  item: MediaItem;
  onClose: () => void;
  onOpenEditor: (item: MediaItem) => void;
  onShare: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  onClose,
  onOpenEditor,
  onShare,
  onDelete,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else setIsMuted(false);
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIndex];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {}
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {}
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-sm select-none"
    >
      {/* Top Action Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Back to library"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-sm md:text-base text-slate-100 truncate max-w-[240px] md:max-w-md">
              {item.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>{item.filename}</span>
              <span>•</span>
              <span>{formatBytes(item.fileSize)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenEditor(item)}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-xs font-semibold text-white transition-all shadow-lg shadow-[#FF4B2B33]"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onShare(item)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Share recording"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500/30 text-red-400 transition-colors"
            title="Delete recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Surface */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <video
          ref={videoRef}
          src={item.url}
          onClick={togglePlay}
          playsInline
          className="max-h-full max-w-full object-contain cursor-pointer"
        />

        {/* Big Play overlay if paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute p-5 rounded-full bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:scale-110 text-white shadow-2xl backdrop-blur-sm transition-transform"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="w-full flex items-center space-x-3 mb-3">
          <span className="text-xs font-mono text-white/90 w-12 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="relative flex-1 group py-1">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-[#FF4B2B] hover:h-2 transition-all"
            />
          </div>
          <span className="text-xs font-mono text-[#888] w-12">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRewind}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white hover:brightness-110 shadow-md shadow-[#FF4B2B33] transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              type="button"
              onClick={handleForward}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              title="Fast forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2 ml-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-[#FF4B2B]"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Speed toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-medium text-slate-200 transition-colors"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
