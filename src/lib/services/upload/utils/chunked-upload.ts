/**
 * Chunked Upload Support
 * Handles large file uploads by splitting them into manageable chunks
 * Only enabled in production environment with paid Supabase tier
 */

import { UPLOAD_CONFIG } from '@/lib/config/upload-config';
import type { UploadHandle, UploadOptions } from '../types';
import { logger } from '@/lib/services/logging/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
  blob: Blob;
  uploadId: string;
  retries: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface ChunkedUploadSession {
  sessionId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  chunkSize: number;
  chunks: ChunkInfo[];
  completedChunks: Set<number>;
  uploadedBytes: number;
  startTime: number;
  lastActivity: number;
}

export interface ChunkUploadResult {
  success: boolean;
  chunkIndex: number;
  etag?: string;
  error?: string;
}

// =============================================================================
// CHUNKED UPLOAD MANAGER
// =============================================================================

export class ChunkedUploadManager {
  private sessions: Map<string, ChunkedUploadSession> = new Map();
  private activeUploads: Map<string, AbortController> = new Map();
  
  /**
   * Check if chunked upload should be used for a file
   */
  shouldUseChunkedUpload(fileSize: number): boolean {
    return UPLOAD_CONFIG.features.chunkedUploads && 
           fileSize > UPLOAD_CONFIG.limits.chunkThreshold;
  }
  
