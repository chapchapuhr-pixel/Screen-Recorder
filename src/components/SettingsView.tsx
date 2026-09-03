import React, { useState } from 'react';
import { AppSettings, AudioSourcePreset, BitratePreset, FpsPreset, ResolutionPreset } from '../types';
import {
  Video,
  Mic,
  Camera,
  HardDrive,
  Moon,
  Bell,
  Info,
  Shield,
  HelpCircle,
  AlertTriangle,
  FileText,
  Sliders,
} from 'lucide-react';
import { RESOLUTION_MAP } from '../utils/constants';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'recording' | 'audio' | 'camera' | 'storage' | 'appearance' | 'about'
  >('recording');

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);

  const updateSection = <K extends keyof AppSettings>(section: K, patch: Partial<AppSettings[K]>) => {
    onUpdateSettings({
      ...settings,
      [section]: {
        ...settings[section],
        ...patch,
      },
    });
  };

  return (
    <div id="screenpro-settings" className="w-full flex-1 flex flex-col overflow-hidden bg-[#0A0A0A] text-[#E0E0E0]">
      {/* Sub-navigation tabs */}
      <div className="flex border-b border-[#1A1A1A] bg-[#0F0F0F] overflow-x-auto px-4 py-2 space-x-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('recording')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeSubTab === 'recording'
              ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Recording</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('audio')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeSubTab === 'audio'
              ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('camera')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeSubTab === 'camera'
              ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Face Cam</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('storage')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeSubTab === 'storage'
              ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeSubTab === 'appearance'
              ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Theme</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('about')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeSubTab === 'about'
              ? 'bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold shadow-md shadow-[#FF4B2B33]'
              : 'text-[#888] hover:text-white'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Compliance</span>
        </button>
      </div>

      {/* Settings Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* RECORDING SETTINGS */}
        {activeSubTab === 'recording' && (
          <div className="space-y-4">
            {/* Resolution */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-1">Video Resolution</label>
              <p className="text-[11px] text-[#888] mb-3">
                Select default capture resolution. Hardware encoders scale output automatically.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['auto', '480p', '720p', '1080p', '1440p', '4k'] as ResolutionPreset[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => updateSection('recording', { resolution: res })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium text-left border transition-all ${
                      settings.recording.resolution === res
                        ? 'border-[#FF4B2B] bg-[#FF4B2B]/15 text-[#FF4B2B] font-semibold ring-1 ring-[#FF4B2B]/40'
                        : 'border-[#252525] bg-[#161616] text-[#888] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    <span className="block font-bold">{res.toUpperCase()}</span>
                    <span className="text-[10px] opacity-75">{RESOLUTION_MAP[res]?.label || res}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Rate FPS */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-1">Frame Rate (FPS)</label>
              <p className="text-[11px] text-[#888] mb-3">
                Higher frame rates produce smoother motion for gameplay recordings.
              </p>
              <div className="flex space-x-3">
                {([24, 30, 60] as FpsPreset[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => updateSection('recording', { fps: f })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      settings.recording.fps === f
                        ? 'border-[#FF4B2B] bg-[#FF4B2B]/15 text-[#FF4B2B] ring-1 ring-[#FF4B2B]/40'
                        : 'border-[#252525] bg-[#161616] text-[#888] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    {f} FPS {f === 60 ? '⚡ Ultra' : f === 30 ? '• Standard' : '• Cinema'}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Bitrate */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-1">Encoding Bitrate</label>
              <p className="text-[11px] text-[#888] mb-3">
                Balances video sharpness and compressed file size.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {(['auto', 'low', 'medium', 'high'] as BitratePreset[]).map((br) => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => updateSection('recording', { bitrate: br })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      settings.recording.bitrate === br
                        ? 'border-[#FF4B2B] bg-[#FF4B2B]/15 text-[#FF4B2B] ring-1 ring-[#FF4B2B]/40'
                        : 'border-[#252525] bg-[#161616] text-[#888] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    {br.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Countdown Duration */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white">Start Countdown</label>
                <p className="text-[11px] text-[#888]">Delay before screen capture engages.</p>
              </div>
              <select
                value={settings.recording.countdown}
                onChange={(e) => updateSection('recording', { countdown: Number(e.target.value) as any })}
                className="bg-[#161616] border border-[#252525] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#FF4B2B]"
              >
                <option value={0}>Off (Instant)</option>
                <option value={3}>3 Seconds</option>
                <option value={5}>5 Seconds</option>
                <option value={10}>10 Seconds</option>
              </select>
            </div>

            {/* Show Touches */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white">Show Touch Visualizer</label>
                <p className="text-[11px] text-[#888]">
                  Displays interactive touch ripple effects where tapped.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.recording.showTouches}
                onChange={(e) => updateSection('recording', { showTouches: e.target.checked })}
                className="w-5 h-5 rounded accent-[#FF4B2B] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* AUDIO SETTINGS */}
        {activeSubTab === 'audio' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-1">Audio Recording Source</label>
              <p className="text-[11px] text-[#888] mb-3">
                Configure whether audio is captured from microphone, device playback, or both.
              </p>

              <div className="space-y-2">
                {[
                  { id: 'mic', title: 'Microphone Only', desc: 'Narrate and record room sound' },
                  {
                    id: 'internal',
                    title: 'Internal Device Audio',
                    desc: 'Record in-app and game sound (Android 10+ AudioPlaybackCapture)',
                  },
                  {
                    id: 'both',
                    title: 'Internal + Microphone Mixed',
                    desc: 'Real-time studio mixing with independent gain normalization',
                  },
                  { id: 'disabled', title: 'No Audio (Muted)', desc: 'Silent video output' },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => updateSection('audio', { source: item.id as AudioSourcePreset })}
                    className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      settings.audio.source === item.id
                        ? 'border-[#FF4B2B] bg-[#FF4B2B]/10'
                        : 'border-[#252525] bg-[#161616] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audioSource"
                      checked={settings.audio.source === item.id}
                      onChange={() => {}}
                      className="mt-1 accent-[#FF4B2B]"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white">{item.title}</div>
                      <div className="text-[11px] text-[#888]">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Android Internal Audio Policy Card */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 text-xs text-[#E0E0E0]">
              <div className="flex items-center space-x-2 font-semibold text-[#FF4B2B] mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Android AudioPlaybackCapture Notice</span>
              </div>
              <p className="text-[11px] text-[#888] leading-relaxed">
                Internal audio capture adheres strictly to Android 10+ (API 29) specifications. Apps that disable audio
                capture via <code className="font-mono bg-[#111] px-1 py-0.5 rounded text-[#FF4B2B]">USAGE_VOICE_COMMUNICATION</code> or
                explicit DRM protection will output silence.
              </p>
            </div>

            {/* Microphone Enhancements */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Acoustic Echo Cancellation</div>
                  <div className="text-[11px] text-[#888]">Suppresses feedback from device speakers.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audio.echoCancellation}
                  onChange={(e) => updateSection('audio', { echoCancellation: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#FF4B2B]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                <div>
                  <div className="text-xs font-semibold text-white">Noise Suppression</div>
                  <div className="text-[11px] text-[#888]">Filters background hiss and environmental hums.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.audio.noiseSuppression}
                  onChange={(e) => updateSection('audio', { noiseSuppression: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#FF4B2B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* CAMERA SETTINGS */}
        {activeSubTab === 'camera' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white">Face Camera Bubble</label>
                <p className="text-[11px] text-[#888]">Display draggable front camera picture-in-picture.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.camera.enabled}
                onChange={(e) => updateSection('camera', { enabled: e.target.checked })}
                className="w-5 h-5 rounded accent-[#FF4B2B] cursor-pointer"
              />
            </div>

            {/* Bubble Shape */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-2">Bubble Geometry</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateSection('camera', { bubbleShape: 'circle' })}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                    settings.camera.bubbleShape === 'circle'
                      ? 'border-[#FF4B2B] bg-[#FF4B2B]/15 text-[#FF4B2B]'
                      : 'border-[#252525] bg-[#161616] text-[#888] hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border-2 border-current" />
                  <span className="text-xs font-medium">Circular Bubble</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSection('camera', { bubbleShape: 'rounded-square' })}
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                    settings.camera.bubbleShape === 'rounded-square'
                      ? 'border-[#FF4B2B] bg-[#FF4B2B]/15 text-[#FF4B2B]'
                      : 'border-[#252525] bg-[#161616] text-[#888] hover:bg-[#1A1A1A] hover:text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg border-2 border-current" />
                  <span className="text-xs font-medium">Rounded Square</span>
                </button>
              </div>
            </div>

            {/* Mirror Camera */}
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white">Mirror Camera View</label>
                <p className="text-[11px] text-[#888]">Inverts the webcam horizontally for natural preview.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.camera.mirrored}
                onChange={(e) => updateSection('camera', { mirrored: e.target.checked })}
                className="w-5 h-5 rounded accent-[#FF4B2B]"
              />
            </div>
          </div>
        )}

        {/* STORAGE SETTINGS */}
        {activeSubTab === 'storage' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-1">Default Filename Prefix</label>
              <input
                type="text"
                value={settings.storage.filenamePrefix}
                onChange={(e) => updateSection('storage', { filenamePrefix: e.target.value })}
                className="w-full bg-[#161616] border border-[#252525] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#FF4B2B] font-mono"
              />
              <p className="text-[10px] text-[#888] mt-1">
                Output preview: <code className="text-[#FF4B2B]">{settings.storage.filenamePrefix}2026-09-02_14-30-00.mp4</code>
              </p>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-white">Preserve Source After Editing</label>
                <p className="text-[11px] text-[#888]">
                  Always saves edited copies separately without deleting original recordings.
                </p>
              </div>
              <input
                type="checkbox"
                checked={!settings.storage.deleteSourceAfterEdit}
                onChange={(e) => updateSection('storage', { deleteSourceAfterEdit: !e.target.checked })}
                className="w-5 h-5 rounded accent-[#FF4B2B]"
              />
            </div>

            <div className="bg-[#111] border border-[#222] rounded-2xl p-4 text-xs">
              <label className="block font-semibold text-white mb-1">Android MediaStore Destination</label>
              <div className="font-mono text-[#FF4B2B] bg-[#0A0A0A] p-2.5 rounded-xl border border-[#222]">
                Movies/ScreenPro/
              </div>
              <p className="text-[11px] text-[#888] mt-2">
                Scoped storage compliant. Does not require broad <code className="text-slate-300">MANAGE_EXTERNAL_STORAGE</code>.
              </p>
            </div>
          </div>
        )}

        {/* APPEARANCE */}
        {activeSubTab === 'appearance' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#222] rounded-2xl p-4">
              <label className="block text-xs font-semibold text-white mb-2">Theme Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateSection('appearance', { theme: t })}
                    className={`py-2.5 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      settings.appearance.theme === t
                        ? 'border-[#FF4B2B] bg-[#FF4B2B]/15 text-[#FF4B2B] ring-1 ring-[#FF4B2B]/40'
                        : 'border-[#252525] bg-[#161616] text-[#888] hover:bg-[#1A1A1A] hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABOUT & COMPLIANCE */}
        {activeSubTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-[#222] rounded-3xl p-5 text-center shadow-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-[#FF4B2B33] mb-3">
                <div className="w-5 h-5 bg-white rounded-full ring-4 ring-white/20" />
              </div>
              <h3 className="font-bold text-base text-white">Screen<span className="text-[#FF4B2B]">Pro</span></h3>
              <p className="text-xs text-[#FF4B2B] font-mono">v2.4.0 (Production Release)</p>
              <p className="text-[11px] text-[#888] mt-2 max-w-sm mx-auto">
                Built strictly with official Android MediaProjection, AudioPlaybackCapture, MediaStore, and Jetpack Compose.
              </p>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-2xl divide-y divide-[#222] text-xs">
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#161616] transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-[#FF4B2B]" />
                  <span className="font-semibold text-white">Google Play Privacy Policy & Data Safety</span>
                </div>
                <span className="text-[#666]">Read &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLicenses(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#161616] transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-[#FF4B2B]" />
                  <span className="font-semibold text-white">Open-Source Licenses</span>
                </div>
                <span className="text-[#666]">View &rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <h3 className="font-semibold text-sm text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#FF4B2B]" />
                <span>ScreenPro Privacy Policy & Data Safety</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-[#666] hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 text-xs text-[#888] leading-relaxed">
              <p>
                <strong className="text-white">1. Local Storage Only:</strong> ScreenPro processes and stores all video recordings, audio streams,
                and screenshots exclusively on your local device. No media is ever transmitted to remote cloud servers
                without your explicit manual sharing action.
              </p>
              <p>
                <strong className="text-white">2. Explicit Consent:</strong> Screen capture is never initiated secretly. Every recording session
                requires system-level MediaProjection permission granted by the user.
              </p>
              <p>
                <strong className="text-white">3. Microphone & Camera:</strong> Audio and camera streams are utilized strictly for the duration
                of active recordings and are never captured in the background.
              </p>
              <p>
                <strong className="text-white">4. Scoped Storage Compliance:</strong> Files are saved to Android standard MediaStore folders
                (<code className="font-mono text-[#FF4B2B]">Movies/ScreenPro</code>) avoiding broad storage access permissions.
              </p>
            </div>

            <div className="pt-3 border-t border-[#222] flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyPolicy(false)}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] text-white font-semibold text-xs hover:brightness-110 shadow-md shadow-[#FF4B2B33] transition-all"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Source Licenses Modal */}
      {showLicenses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111] border border-[#222] rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#222]">
              <h3 className="font-semibold text-sm text-white">Open Source Licenses</h3>
              <button
                type="button"
                onClick={() => setShowLicenses(false)}
                className="text-[#666] hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 text-xs text-[#888] font-mono">
              <div className="p-3 bg-[#0A0A0A] rounded-xl border border-[#222]">
                <div className="text-white font-bold mb-1">Android Open Source Project (AOSP)</div>
                <div>Apache License 2.0</div>
              </div>
              <div className="p-3 bg-[#0A0A0A] rounded-xl border border-[#222]">
                <div className="text-white font-bold mb-1">AndroidX & Jetpack Compose</div>
                <div>Apache License 2.0</div>
              </div>
              <div className="p-3 bg-[#0A0A0A] rounded-xl border border-[#222]">
                <div className="text-white font-bold mb-1">Media3 ExoPlayer & Transformer</div>
                <div>Apache License 2.0</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222] flex justify-end">
              <button
                type="button"
                onClick={() => setShowLicenses(false)}
                className="px-4 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] text-[#999] text-xs hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
