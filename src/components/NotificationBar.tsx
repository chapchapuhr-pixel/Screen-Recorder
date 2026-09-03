import React from 'react';
import { Play, Pause, Square, Camera, ShieldCheck } from 'lucide-react';
import { formatDuration } from '../utils/constants';

interface NotificationBarProps {
  elapsedSeconds: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onScreenshot: () => void;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  elapsedSeconds,
  isPaused,
  onPause,
  onResume,
  onStop,
  onScreenshot,
}) => {
  return (
    <div
      id="screenpro-notification-banner"
      className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 shadow-md animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center space-x-2.5">
        <div className="p-1 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 font-medium text-slate-200">
            <span>ScreenPro</span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-[10px] text-cyan-400 font-mono">
              FOREGROUND_SERVICE_MEDIA_PROJECTION
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            {isPaused ? 'Recording paused' : 'Screen recording in progress'} — {formatDuration(elapsedSeconds)}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          type="button"
          onClick={onStop}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-red-950/80 border border-red-800/60 hover:bg-red-900 text-red-300 transition-colors"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop</span>
        </button>

        <button
          type="button"
          onClick={onScreenshot}
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Take screenshot"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
