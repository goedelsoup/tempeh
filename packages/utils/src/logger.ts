import { Effect, Console } from 'effect';

// ============================================================================
// Log Level
// ============================================================================

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export const LogLevel = {
  ERROR: 'ERROR' as const,
  WARN: 'WARN' as const,
  INFO: 'INFO' as const,
  DEBUG: 'DEBUG' as const,
} as const;

// ============================================================================
// Logger Configuration
// ============================================================================

export interface LoggerConfig {
  level?: LogLevel;
  prefix?: string;
  colors?: boolean;
}

export const defaultLoggerConfig: LoggerConfig = {
  level: LogLevel.INFO,
  prefix: 'tempeh',
  colors: true,
};

// ============================================================================
// Logger Implementation
// ============================================================================

export class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig = defaultLoggerConfig) {
    this.config = config;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.config.prefix}] [${level}]`;
    
    if (this.config.colors) {
      return `${this.colorize(prefix, this.getColorForLevel(level))} ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return 'red';
      case LogLevel.WARN:
        return 'yellow';
      case LogLevel.INFO:
        return 'blue';
      case LogLevel.DEBUG:
        return 'gray';
      default:
        return 'white';
    }
  }

  private colorize(text: string, color: string): string {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
      white: '\x1b[37m',
      reset: '\x1b[0m'
    };
    
    return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.config.level || LogLevel.INFO);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  info(message: string, ...args: ReadonlyArray<unknown>) {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage(LogLevel.INFO, message);
      return Console.log(formattedMessage, ...args);
    }
    return Effect.void;
  }

  warn(message: string, ...args: ReadonlyArray<unknown>) {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage(LogLevel.WARN, message);
      return Console.log(formattedMessage, ...args);
    }
    return Effect.void;
  }

  error(message: string, ...args: ReadonlyArray<unknown>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage(LogLevel.ERROR, message);
      return Console.error(formattedMessage, ...args);
    }
    return Effect.void;
  }

  debug(message: string, ...args: ReadonlyArray<unknown>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, message);
      return Console.log(formattedMessage, ...args);
    }
    return Effect.void;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// ============================================================================
// Logger Factory
// ============================================================================

export const makeLogger = (config: LoggerConfig = defaultLoggerConfig): Logger => {
  return new Logger(config);
};

// ============================================================================
// Global Logger Instance
// ============================================================================

export const logger = makeLogger();

// ============================================================================
// Logger Effects
// ============================================================================

export const info = (message: string, ...args: ReadonlyArray<unknown>) => {
  return logger.info(message, ...args);
};

export const warn = (message: string, ...args: ReadonlyArray<unknown>) => {
  return logger.warn(message, ...args);
};

export const error = (message: string, ...args: ReadonlyArray<unknown>) => {
  return logger.error(message, ...args);
};

export const debug = (message: string, ...args: ReadonlyArray<unknown>) => {
  return logger.debug(message, ...args);
};
