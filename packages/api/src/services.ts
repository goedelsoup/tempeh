// ============================================================================
// Service Interfaces
// ============================================================================

import type * as Effect from 'effect/Effect';
import type { ValidationResult } from './engine';

// ============================================================================
// Base Service Interface
// ============================================================================

export interface BaseService {
  readonly name: string;
  readonly version: string;
  
  /**
   * Initialize the service
   */
  initialize(): Effect.Effect<void, Error>;
  
  /**
   * Start the service
   */
  start(): Effect.Effect<void, Error>;
  
  /**
   * Stop the service
   */
  stop(): Effect.Effect<void, Error>;
  
  /**
   * Get service status
   */
  getStatus(): Effect.Effect<ServiceStatus, Error>;
  
  /**
   * Validate service configuration
   */
  validate(): Effect.Effect<ValidationResult, Error>;
  
  /**
   * Get service health information
   */
  getHealth(): Effect.Effect<ServiceHealth, Error>;
}

// ============================================================================
// Configuration Service Interface
// ============================================================================

export interface ConfigurationService extends BaseService {
  /**
   * Load configuration from file
   */
  loadConfig<T = unknown>(path: string): Effect.Effect<T, Error>;
  
  /**
   * Save configuration to file
   */
  saveConfig<T = unknown>(path: string, config: T): Effect.Effect<void, Error>;
  
  /**
   * Validate configuration
   */
  validateConfig<T = unknown>(config: T): Effect.Effect<ValidationResult, Error>;
  
  /**
   * Get configuration schema
   */
  getConfigSchema(): Effect.Effect<unknown, Error>;
  
  /**
   * Watch for configuration changes
   */
  watchConfig(path: string, callback: (config: unknown) => void): Effect.Effect<void, Error>;
}

// ============================================================================
// Logger Service Interface
// ============================================================================

export interface LogLevel {
  readonly level: 'debug' | 'info' | 'warn' | 'error';
  readonly value: number;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface LoggerService extends BaseService {
  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void;
  
  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void;
  
  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void;
  
  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  
  /**
   * Set log level
   */
  setLevel(level: LogLevel): void;
  
  /**
   * Get log entries
   */
  getLogs(level?: LogLevel, limit?: number): Promise<LogEntry[]>;
  
  /**
   * Clear logs
   */
  clearLogs(): Promise<void>;
  
  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'text'): Promise<string>;
}

// ============================================================================
// File System Service Interface
// ============================================================================

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
  modified: Date;
  permissions: string;
}

export interface FileSystemService extends BaseService {
  /**
   * Read file contents
   */
  readFile(path: string, encoding?: string): Effect.Effect<string, Error>;
  
  /**
   * Read file as buffer
   */
  readFileBuffer(path: string): Effect.Effect<Buffer, Error>;
  
  /**
   * Write file contents
   */
  writeFile(path: string, content: string | Buffer): Effect.Effect<void, Error>;
  
  /**
   * Check if file exists
   */
  exists(path: string): Effect.Effect<boolean, Error>;
  
  /**
   * Get file information
   */
  getFileInfo(path: string): Effect.Effect<FileInfo, Error>;
  
  /**
   * List directory contents
   */
  listDirectory(path: string): Effect.Effect<FileInfo[], Error>;
  
  /**
   * Create directory
   */
  createDirectory(path: string, recursive?: boolean): Effect.Effect<void, Error>;
  
  /**
   * Delete file or directory
   */
  delete(path: string, recursive?: boolean): Effect.Effect<void, Error>;
  
  /**
   * Copy file or directory
   */
  copy(source: string, destination: string): Effect.Effect<void, Error>;
  
  /**
   * Move file or directory
   */
  move(source: string, destination: string): Effect.Effect<void, Error>;
  
  /**
   * Watch for file changes
   */
  watch(path: string, callback: (event: string, filename: string) => void): Effect.Effect<void, Error>;
}

// ============================================================================
// Process Service Interface
// ============================================================================

