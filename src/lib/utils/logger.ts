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