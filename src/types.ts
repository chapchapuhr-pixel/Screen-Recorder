/**
 * ScreenPro — Professional Android Screen Recorder
 * Global Type Definitions & Data Contracts
 */

export type RecordingStatus =
  | 'idle'
  | 'preparing'
  | 'countdown'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'finalizing'
  | 'completed'
  | 'error';

export type ResolutionPreset = 'auto' | '480p' | '720p' | '1080p' | '1440p' | '4k';
export type FpsPreset = 24 | 30 | 60;
export type BitratePreset = 'auto' | 'low' | 'medium' | 'high' | 'custom';
export type OrientationPreset = 'auto' | 'portrait' | 'landscape';
export type AudioSourcePreset = 'disabled' | 'mic' | 'internal' | 'both';
export type CountdownPreset = 0 | 3 | 5 | 10;

export type CameraBubbleShape = 'circle' | 'rounded-square';
export type CameraBubbleSize = 'small' | 'medium' | 'large';

export type DrawingToolType =
  | 'pen'
  | 'highlighter'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'eraser';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  tool: DrawingToolType;
  color: string;
  size: number;
  opacity: number;
  points: DrawingPoint[];
}

export interface MediaItem {
  id: string;
  type: 'video' | 'screenshot';
  title: string;
  filename: string;
  createdAt: number;
  duration: number; // in seconds (0 for screenshot)
  fileSize: number; // in bytes
  mimeType: string;
  url: string;
  blob?: Blob;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: string;
}

export interface TextOverlayItem {
  id: string;
  text: string;
  color: string;
  backgroundColor?: string;
  fontSize: number;
  fontFamily: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  opacity: number;
}

export interface StickerItem {
  id: string;
  emoji: string;
  xPercent: number;
  yPercent: number;
  scale: number;
  rotation: number;
}

export interface VideoEditorConfig {
  trimStart: number; // in seconds
  trimEnd: number;   // in seconds
  cropRatio: 'free' | '1:1' | '4:3' | '16:9' | '9:16';
  rotation: 0 | 90 | 180 | 270;
  playbackSpeed: 0.25 | 0.5 | 1 | 1.5 | 2;
  textOverlays: TextOverlayItem[];
  stickers: StickerItem[];
  drawings: DrawingStroke[];
  audioTrack?: {
    fileUrl: string;
    fileName: string;
    volume: number; // 0 to 1
    fadeIn: boolean;
    fadeOut: boolean;
  };
}

export interface AppSettings {
  recording: {
    resolution: ResolutionPreset;
    customWidth?: number;
    customHeight?: number;
    fps: FpsPreset;
    bitrate: BitratePreset;
    customBitrateMbps: number;
    orientation: OrientationPreset;
    countdown: CountdownPreset;
    showTouches: boolean;
    floatingControllerStyle: 'compact' | 'expanded';
    hardwareAcceleration: boolean;
  };
  audio: {
    source: AudioSourcePreset;
    sampleRate: number;
    channels: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    micGain: number;
  };
  camera: {
    enabled: boolean;
    facingMode: 'user' | 'environment';
    bubbleShape: CameraBubbleShape;
    bubbleSize: CameraBubbleSize;
    mirrored: boolean;
    savedPosition: { x: number; y: number };
  };
  storage: {
    filenamePrefix: string;
    saveFolder: string;
    autoCleanupDays: number;
    deleteSourceAfterEdit: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    dynamicColor: boolean;
    viewMode: 'mobile' | 'tablet' | 'fullscreen';
  };
  notifications: {
    showRecordingNotification: boolean;
    showCompletionBanner: boolean;
  };
}