export interface ProcessOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  stdio?: 'pipe' | 'inherit' | 'ignore';
}

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface ProcessService extends BaseService {
  /**
   * Execute a command
   */
  execute(command: string, args?: string[], options?: ProcessOptions): Effect.Effect<ProcessResult, Error>;
  
  /**
   * Execute a command and stream output
   */
  executeStream(command: string, args?: string[], options?: ProcessOptions): Effect.Effect<{
    stdout: NodeJS.ReadableStream;
    stderr: NodeJS.ReadableStream;
    promise: Promise<ProcessResult>;
  }, Error>;
  
  /**
   * Check if command exists
   */
  commandExists(command: string): Effect.Effect<boolean, Error>;
  
  /**
   * Get process information
   */
  getProcessInfo(pid: number): Effect.Effect<{
    pid: number;
    command: string;
    args: string[];
    cwd: string;
    memory: number;
    cpu: number;
  }, Error>;
  
  /**
   * Kill a process
   */
  killProcess(pid: number, signal?: string): Effect.Effect<void, Error>;
}

// ============================================================================
// Network Service Interface
// ============================================================================

export interface NetworkRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | Buffer;
  timeout?: number;
}

export interface NetworkResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string | Buffer;
  duration: number;
}

export interface NetworkService extends BaseService {
  /**
   * Make an HTTP request
   */
  request(request: NetworkRequest): Effect.Effect<NetworkResponse, Error>;
  
  /**
   * Make a GET request
   */
  get(url: string, headers?: Record<string, string>): Effect.Effect<NetworkResponse, Error>;
  
  /**
   * Make a POST request
   */
  post(url: string, body?: string | Buffer, headers?: Record<string, string>): Effect.Effect<NetworkResponse, Error>;
  
  /**
   * Download a file
   */
  download(url: string, destination: string): Effect.Effect<void, Error>;
  
  /**
   * Upload a file
   */
  upload(url: string, filePath: string, headers?: Record<string, string>): Effect.Effect<NetworkResponse, Error>;
  
  /**
   * Check if URL is accessible
   */
  isAccessible(url: string, timeout?: number): Effect.Effect<boolean, Error>;
}

// ============================================================================
// Cache Service Interface
// ============================================================================

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

export interface CacheService extends BaseService {
  /**
   * Get a value from cache
   */
  get<T = unknown>(key: string): Effect.Effect<T | null, Error>;
  
  /**
   * Set a value in cache
   */
  set<T = unknown>(key: string, value: T, options?: CacheOptions): Effect.Effect<void, Error>;
  
  /**
   * Delete a value from cache
   */
  delete(key: string): Effect.Effect<void, Error>;
  
  /**
   * Clear all cache entries
   */
  clear(): Effect.Effect<void, Error>;
  
  /**
   * Get cache statistics
   */
  getStats(): Effect.Effect<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }, Error>;
  
  /**
   * Check if key exists in cache
   */
  has(key: string): Effect.Effect<boolean, Error>;
  
  /**
   * Get all cache keys
   */
  keys(): Effect.Effect<string[], Error>;
}

// ============================================================================
// Event Service Interface
// ============================================================================

export type EventHandler<T = unknown> = (event: string, data: T) => void | Promise<void>;

export interface EventService extends BaseService {
  /**
   * Emit an event
   */
  emit<T = unknown>(event: string, data: T): Effect.Effect<void, Error>;
  
  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): void;
  
  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void;
  
  /**
   * Subscribe to an event once
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): void;
  
  /**
   * Get all event listeners
   */
  getListeners(event: string): EventHandler[];
  
  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event: string): void;
}

// ============================================================================
// Common Types
// ============================================================================

export interface ServiceStatus {
  status: 'running' | 'stopped' | 'error' | 'unknown';
  uptime: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ServiceHealth {
  healthy: boolean;
  checks: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    message: string;
    duration: number;
  }>;
  timestamp: Date;
}

export interface ServiceError {
  code: string;
  message: string;
  service: string;
  details?: Record<string, unknown>;
  cause?: Error;
}

// ============================================================================
// Service Factory Interface
// ============================================================================

export interface ServiceFactory {
  createConfigurationService(): ConfigurationService;
  createLoggerService(): LoggerService;
  createFileSystemService(): FileSystemService;
  createProcessService(): ProcessService;
  createNetworkService(): NetworkService;
  createCacheService(): CacheService;
  createEventService(): EventService;
}
