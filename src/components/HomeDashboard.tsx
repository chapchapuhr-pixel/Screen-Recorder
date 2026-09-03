import React from 'react';
import { MediaItem, RecordingStatus } from '../types';
import {
  Video,
  Play,
  Square,
  Camera,
  FolderOpen,
  Settings,
  Clock,
  HardDrive,
  Scissors,
  Share2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import { formatBytes, formatDuration } from '../utils/constants';

interface HomeDashboardProps {
  status: RecordingStatus;
  elapsedSeconds: number;
  recentItems: MediaItem[];
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTakeScreenshot: () => void;
  onNavigateLibrary: () => void;
  onNavigateSettings: () => void;
  onNavigateCodebase: () => void;
  onPlayItem: (item: MediaItem) => void;
  onEditItem: (item: MediaItem) => void;
  onShareItem: (item: MediaItem) => void;
  onDeleteItem: (item: MediaItem) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  status,
  elapsedSeconds,
  recentItems,
  onStartRecording,
  onStopRecording,
  onTakeScreenshot,
  onNavigateLibrary,
  onNavigateSettings,
  onNavigateCodebase,
  onPlayItem,
  onEditItem,
  onShareItem,
  onDeleteItem,
}) => {
  const isRecording = status === 'recording' || status === 'paused';

  return (
    <div id="screenpro-dashboard" className="w-full flex-1 flex flex-col overflow-y-auto bg-[#0A0A0A] text-[#E0E0E0] p-4 space-y-6">
      {/* Hero Recording Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#111] border border-[#222] p-6 shadow-2xl">
        {/* Subtle background glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF4B2B]/10 to-[#FF416C]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center space-x-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording ? 'bg-[#FF4B2B] animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-mono tracking-widest uppercase text-white/70">
              {isRecording ? 'Recording Active' : 'System Ready'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#999] bg-[#1A1A1A] border border-[#333] px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF4B2B]" />
            <span>MediaProjection</span>
          </div>
        </div>

        {/* Big Prominent Start/Stop Action */}
        <div className="flex flex-col items-center justify-center py-6 text-center relative z-10">
          {isRecording ? (
            <div className="mb-6 flex flex-col items-center">
              <span className="font-mono text-4xl sm:text-5xl font-extrabold text-white tracking-wider">
                {formatDuration(elapsedSeconds)}
              </span>
              <span className="text-xs text-[#FF4B2B] font-medium mt-1.5 tracking-wider animate-pulse uppercase">
                • 1080p 60fps Active •
              </span>
            </div>
          ) : (
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Record Screen & Audio
              </h2>
              <p className="text-xs text-[#888] mt-1 max-w-sm">
                Capture gameplay, tutorials, meetings, and apps with crystal-clear fidelity.
              </p>
            </div>
          )}

          {/* Glowing Circular Action Trigger */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-6 bg-gradient-to-r from-[#FF4B2B] to-[#FF416C] rounded-full opacity-20 blur-2xl group-hover:opacity-35 transition-opacity" />
            
            <button
              id="btn-main-record-trigger"
              type="button"
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`relative w-40 h-40 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,75,43,0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-600 to-[#FF4B2B] text-white ring-4 ring-red-500/20'
                  : 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white ring-4 ring-[#FF4B2B]/20'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-12 h-12 text-white fill-current mb-1" />
                  <span className="text-white font-bold text-sm uppercase tracking-widest">
                    Stop
                  </span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full border-4 border-white/80 flex items-center justify-center mb-1">
                    <div className="w-5 h-5 bg-white rounded-full" />
                  </div>
                  <span className="text-white font-bold text-sm uppercase tracking-widest">
                    Start
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Capabilities Bar */}
        <div className="grid grid-cols-3 gap-6 pt-6 mt-4 border-t border-[#222] text-center">
          <div>
            <p className="text-[#666] text-[10px] sm:text-xs uppercase tracking-tighter mb-1">Resolution</p>
            <p className="text-white font-medium text-xs sm:text-sm">1080p FHD</p>
          </div>
          <div>
            <p className="text-[#666] text-[10px] sm:text-xs uppercase tracking-tighter mb-1">Frame Rate</p>
            <p className="text-white font-medium text-xs sm:text-sm">60 FPS</p>
          </div>
          <div>
            <p className="text-[#666] text-[10px] sm:text-xs uppercase tracking-tighter mb-1">Audio Mixer</p>
            <p className="text-white font-medium text-xs sm:text-sm">Dual Stream</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onTakeScreenshot}
          className="flex items-center space-x-3 p-3 bg-[#161616] hover:bg-[#1A1A1A] border border-[#252525] hover:border-[#333] rounded-2xl transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-[#222] text-[#999] group-hover:text-[#FF4B2B] border border-[#333] transition-colors">
            <Camera className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Screenshot</div>
            <div className="text-[10px] text-[#666]">Instant capture</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateLibrary}
          className="flex items-center space-x-3 p-3 bg-[#161616] hover:bg-[#1A1A1A] border border-[#252525] hover:border-[#333] rounded-2xl transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-[#222] text-[#999] group-hover:text-[#FF4B2B] border border-[#333] transition-colors">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Library</div>
            <div className="text-[10px] text-[#666]">{recentItems.length} recordings</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateSettings}
          className="flex items-center space-x-3 p-3 bg-[#161616] hover:bg-[#1A1A1A] border border-[#252525] hover:border-[#333] rounded-2xl transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-[#222] text-[#999] group-hover:text-[#FF4B2B] border border-[#333] transition-colors">
            <Settings className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Settings</div>
            <div className="text-[10px] text-[#666]">Encoder & audio</div>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateCodebase}
          className="flex items-center space-x-3 p-3 bg-[#161616] hover:bg-[#1A1A1A] border border-[#252525] hover:border-[#333] rounded-2xl transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-[#222] text-[#999] group-hover:text-[#FF4B2B] border border-[#333] transition-colors">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Android Code</div>
            <div className="text-[10px] text-[#666]">Gradle & ZIP</div>
          </div>
        </button>
      </div>

      {/* Recent Recordings Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Recent Library</h3>
          <button
            type="button"
            onClick={onNavigateLibrary}
            className="text-xs font-medium text-[#FF4B2B] hover:underline"
          >
            View All ({recentItems.length}) &rarr;
          </button>
        </div>

        {recentItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#111] border border-[#222] text-center text-[#666] text-xs">
            No recordings yet. Tap &quot;Start&quot; above to capture your screen.
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => onPlayItem(item)}
                className="group flex items-center p-3 rounded-2xl bg-[#161616] hover:bg-[#1A1A1A] border border-[#252525] hover:border-[#333] transition-all cursor-pointer space-x-3"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-xl bg-[#222] overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent pointer-events-none z-10" />
                  {item.thumbnailUrl || (item.type === 'screenshot' && item.url) ? (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Video className="w-5 h-5 text-[#555]" />
                  )}

                  {item.type === 'video' && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 font-mono text-[9px] text-white z-20">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-xs text-white truncate">{item.title}</h4>
                  <div className="flex items-center space-x-2 text-[10px] text-[#666] mt-1">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{formatBytes(item.fileSize)}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <span className="px-2 py-0.5 bg-[#222] text-[10px] rounded border border-[#333] text-[#999]">
                      {item.type === 'video' ? '1080p' : 'PNG'}
                    </span>
                    <span className="px-2 py-0.5 bg-[#222] text-[10px] rounded border border-[#333] text-[#999]">
                      {item.type === 'video' ? '60fps' : 'HQ'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center space-x-1 opacity-80 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.type === 'video' && (
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="p-1.5 hover:text-[#FF4B2B] rounded-lg text-[#666] hover:bg-[#222] transition-colors"
                      title="Edit"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onShareItem(item)}
                    className="p-1.5 hover:text-[#FF4B2B] rounded-lg text-[#666] hover:bg-[#222] transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="p-1.5 hover:text-red-400 rounded-lg text-[#666] hover:bg-[#222] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
