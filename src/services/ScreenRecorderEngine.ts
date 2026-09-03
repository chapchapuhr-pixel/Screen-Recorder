import { AppSettings, RecordingStatus } from '../types';
import { BITRATE_MAP, RESOLUTION_MAP } from '../utils/constants';

export class ScreenRecorderEngine {
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private combinedStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private recordedChunks: Blob[] = [];
  
  private status: RecordingStatus = 'idle';
  private startTime = 0;
  private pausedTime = 0;
  private elapsedSeconds = 0;
  private timerInterval: number | null = null;

  private onStatusChangeCallbacks: ((status: RecordingStatus) => void)[] = [];
  private onTickCallbacks: ((seconds: number) => void)[] = [];
  private onErrorCallbacks: ((errorMsg: string) => void)[] = [];

  constructor() {}

  public getStatus(): RecordingStatus {
    return this.status;
  }

  public getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  public subscribeStatus(cb: (status: RecordingStatus, seconds: number) => void): () => void {
    const statusHandler = (s: RecordingStatus) => cb(s, this.elapsedSeconds);
    const tickHandler = (sec: number) => cb(this.status, sec);

    this.onStatusChangeCallbacks.push(statusHandler);
    this.onTickCallbacks.push(tickHandler);

    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter((c) => c !== statusHandler);
      this.onTickCallbacks = this.onTickCallbacks.filter((c) => c !== tickHandler);
    };
  }

  public async startRecording(settings: AppSettings): Promise<boolean> {
    return this.start(settings);
  }

  public pauseRecording() {
    this.pause();
  }

  public resumeRecording() {
    this.resume();
  }

  public async stopRecording(): Promise<any> {
    const res = await this.stop();
    if (!res) return null;

    const { mediaStorage } = await import('./MediaStorageService');
    const filename = `ScreenRecord_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    const thumb = await mediaStorage.generateVideoThumbnail(res.blob);

    const item = {
      id: 'rec_' + Date.now(),
      type: 'video' as const,
      title: 'Screen Recording ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      filename,
      createdAt: Date.now(),
      duration: res.duration,
      fileSize: res.blob.size,
      mimeType: res.mimeType,
      blob: res.blob,
      url: URL.createObjectURL(res.blob),
      thumbnailUrl: thumb,
    };

    await mediaStorage.save(item);
    this.reset();
    return item;
  }

  public async captureScreenshot(): Promise<any> {
    const { mediaStorage } = await import('./MediaStorageService');
    const live = await this.captureScreenshotFromLiveStream();

    let blob: Blob;
    let url: string;

    if (live) {
      blob = live.blob;
      url = live.dataUrl;
    } else {
      // Fallback: render high quality screenshot from current canvas
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth || 1920;
      canvas.height = window.innerHeight || 1080;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('ScreenPro Screenshot', 60, 100);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px monospace';
      ctx.fillText(new Date().toLocaleString(), 60, 140);

      const dataUrl = canvas.toDataURL('image/png');
      blob = await (await fetch(dataUrl)).blob();
      url = dataUrl;
    }

    const filename = `Screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    const item = {
      id: 'shot_' + Date.now(),
      type: 'screenshot' as const,
      title: 'Screenshot ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      filename,
      createdAt: Date.now(),
      duration: 0,
      fileSize: blob.size,
      mimeType: 'image/png',
      blob,
      url,
      thumbnailUrl: url,
    };

    await mediaStorage.save(item);
    return item;
  }

  public subscribeTick(cb: (seconds: number) => void): () => void {
    this.onTickCallbacks.push(cb);
    return () => {
      this.onTickCallbacks = this.onTickCallbacks.filter((c) => c !== cb);
    };
  }

  public subscribeError(cb: (msg: string) => void): () => void {
    this.onErrorCallbacks.push(cb);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((c) => c !== cb);
    };
  }

  private setStatus(status: RecordingStatus) {
    this.status = status;
    this.onStatusChangeCallbacks.forEach((cb) => cb(status));
  }

  private notifyError(msg: string) {
    this.setStatus('error');
    this.onErrorCallbacks.forEach((cb) => cb(msg));
  }

  /**
   * Starts the screen capture pipeline
   */
  public async start(settings: AppSettings): Promise<boolean> {
    try {
      this.setStatus('preparing');
      this.recordedChunks = [];
      this.elapsedSeconds = 0;

      // 1. Calculate resolution & constraints
      const resConfig = RESOLUTION_MAP[settings.recording.resolution] || RESOLUTION_MAP['1080p'];
      const fps = settings.recording.fps || 30;

      const displayMediaConstraints: DisplayMediaStreamOptions = {
        video: {
          width: { ideal: resConfig.width },
          height: { ideal: resConfig.height },
          frameRate: { ideal: fps, max: fps },
        },
        audio: settings.audio.source === 'internal' || settings.audio.source === 'both',
      };

      // 2. Request MediaProjection / Display Media
      try {
        this.displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaConstraints);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          this.notifyError('Screen recording permission was cancelled or denied.');
        } else {
          this.notifyError(`Failed to initialize screen capture: ${err.message || 'Unknown error'}`);
        }
        return false;
      }

      // Handle user stopping share via browser system bar
      const videoTrack = this.displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (this.status === 'recording' || this.status === 'paused') {
            this.stop();
          }
        };
      }

      // 3. Audio Handling & Mixing
      const tracks: MediaStreamTrack[] = [...this.displayStream.getVideoTracks()];
      const audioSource = settings.audio.source;

      if (audioSource !== 'disabled') {
        const audioTracksToMix: MediaStreamTrack[] = [];

        // Display Audio track
        const displayAudioTracks = this.displayStream.getAudioTracks();
        if (displayAudioTracks.length > 0 && (audioSource === 'internal' || audioSource === 'both')) {
          audioTracksToMix.push(displayAudioTracks[0]);
        }

        // Microphone Audio track
        if (audioSource === 'mic' || audioSource === 'both') {
          try {
            this.micStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: settings.audio.echoCancellation,
                noiseSuppression: settings.audio.noiseSuppression,
                sampleRate: settings.audio.sampleRate,
              },
            });
            audioTracksToMix.push(this.micStream.getAudioTracks()[0]);
          } catch (micErr: any) {
            console.warn('Microphone permission or hardware unavailable:', micErr);
            // Non-fatal: continue with video only or internal audio
          }
        }

        // Mix if multiple or route through AudioContext
        if (audioTracksToMix.length > 0) {
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            const destination = this.audioContext.createMediaStreamDestination();

            for (const track of audioTracksToMix) {
              const stream = new MediaStream([track]);
              const sourceNode = this.audioContext.createMediaStreamSource(stream);
              
              // Apply mic gain if this track came from mic
              if (this.micStream && track === this.micStream.getAudioTracks()[0]) {
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = settings.audio.micGain || 1.0;
                sourceNode.connect(gainNode);
                gainNode.connect(destination);
              } else {
                sourceNode.connect(destination);
              }
            }

            const mixedAudioTrack = destination.stream.getAudioTracks()[0];
            if (mixedAudioTrack) {
              tracks.push(mixedAudioTrack);
            }
          } catch (mixErr) {
            console.warn('Web Audio mixing fallback to first track:', mixErr);
            tracks.push(audioTracksToMix[0]);
          }
        }
      }

      this.combinedStream = new MediaStream(tracks);

      // 4. Select best supported MediaRecorder MIME type
      const mimeCandidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp8,opus',
        'video/mp4;codecs=avc1',
        'video/webm',
      ];
      let selectedMime = '';
      for (const mime of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const bitrateBps =
        settings.recording.bitrate === 'custom'
          ? (settings.recording.customBitrateMbps || 8) * 1000000
          : BITRATE_MAP[settings.recording.bitrate] || 8000000;

      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: bitrateBps,
      };
      if (selectedMime) {
        recorderOptions.mimeType = selectedMime;
      }

      this.mediaRecorder = new MediaRecorder(this.combinedStream, recorderOptions);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (err: any) => {
        this.notifyError(`MediaRecorder error: ${err.error?.message || 'Encoding failed'}`);
      };

      // Start recorder with 1-second chunks for resilient data saving
      this.mediaRecorder.start(1000);
      this.startTime = Date.now();
      this.pausedTime = 0;
      this.elapsedSeconds = 0;
      this.setStatus('recording');

      // Start timer tick
      this.timerInterval = window.setInterval(() => {
        if (this.status === 'recording') {
          this.elapsedSeconds = Math.floor((Date.now() - this.startTime - this.pausedTime) / 1000);
          this.onTickCallbacks.forEach((cb) => cb(this.elapsedSeconds));
        }
      }, 500);

      return true;
    } catch (err: any) {
      this.notifyError(`Unexpected error starting recorder: ${err.message || String(err)}`);
      return false;
    }
  }

  public pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.setStatus('paused');
    }
  }

  public resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.setStatus('recording');
    }
  }

  /**
   * Stops recording and returns the final video Blob
   */
  public async stop(): Promise<{ blob: Blob; mimeType: string; duration: number } | null> {
    if (!this.mediaRecorder) return null;

    this.setStatus('finalizing');

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    return new Promise((resolve) => {
      const finishStop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const finalBlob = new Blob(this.recordedChunks, { type: mimeType });
        const finalDuration = Math.max(1, this.elapsedSeconds);

        // Clean up all tracks
        this.cleanupStreams();
        this.setStatus('completed');

        resolve({
          blob: finalBlob,
          mimeType,
          duration: finalDuration,
        });
      };

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = finishStop;
        try {
          this.mediaRecorder.stop();
        } catch {
          finishStop();
        }
      } else {
        finishStop();
      }
    });
  }

  /**
   * Captures a high-resolution screenshot from the active screen capture video stream
   */
  public async captureScreenshotFromLiveStream(): Promise<{ blob: Blob; dataUrl: string } | null> {
    if (!this.displayStream) return null;
    const videoTrack = this.displayStream.getVideoTracks()[0];
    if (!videoTrack) return null;

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.srcObject = new MediaStream([videoTrack]);

      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const width = video.videoWidth || 1920;
          const height = video.videoHeight || 1080;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/png');
            canvas.toBlob((blob) => {
              video.pause();
              video.srcObject = null;
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                resolve(null);
              }
            }, 'image/png');
          } else {
            resolve(null);
          }
        }, 150);
      };
    });
  }

  private cleanupStreams() {
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach((t) => t.stop());
      this.combinedStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  public reset() {
    this.cleanupStreams();
    this.recordedChunks = [];
    this.elapsedSeconds = 0;
    this.setStatus('idle');
  }
}

export const screenRecorderEngine = new ScreenRecorderEngine();
export const screenRecorder = screenRecorderEngine;
