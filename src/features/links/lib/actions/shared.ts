'use server';

import { currentUser } from '@clerk/nextjs/server';

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

/**
 * Get current authenticated user or throw error
 */
export async function requireAuth() {
  const user = await currentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Audit log entry for link operations
 */
export interface AuditEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * Log audit entry (simplified for MVP)
 */
export async function logAudit(entry: AuditEntry) {
  // For MVP, we'll use console.log
  // In production, this would go to a dedicated audit log service
  console.log(
    `[AUDIT] ${entry.timestamp.toISOString()}: User ${entry.userId} ${entry.action} ${entry.resource} ${entry.resourceId}`,
    entry.details
  );
}
