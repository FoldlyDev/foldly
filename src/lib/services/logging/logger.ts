// =============================================================================
// LOGGING SERVICE
// =============================================================================
// Centralized logging service following 2025 best practices
// Replaces console.log with structured logging for production environments

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogContext {
  userId?: string;
  workspaceId?: string;
  fileId?: string;
  linkId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  timestamp: Date;
  environment: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const context = entry.context ? JSON.stringify(entry.context) : '';
    
    return `[${timestamp}] ${level}: ${entry.message} ${context}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context,
      error,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'production',
    };
  }

  private logToConsole(entry: LogEntry): void {
    // In development, use console methods for better DX
    if (this.isDevelopment) {
      const logData = {
        message: entry.message,
        ...(entry.context && { context: entry.context }),
        ...(entry.error && { error: entry.error.stack || entry.error.message }),
      };

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(entry.message, logData);
          break;
        case LogLevel.INFO:
          console.info(entry.message, logData);
          break;
        case LogLevel.WARN:
          console.warn(entry.message, logData);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(entry.message, logData);
          break;
      }
    } else {
      // In production, use structured logging
      // This could be sent to a logging service like Sentry, LogRocket, etc.
      const formattedLog = this.formatLog(entry);
      
      // For now, we'll use console but in a structured way
      // In production, this should send to a logging service
      if (entry.level >= LogLevel.ERROR) {
        console.error(formattedLog);
      } else {
        console.log(formattedLog);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.logToConsole(entry);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.logToConsole(entry);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.logToConsole(entry);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, errorObj);
    this.logToConsole(entry);
  }

  critical(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return;
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, errorObj);
    this.logToConsole(entry);
    
    // Critical errors might trigger alerts in production
    // TODO: Implement alerting for critical errors
  }

  // Utility method for action logging
  logAction(action: string, result: 'success' | 'failure', context?: LogContext): void {
    const level = result === 'success' ? LogLevel.INFO : LogLevel.ERROR;
    const message = `${action} ${result}`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, { ...context, action });
    } else {
      this.info(message, { ...context, action });
    }
  }

  // Method for security-related logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const levelMap = {
      low: LogLevel.INFO,
      medium: LogLevel.WARN,
      high: LogLevel.ERROR,
      critical: LogLevel.CRITICAL,
    };
    
    const level = levelMap[severity];
    const message = `SECURITY: ${event}`;
    
    if (level >= LogLevel.ERROR) {
      this.error(message, undefined, context);
    } else if (level === LogLevel.WARN) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const { debug, info, warn, error, critical, logAction, logSecurityEvent } = logger;