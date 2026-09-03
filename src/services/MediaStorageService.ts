import { MediaItem } from '../types';
import { createSyntheticDemoVideoBlob, generateFilename } from '../utils/constants';

const DB_NAME = 'screenpro_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';

class MediaStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async getAll(): Promise<MediaItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: MediaItem[] = request.result || [];
        // Sort newest first
        items.sort((a, b) => b.createdAt - a.createdAt);
        // Ensure URLs are valid object URLs if blob is present
        const populated = items.map((item) => {
          if (item.blob && (!item.url || item.url.startsWith('blob:null'))) {
            item.url = URL.createObjectURL(item.blob);
          }
          return item;
        });
        resolve(populated);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async save(item: MediaItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMultiple(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  async rename(id: string, newTitle: string, newFilename?: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item: MediaItem = getReq.result;
        if (item) {
          item.title = newTitle;
          if (newFilename) {
            item.filename = newFilename;
          }
          store.put(item);
          resolve();
        } else {
          reject(new Error('Item not found'));
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Generates a fast video thumbnail image (DataURL) from the first keyframe
   */
  async generateVideoThumbnail(videoBlob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.autoplay = false;
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(videoBlob);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(0.5, video.duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 360;
          canvas.height = Math.round((video.videoHeight / (video.videoWidth || 1)) * 360) || 640;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
            return;
          }
        } catch {
          // fallback
        }
        URL.revokeObjectURL(url);
        resolve('');
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
    });
  }

  /**
   * Seed demo data if database is empty on first boot
   */
  async seedIfEmpty(): Promise<MediaItem[]> {
    const existing = await this.getAll();
    if (existing.length > 0) return existing;

    try {
      const blob = await createSyntheticDemoVideoBlob();
      const thumb = await this.generateVideoThumbnail(blob);
      const demoItem: MediaItem = {
        id: 'demo-sample-1',
        type: 'video',
        title: 'Android Gameplay & UI Walkthrough',
        filename: generateFilename('ScreenRecord_', 'mp4'),
        createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
        duration: 3.0,
        fileSize: blob.size || 1024 * 1024 * 1.8,
        mimeType: 'video/mp4',
        blob,
        url: URL.createObjectURL(blob),
        thumbnailUrl: thumb,
        width: 1080,
        height: 1920,
        fps: 60,
        bitrate: '8 Mbps',
      };

      await this.save(demoItem);
      return [demoItem];
    } catch {
      return [];
    }
  }
}

export const mediaStorage = new MediaStorageService();
