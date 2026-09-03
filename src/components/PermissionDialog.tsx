import React from 'react';
import { Shield, Mic, Camera, Monitor, CheckCircle, AlertTriangle } from 'lucide-react';

export type PermissionStage = 'audio' | 'camera' | 'projection';

interface PermissionDialogProps {
  stage: PermissionStage;
  onGrant: () => void;
  onDeny: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({ stage, onGrant, onDeny }) => {
  return (
    <div
      id="android-system-permission-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-sm bg-[#111111] border border-[#222222] rounded-3xl p-6 shadow-2xl text-[#E0E0E0]">
        {/* Permission Stage: Audio */}
        {stage === 'audio' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF4B2B1F] text-[#FF4B2B] flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Allow ScreenPro to record audio?
            </h3>
            <p className="text-xs text-[#888] mb-6">
              Required to record your commentary, gameplay narration, and external microphone voiceover.
            </p>
            <div className="w-full space-y-2 text-xs font-semibold">
              <button
                type="button"
                onClick={onGrant}
                className="w-full py-3 rounded-2xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-white font-bold transition-all shadow-lg shadow-[#FF4B2B33]"
              >
                While using the app
              </button>
              <button
                type="button"
                onClick={onGrant}
                className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#252525] text-white transition-colors border border-[#2A2A2A]"
              >
                Only this time
              </button>
              <button
                type="button"
                onClick={onDeny}
                className="w-full py-3 rounded-2xl bg-transparent hover:bg-[#1A1A1A] text-[#888] transition-colors"
              >
                Don&apos;t allow
              </button>
            </div>
          </div>
        )}

        {/* Permission Stage: Camera */}
        {stage === 'camera' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF4B2B1F] text-[#FF4B2B] flex items-center justify-center mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Allow ScreenPro to take pictures and record video?
            </h3>
            <p className="text-xs text-[#888] mb-6">
              Required to display the floating face-cam picture-in-picture bubble during screen recordings.
            </p>
            <div className="w-full space-y-2 text-xs font-semibold">
              <button
                type="button"
                onClick={onGrant}
                className="w-full py-3 rounded-2xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-white font-bold transition-all shadow-lg shadow-[#FF4B2B33]"
              >
                While using the app
              </button>
              <button
                type="button"
                onClick={onGrant}
                className="w-full py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#252525] text-white transition-colors border border-[#2A2A2A]"
              >
                Only this time
              </button>
              <button
                type="button"
                onClick={onDeny}
                className="w-full py-3 rounded-2xl bg-transparent hover:bg-[#1A1A1A] text-[#888] transition-colors"
              >
                Don&apos;t allow
              </button>
            </div>
          </div>
        )}

        {/* Permission Stage: MediaProjection */}
        {stage === 'projection' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF4B2B1F] text-[#FF4B2B] flex items-center justify-center mb-4">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Start recording or casting with ScreenPro?
            </h3>
            <p className="text-xs text-[#888] leading-relaxed mb-6">
              ScreenPro will have access to all of the images, text, passwords, and payment info displayed on your screen or played from your device during recording.
            </p>
            <div className="w-full flex space-x-3 text-xs font-semibold">
              <button
                type="button"
                onClick={onDeny}
                className="flex-1 py-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#252525] text-white transition-colors border border-[#2A2A2A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onGrant}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] hover:brightness-110 text-white font-bold transition-all shadow-lg shadow-[#FF4B2B33]"
              >
                Start now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
