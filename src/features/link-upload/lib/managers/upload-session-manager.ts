'use client';

/**
 * Upload Session Manager
 * Manages uploader sessions for public link uploads
 * Stores session data in localStorage with expiration
 */

export interface UploadSession {
  linkId: string;
  uploaderName: string;
  uploaderEmail?: string | undefined;
  authenticated: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const SESSION_DURATION_HOURS = 24; // Session expires after 24 hours
const SESSION_KEY_PREFIX = 'upload-session-';

export class UploadSessionManager {
  /**
   * Create a new upload session
   */
  static createSession(
    linkId: string,
    uploaderName: string,
    uploaderEmail?: string
  ): UploadSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    const session: UploadSession = {
      linkId,
      uploaderName,
      uploaderEmail,
      authenticated: true,
      createdAt: now,
      expiresAt,
    };

    this.saveSession(linkId, session);
    return session;
  }

  /**
   * Get an existing session for a link
   */
  static getSession(linkId: string): UploadSession | null {
    if (typeof window === 'undefined') return null;

    const key = `${SESSION_KEY_PREFIX}${linkId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
      const session = JSON.parse(stored) as UploadSession;
      
      // Check if session has expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearSession(linkId);
        return null;
      }

      // Restore dates as Date objects
      session.createdAt = new Date(session.createdAt);
      session.expiresAt = new Date(session.expiresAt);

      return session;
    } catch (error) {
      console.error('Failed to parse upload session', error);
      this.clearSession(linkId);
      return null;
    }
  }

  /**
   * Save a session to localStorage
   */
  private static saveSession(linkId: string, session: UploadSession): void {
    if (typeof window === 'undefined') return;

    const key = `${SESSION_KEY_PREFIX}${linkId}`;
    localStorage.setItem(key, JSON.stringify(session));
  }

  /**
   * Clear a session
   */
  static clearSession(linkId: string): void {
    if (typeof window === 'undefined') return;

    const key = `${SESSION_KEY_PREFIX}${linkId}`;
    localStorage.removeItem(key);
  }

  /**
   * Clear all expired sessions
   */
  static clearExpiredSessions(): void {
    if (typeof window === 'undefined') return;

    const now = new Date();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(SESSION_KEY_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const session = JSON.parse(stored) as UploadSession;
            if (new Date(session.expiresAt) < now) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // If we can't parse it, remove it
            localStorage.removeItem(key);
          }
        }
      }
    });
  }

  /**
   * Check if a session exists and is valid
   */
  static hasValidSession(linkId: string): boolean {
    const session = this.getSession(linkId);
    return session !== null && session.authenticated;
  }

  /**
   * Update session with additional data
   */
  static updateSession(
    linkId: string,
    updates: Partial<Pick<UploadSession, 'uploaderEmail'>>
  ): UploadSession | null {
    const session = this.getSession(linkId);
    if (!session) return null;

    const updatedSession = {
      ...session,
      ...updates,
    };

    this.saveSession(linkId, updatedSession);
    return updatedSession;
  }
}

// Clean up expired sessions on initialization
if (typeof window !== 'undefined') {
  UploadSessionManager.clearExpiredSessions();
}