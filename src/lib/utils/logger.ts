/**
 * Centralized logging utility
 * Enable/disable logs based on environment or debug mode
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true',
      level: 'info',
      ...config
    };
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }
  
  private formatMessage(message: string): string {
    if (this.config.prefix) {
      return `[${this.config.prefix}] ${message}`;
    }
    return message;
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(message), ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage(message), ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(message), ...args);
    }
  }
  
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message), ...args);
    }
  }
  
  // Create a child logger with a specific prefix
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix
    });
  }
}

// Export a default logger instance
export const logger = new Logger();

// Export logger for specific features
export const createLogger = (prefix: string, enabled = false) => {
  return new Logger({ prefix, enabled });
};

// Feature-specific loggers (disabled by default)
export const notificationLogger = createLogger('Notifications', false);
export const uploadLogger = createLogger('Upload', false);
export const workspaceLogger = createLogger('Workspace', false);
export const linksLogger = createLogger('Links', false);

// =============================================================================
// SECURITY LOGGING
// =============================================================================
// Security-specific logging functions for audit trails and monitoring

export interface SecurityEventContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  [key: string]: unknown;
}

export interface RateLimitContext extends SecurityEventContext {
  limit: number;
  window: number;
  attempts: number;
}

export interface AuthFailureContext extends SecurityEventContext {
  reason: string;
  attemptCount?: number;
}

/**
 * Security logger - always enabled in production for audit trails
 */
export const securityLogger = new Logger({
  prefix: 'SECURITY',
  enabled: true, // Always enabled for security events
  level: 'info'
});

/**
 * Logs a general security event
 * @param message - Description of the security event
 * @param context - Additional context about the event
 */
export function logSecurityEvent(message: string, context: SecurityEventContext = {}): void {
  const timestamp = new Date().toISOString();
  securityLogger.info(`[${timestamp}] ${message}`, {
    timestamp,
    ...context
  });
}

/**
 * Logs an authentication failure
 * @param message - Description of the auth failure
 * @param context - Authentication failure context
 */
export function logAuthFailure(message: string, context: AuthFailureContext): void {
  const timestamp = new Date().toISOString();
  securityLogger.warn(`[${timestamp}] AUTH FAILURE: ${message}`, {
    timestamp,
    severity: 'auth_failure',
    ...context
  });
}

/**
 * Logs a rate limit violation
 * @param message - Description of the rate limit violation
 * @param context - Rate limit context including limits and attempts
 */
export function logRateLimitViolation(message: string, context: RateLimitContext): void {
  const timestamp = new Date().toISOString();
  securityLogger.warn(`[${timestamp}] RATE LIMIT: ${message}`, {
    timestamp,
    severity: 'rate_limit',
    ...context
  });
}

/**
 * Logs a critical security incident that requires immediate attention
 * @param message - Description of the security incident
 * @param context - Incident context
 */
export function logSecurityIncident(message: string, context: SecurityEventContext = {}): void {
  const timestamp = new Date().toISOString();
  securityLogger.error(`[${timestamp}] SECURITY INCIDENT: ${message}`, {
    timestamp,
    severity: 'critical',
    ...context
  });
}