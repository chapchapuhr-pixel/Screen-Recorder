import { AppSettings, MediaItem } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  recording: {
    resolution: '1080p',
    fps: 30,
    bitrate: 'auto',
    customBitrateMbps: 8,
    orientation: 'auto',
    countdown: 3,
    showTouches: true,
    floatingControllerStyle: 'compact',
    hardwareAcceleration: true,
  },
  audio: {
    source: 'mic',
    sampleRate: 48000,
    channels: 2,
    echoCancellation: true,
    noiseSuppression: true,
    micGain: 1.0,
  },
  camera: {
    enabled: false,
    facingMode: 'user',
    bubbleShape: 'circle',
    bubbleSize: 'medium',
    mirrored: true,
    savedPosition: { x: 24, y: 120 },
  },
  storage: {
    filenamePrefix: 'ScreenRecord_',
    saveFolder: 'Movies/ScreenPro',
    autoCleanupDays: 0, // off
    deleteSourceAfterEdit: false,
  },
  appearance: {
    theme: 'dark',
    dynamicColor: true,
    viewMode: 'mobile',
  },
  notifications: {
    showRecordingNotification: true,
    showCompletionBanner: true,
  },
};

export const RESOLUTION_MAP = {
  auto: { width: 1920, height: 1080, label: 'Auto (Native Display)' },
  '480p': { width: 854, height: 480, label: 'SD (480p - 854×480)' },
  '720p': { width: 1280, height: 720, label: 'HD (720p - 1280×720)' },
  '1080p': { width: 1920, height: 1080, label: 'FHD (1080p - 1920×1080)' },
  '1440p': { width: 2560, height: 1440, label: '2K (1440p - 2560×1440)' },
  '4k': { width: 3840, height: 2160, label: '4K UHD (3840×2160)' },
};

export const BITRATE_MAP = {
  auto: 8000000,   // 8 Mbps
  low: 2500000,    // 2.5 Mbps
  medium: 6000000, // 6 Mbps
  high: 12000000,  // 12 Mbps
  custom: 8000000,
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) {
    const remainMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateFilename(prefix = 'ScreenRecord_', ext = 'mp4'): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.${ext}`;
}

/**
 * Creates a synthetic demo video blob in canvas so that on first load,
 * the user immediately has 2 real playable, editable demo recordings!
 */
export function createSyntheticDemoVideoBlob(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d')!;

    // Capture 3 seconds of animated canvas
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mime }));
    };

    recorder.start();

    let frame = 0;
    const totalFrames = 90; // 3 seconds at 30 fps
    const interval = setInterval(() => {
      frame++;
      // Draw dynamic Android screen UI demo
      const progress = frame / totalFrames;
      
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 720, 1280);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(1, '#1E1B4B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 1280);

      // Header status bar
      ctx.fillStyle = '#64748B';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText('09:41', 40, 50);
      ctx.fillText('ScreenPro Active • 60 FPS', 380, 50);

      // Card illustration
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(40, 100, 640, 320, 24);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Title
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('ScreenPro Engine Live Demo', 70, 170);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '22px system-ui, -apple-system, sans-serif';
      ctx.fillText('MediaProjection • AudioMixer • 1080p 60fps', 70, 215);

      // Animated wave bar
      const barWidth = 580;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(70, 280, barWidth, 16, 8);
      ctx.fill();

      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.roundRect(70, 280, barWidth * progress, 16, 8);
      ctx.fill();

      // Moving touch indicator simulation
      const touchX = 360 + Math.sin(frame * 0.1) * 180;
      const touchY = 700 + Math.cos(frame * 0.1) * 120;
      
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(touchX, touchY, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.beginPath();
      ctx.arc(touchX, touchY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bottom bar
      ctx.fillStyle = '#0284C7';
      ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Recorded Frame: ${frame} / ${totalFrames}`, 200, 1000);

      if (frame >= totalFrames) {
        clearInterval(interval);
        recorder.stop();
      }
    }, 1000 / 30);
  });
}
