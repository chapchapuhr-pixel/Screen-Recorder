import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings, MediaItem, RecordingStatus } from './types';
import { DEFAULT_SETTINGS, generateFilename } from './utils/constants';
import { screenRecorder } from './services/ScreenRecorderEngine';
import { mediaStorage } from './services/MediaStorageService';

// UI Components
import { HomeDashboard } from './components/HomeDashboard';
import { LibraryView } from './components/LibraryView';
import { SettingsView } from './components/SettingsView';
import { AndroidProjectExport } from './components/AndroidProjectExport';
import { FloatingController } from './components/FloatingController';
import { CameraOverlay } from './components/CameraOverlay';
import { DrawingOverlay } from './components/DrawingOverlay';
import { CountdownOverlay } from './components/CountdownOverlay';
import { NotificationBar } from './components/NotificationBar';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoEditor } from './components/VideoEditor';
import { PermissionDialog, PermissionStage } from './components/PermissionDialog';

// Icons
import {
  Video,
  FolderOpen,
  Settings,
  Code2,
  Smartphone,
  Maximize2,
  Minimize2,
  Wifi,
  BatteryMedium,
  Check,
  Info,
} from 'lucide-react';

type NavTab = 'home' | 'library' | 'settings' | 'codebase';

export default function App() {
  // Navigation & Frame
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('screenpro_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Recording State
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Active Overlays
  const [showFloating, setShowFloating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  // Permission Flow
  const [permissionStage, setPermissionStage] = useState<PermissionStage | null>(null);

  // Media Library
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  // Touch Visualizer
  const [touchRipples, setTouchRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load recordings on mount
  const refreshLibrary = useCallback(async () => {
    const items = await mediaStorage.getAll();
    setMediaItems(items);
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Sync with Recorder Engine
  useEffect(() => {
    const unsubscribe = screenRecorder.subscribeStatus((newStatus, seconds) => {
      setStatus(newStatus);
      setElapsedSeconds(seconds);

      if (newStatus === 'recording') {
        setShowFloating(true);
        if (settings.camera.enabled) {
          setShowCamera(true);
        }
      } else if (newStatus === 'idle') {
        setShowFloating(false);
        setShowCamera(false);
        setIsDrawingActive(false);
      }
    });

    return unsubscribe;
  }, [settings.camera.enabled]);

  // Persist settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('screenpro_settings', JSON.stringify(newSettings));
  };

  // Permission pipeline before starting recording
  const handleStartRecordingWorkflow = () => {
    if (status !== 'idle') return;

    // Check if Audio permission needed
    if (settings.audio.source !== 'disabled') {
      setPermissionStage('audio');
      return;
    }

    // Check if Camera permission needed
    if (settings.camera.enabled) {
      setPermissionStage('camera');
      return;
    }

    // Direct to MediaProjection
    setPermissionStage('projection');
  };

  const handlePermissionGrant = () => {
    if (permissionStage === 'audio') {
      if (settings.camera.enabled) {
        setPermissionStage('camera');
      } else {
        setPermissionStage('projection');
      }
    } else if (permissionStage === 'camera') {
      setPermissionStage('projection');
    } else if (permissionStage === 'projection') {
      setPermissionStage(null);
      initiateCountdownAndRecord();
    }
  };

  const handlePermissionDeny = () => {
    setPermissionStage(null);
    showToast('Permission denied. Screen recording cannot proceed.');
  };

  const initiateCountdownAndRecord = () => {
    const delay = settings.recording.countdown;
    if (delay > 0) {
      setCountdownValue(delay);
    } else {
      executeStartRecording();
    }
  };

  const handleCountdownFinished = () => {
    setCountdownValue(null);
    executeStartRecording();
  };

  const executeStartRecording = async () => {
    try {
      await screenRecorder.startRecording(settings);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      showToast(err.message || 'Screen capture permission was cancelled.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const savedItem = await screenRecorder.stopRecording();
      if (savedItem) {
        await refreshLibrary();
        showToast(`Saved to Movies/ScreenPro: ${savedItem.title}`);
        setPlayingItem(savedItem);
      }
    } catch (err: any) {
      console.error('Error stopping recording:', err);
    }
  };

  const handlePauseRecording = () => {
    screenRecorder.pauseRecording();
  };

  const handleResumeRecording = () => {
    screenRecorder.resumeRecording();
  };

  const handleTakeScreenshot = async () => {
    try {
      const screenshot = await screenRecorder.captureScreenshot();
      await refreshLibrary();
      showToast('Screenshot saved to Pictures/ScreenPro');
    } catch (err: any) {
      console.error('Screenshot error:', err);
      showToast('Could not capture screenshot.');
    }
  };

  // Library actions
  const handleDeleteItem = async (item: MediaItem) => {
    await mediaStorage.delete(item.id);
    await refreshLibrary();
    showToast(`Deleted ${item.title}`);
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    await mediaStorage.deleteMultiple(ids);
    await refreshLibrary();
    showToast(`Deleted ${ids.length} recordings`);
  };

  const handleRenameItem = async (item: MediaItem, newName: string) => {
    await mediaStorage.rename(item.id, newName);
    await refreshLibrary();
    showToast(`Renamed to "${newName}"`);
  };

  const handleShareItem = async (item: MediaItem) => {
    if (navigator.share && item.blob) {
      try {
        const file = new File([item.blob], item.filename, { type: item.mimeType });
        await navigator.share({
          title: item.title,
          text: 'Screen recording from ScreenPro',
          files: [file],
        });
        return;
      } catch (e) {
        // fallback to download
      }
    }

    // Direct browser file download fallback
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.filename;
    a.click();
    showToast(`Exported ${item.filename}`);
  };

  // Touch visualizer listener
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!settings.recording.showTouches) return;
    const ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
    };
    setTouchRipples((prev) => [...prev, ripple]);
    setTimeout(() => {
      setTouchRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);
  };

  return (
    <div
      id="screenpro-app-root"
      onPointerDown={handlePointerDown}
      className="relative w-screen h-screen bg-[#0A0A0A] text-[#E0E0E0] flex items-center justify-center overflow-hidden select-none font-sans"
    >
      {/* Touch Visualizer Ripples */}
      {touchRipples.map((r) => (
        <div
          key={r.id}
          className="fixed pointer-events-none rounded-full border-2 border-[#FF4B2B] bg-[#FF4B2B]/25 animate-ping z-[9999]"
          style={{
            left: r.x - 20,
            top: r.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}

      {/* Floating Foreground Notifications / Overlays */}
      <NotificationBar
        status={status}
        elapsedSeconds={elapsedSeconds}
        onPause={handlePauseRecording}
        onResume={handleResumeRecording}
        onStop={handleStopRecording}
      />

      {/* Draggable Floating Controller */}
      {showFloating && (
        <FloatingController
          status={status}
          elapsedSeconds={elapsedSeconds}
          isDrawingActive={isDrawingActive}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
          onStop={handleStopRecording}
          onScreenshot={handleTakeScreenshot}
          onToggleDrawing={() => setIsDrawingActive(!isDrawingActive)}
        />
      )}

      {/* Draggable Front Camera Bubble */}
      {showCamera && (
        <CameraOverlay
          mirrored={settings.camera.mirrored}
          bubbleShape={settings.camera.bubbleShape}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Drawing Screen Annotation Canvas */}
      {isDrawingActive && (
        <DrawingOverlay
          onClose={() => setIsDrawingActive(false)}
          onScreenshot={handleTakeScreenshot}
        />
      )}

      {/* Countdown Overlay */}
      {countdownValue !== null && (
        <CountdownOverlay
          seconds={countdownValue}
          onFinished={handleCountdownFinished}
          onCancel={() => setCountdownValue(null)}
        />
      )}

      {/* Permission Request Dialog */}
      {permissionStage !== null && (
        <PermissionDialog
          stage={permissionStage}
          onGrant={handlePermissionGrant}
          onDeny={handlePermissionDeny}
        />
      )}

      {/* Video Player Modal */}
      {playingItem && (
        <VideoPlayer
          item={playingItem}
          onClose={() => setPlayingItem(null)}
          onOpenEditor={(item) => {
            setPlayingItem(null);
            setEditingItem(item);
          }}
          onEdit={(item) => {
            setPlayingItem(null);
            setEditingItem(item);
          }}
          onShare={handleShareItem}
          onDelete={handleDeleteItem}
        />
      )}

      {/* Video Editor Modal */}
      {editingItem && (
        <VideoEditor
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(newItem) => {
            setEditingItem(null);
            refreshLibrary();
            setPlayingItem(newItem);
            showToast(`Saved edited video: ${newItem.title}`);
          }}
        />
      )}

      {/* App Container - Phone Frame Mode vs Fullscreen View */}
      <div
        className={`relative flex flex-col transition-all duration-300 overflow-hidden ${
          isPhoneFrame
            ? 'w-[390px] h-[820px] max-h-[96vh] max-w-[96vw] rounded-[48px] border-[10px] border-[#1F1F1F] bg-[#0A0A0A] shadow-2xl ring-1 ring-[#2A2A2A]'
            : 'w-full h-full rounded-none border-none bg-[#0A0A0A]'
        }`}
      >
        {/* Android Status Bar in Phone Frame Mode */}
        {isPhoneFrame && (
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-mono font-medium text-[#888] bg-[#0A0A0A] shrink-0 select-none z-20">
            <span>09:41</span>

            {/* Front Camera Punch-Hole */}
            <div className="w-4 h-4 rounded-full bg-black ring-2 ring-[#222]" />

            <div className="flex items-center space-x-1.5">
              <Wifi className="w-3.5 h-3.5 text-[#888]" />
              <BatteryMedium className="w-4 h-4 text-[#888]" />
            </div>
          </div>
        )}

        {/* Top App Bar */}
        <header className="h-14 px-4 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF4B2B] to-[#FF416C] flex items-center justify-center shadow-lg shadow-[#FF4B2B22]">
              <div className="w-3 h-3 bg-white rounded-full ring-2 ring-white/20" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center space-x-1.5">
                <span>Screen<span className="text-[#FF4B2B]">Pro</span></span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#FF4B2B]/10 border border-[#FF4B2B]/30 text-[#FF4B2B] font-mono font-semibold">
                  REC
                </span>
              </h1>
            </div>
          </div>

          {/* Top Controls: Frame Mode Toggle */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="p-2 rounded-xl text-[#999] hover:text-white bg-[#1A1A1A] hover:bg-[#252525] border border-[#333] transition-colors"
              title={isPhoneFrame ? 'Expand to Fullscreen' : 'Switch to Android Phone View'}
            >
              {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Screen Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentTab === 'home' && (
            <HomeDashboard
              status={status}
              elapsedSeconds={elapsedSeconds}
              recentItems={mediaItems}
              onStartRecording={handleStartRecordingWorkflow}
              onStopRecording={handleStopRecording}
              onTakeScreenshot={handleTakeScreenshot}
              onNavigateLibrary={() => setCurrentTab('library')}
              onNavigateSettings={() => setCurrentTab('settings')}
              onNavigateCodebase={() => setCurrentTab('codebase')}
              onPlayItem={(item) => setPlayingItem(item)}
              onEditItem={(item) => setEditingItem(item)}
              onShareItem={handleShareItem}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {currentTab === 'library' && (
            <LibraryView
              items={mediaItems}
              onPlay={(item) => setPlayingItem(item)}
              onEdit={(item) => setEditingItem(item)}
              onDelete={handleDeleteItem}
              onDeleteMultiple={handleDeleteMultiple}
              onRename={handleRenameItem}
              onShare={handleShareItem}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} />
          )}

          {currentTab === 'codebase' && <AndroidProjectExport />}
        </main>

        {/* Material 3 Bottom Navigation Bar */}
        <nav
          id="android-bottom-navigation"
          className="h-16 px-4 bg-[#0F0F0F] border-t border-[#1A1A1A] flex items-center justify-around shrink-0 select-none z-10"
        >
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'home'
                ? 'text-[#FF4B2B] font-semibold'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                currentTab === 'home' ? 'bg-[#FF4B2B]/10 text-[#FF4B2B]' : ''
              }`}
            >
              <Video className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Recorder</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('library')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'library'
                ? 'text-[#FF4B2B] font-semibold'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                currentTab === 'library' ? 'bg-[#FF4B2B]/10 text-[#FF4B2B]' : ''
              }`}
            >
              <FolderOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Library</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'settings'
                ? 'text-[#FF4B2B] font-semibold'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                currentTab === 'settings' ? 'bg-[#FF4B2B]/10 text-[#FF4B2B]' : ''
              }`}
            >
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('codebase')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-2xl transition-all ${
              currentTab === 'codebase'
                ? 'text-[#FF4B2B] font-semibold'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                currentTab === 'codebase' ? 'bg-[#FF4B2B]/10 text-[#FF4B2B]' : ''
              }`}
            >
              <Code2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Android</span>
          </button>
        </nav>

        {/* Android Gesture Navigation Bar Pill */}
        {isPhoneFrame && (
          <div className="h-4 bg-[#0F0F0F] flex items-center justify-center shrink-0">
            <div className="w-32 h-1 rounded-full bg-[#333]" />
          </div>
        )}
      </div>

      {/* Floating System Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-2xl bg-[#1A1A1A]/95 border border-[#333] text-[#E0E0E0] text-xs font-medium shadow-2xl flex items-center space-x-2 animate-fade-in backdrop-blur-md">
          <Info className="w-4 h-4 text-[#FF4B2B] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