  /**
   * Create a new chunked upload session
   */
  createSession(
    handle: UploadHandle,
    options: UploadOptions
  ): ChunkedUploadSession {
    const chunkSize = UPLOAD_CONFIG.limits.chunkSize;
    const totalChunks = Math.ceil(handle.file.size / chunkSize);
    const chunks: ChunkInfo[] = [];
    
    // Create chunk info for each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, handle.file.size);
      const blob = handle.file.slice(start, end);
      
      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        blob,
        uploadId: handle.id,
        retries: 0,
        status: 'pending',
      });
    }
    
    const session: ChunkedUploadSession = {
      sessionId: this.generateSessionId(),
      fileId: handle.id,
      fileName: handle.file.name,
      fileSize: handle.file.size,
      totalChunks,
      chunkSize,
      chunks,
      completedChunks: new Set(),
      uploadedBytes: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
    };
    
    this.sessions.set(session.sessionId, session);
    
    // Store session info for resumability
    if (UPLOAD_CONFIG.resume.enabled && UPLOAD_CONFIG.resume.useLocalStorage) {
      this.saveSessionToStorage(session);
    }
    
    logger.info('Created chunked upload session', {
      sessionId: session.sessionId,
      fileName: handle.file.name,
      fileSize: handle.file.size,
      totalChunks,
      chunkSize,
    });
    
    return session;
  }
  
  /**
   * Upload a single chunk
   */
  async uploadChunk(
    chunk: ChunkInfo,
    session: ChunkedUploadSession,
    uploadUrl: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<ChunkUploadResult> {
    const controller = new AbortController();
    this.activeUploads.set(`${session.sessionId}-${chunk.index}`, controller);
    
    try {
      chunk.status = 'uploading';
      session.lastActivity = Date.now();
      
      // Create form data for chunk upload
      const formData = new FormData();
      formData.append('chunk', chunk.blob);
      formData.append('chunkIndex', chunk.index.toString());
      formData.append('totalChunks', session.totalChunks.toString());
      formData.append('sessionId', session.sessionId);
      formData.append('fileName', session.fileName);
      
      // Upload chunk with progress tracking
      const response = await this.uploadWithProgress(
        uploadUrl,
        formData,
        controller.signal,
        (loaded) => {
          if (onProgress) {
            const totalLoaded = session.uploadedBytes + loaded;
            onProgress(totalLoaded, session.fileSize);
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        chunk.status = 'completed';
        session.completedChunks.add(chunk.index);
        session.uploadedBytes += chunk.size;
        
        // Update storage if resumability is enabled
        if (UPLOAD_CONFIG.resume.enabled) {
          this.saveSessionToStorage(session);
        }
        
        return {
          success: true,
          chunkIndex: chunk.index,
          etag: result.etag,
        };
      } else {
        throw new Error(`Chunk upload failed: ${response.statusText}`);
      }
    } catch (error) {
      chunk.status = 'failed';
      chunk.retries++;
      
      logger.error('Chunk upload failed', error, {
        sessionId: session.sessionId,
        chunkIndex: chunk.index,
        retries: chunk.retries,
      });
      
      return {
        success: false,
        chunkIndex: chunk.index,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.activeUploads.delete(`${session.sessionId}-${chunk.index}`);
    }
  }
  
  /**
   * Upload file in chunks with parallel uploads
   */
  async uploadInChunks(
    handle: UploadHandle,
    uploadUrl: string,
    options: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.createSession(handle, options);
    const parallelUploads = UPLOAD_CONFIG.concurrency.parallelChunks;
    
    try {
      // Process chunks in parallel batches
      for (let i = 0; i < session.chunks.length; i += parallelUploads) {
        const batch = session.chunks.slice(i, i + parallelUploads);
        
        // Upload batch in parallel
        const results = await Promise.all(
          batch.map(chunk => 
            this.uploadChunk(
              chunk,
              session,
              uploadUrl,
              (loaded, total) => {
                if (onProgress) {
                  const progress = Math.round((loaded / total) * 100);
                  onProgress(progress);
                }
              }
            )
          )
        );
        
        // Check for failures and retry if needed
        for (const result of results) {
          if (!result.success) {
            const chunk = session.chunks[result.chunkIndex];
            if (!chunk) {
              throw new Error(`Chunk ${result.chunkIndex} not found in session`);
            }
            if (chunk.retries < UPLOAD_CONFIG.retry.maxRetries) {
              // Retry failed chunk
              const retryResult = await this.uploadChunk(
                chunk,
                session,
                uploadUrl
              );
              
              if (!retryResult.success) {
                throw new Error(`Failed to upload chunk ${chunk.index} after retries`);
              }
            } else {
              throw new Error(`Chunk ${chunk.index} failed after max retries`);
            }
          }
        }
      }
      
      // Verify all chunks uploaded
      if (session.completedChunks.size === session.totalChunks) {
        // Finalize upload
        await this.finalizeChunkedUpload(session, uploadUrl);
        
        // Clean up session
        this.cleanupSession(session.sessionId);
        
        return { success: true };
      } else {
        throw new Error('Not all chunks were uploaded successfully');
      }
    } catch (error) {
      logger.error('Chunked upload failed', error, {
        sessionId: session.sessionId,
        completedChunks: session.completedChunks.size,
        totalChunks: session.totalChunks,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Chunked upload failed',
      };
    }
  }
  
  /**
   * Resume an interrupted chunked upload
   */
  async resumeUpload(
    sessionId: string,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.loadSessionFromStorage(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Session not found or expired',
      };
    }
    
    // Check session expiry
    const sessionAge = Date.now() - session.startTime;
    if (sessionAge > UPLOAD_CONFIG.resume.sessionDuration) {
      this.cleanupSession(sessionId);
      return {
        success: false,
        error: 'Upload session expired',
      };
    }
    
    // Resume from incomplete chunks
    const incompleteChunks = session.chunks.filter(
      chunk => !session.completedChunks.has(chunk.index)
    );
    
    logger.info('Resuming chunked upload', {
      sessionId,
      completedChunks: session.completedChunks.size,
      remainingChunks: incompleteChunks.length,
    });
    
    // Continue upload with remaining chunks
    for (const chunk of incompleteChunks) {
      const result = await this.uploadChunk(
        chunk,
        session,
        uploadUrl,
        (loaded, total) => {
          if (onProgress) {
            const progress = Math.round((loaded / total) * 100);
            onProgress(progress);
          }
        }
      );
      
      if (!result.success && chunk.retries >= UPLOAD_CONFIG.retry.maxRetries) {
        return {
          success: false,
          error: `Failed to upload chunk ${chunk.index}`,
        };
      }
    }
    
    // Finalize if all chunks completed
    if (session.completedChunks.size === session.totalChunks) {
      await this.finalizeChunkedUpload(session, uploadUrl);
      this.cleanupSession(sessionId);
      return { success: true };
    }
    
    return {
      success: false,
      error: 'Failed to complete all chunks',
    };
  }
  
  /**
   * Finalize chunked upload by combining chunks on server
   */
  private async finalizeChunkedUpload(
    session: ChunkedUploadSession,
    uploadUrl: string
  ): Promise<void> {
    const response = await fetch(`${uploadUrl}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: session.sessionId,
        fileName: session.fileName,
        fileSize: session.fileSize,
        totalChunks: session.totalChunks,
        completedChunks: Array.from(session.completedChunks),
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to finalize chunked upload');
    }
    
    logger.info('Chunked upload finalized', {
      sessionId: session.sessionId,
      fileName: session.fileName,
    });
  }
  
  /**
   * Upload with progress tracking
   */
  private async uploadWithProgress(
    url: string,
    data: FormData,
    signal: AbortSignal,
    onProgress: (loaded: number) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded);
        }
      });
      
      xhr.addEventListener('load', () => {
        resolve(new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
        }));
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });
      
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
      xhr.open('POST', url);
      xhr.send(data);
    });
  }
  
  /**
   * Cancel a chunked upload session
   */
  cancelSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Abort all active uploads for this session
      session.chunks.forEach(chunk => {
        const key = `${sessionId}-${chunk.index}`;
        const controller = this.activeUploads.get(key);
        if (controller) {
          controller.abort();
          this.activeUploads.delete(key);
        }
      });
      
      this.cleanupSession(sessionId);
    }
  }
  
  /**
   * Clean up a session
   */
  private cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.removeSessionFromStorage(sessionId);
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `chunk-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  /**
   * Save session to local storage for resumability
   */
  private saveSessionToStorage(session: ChunkedUploadSession): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `upload-session-${session.sessionId}`;
      const data = {
        ...session,
        completedChunks: Array.from(session.completedChunks),
        chunks: session.chunks.map(chunk => ({
          ...chunk,
          blob: undefined, // Don't store blob in localStorage
        })),
      };
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      logger.warn('Failed to save upload session to storage', { error: String(error) });
    }
  }
  
  /**
   * Load session from local storage
   */
  private loadSessionFromStorage(sessionId: string): ChunkedUploadSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = `upload-session-${sessionId}`;
      const data = localStorage.getItem(key);
      
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          completedChunks: new Set(parsed.completedChunks),
        };
      }
    } catch (error) {
      logger.warn('Failed to load upload session from storage', { error: String(error) });
    }
    
    return null;
  }
  
  /**
   * Remove session from local storage
   */
  private removeSessionFromStorage(sessionId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `upload-session-${sessionId}`;
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn('Failed to remove upload session from storage', { error: String(error) });
    }
  }
  
  /**
   * Get all resumable sessions
   */
  getResumableSessions(): string[] {
    if (typeof window === 'undefined') return [];
    
    const sessions: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('upload-session-')) {
        const sessionId = key.replace('upload-session-', '');
        sessions.push(sessionId);
      }
    }
    
    return sessions;
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE
// =============================================================================

export const chunkedUploadManager = new ChunkedUploadManager();