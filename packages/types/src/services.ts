import type * as Effect from 'effect/Effect';
import * as Context from 'effect/Context';

import type { TempehConfig } from './config';
import type { StateError, ValidationError, WrappedCDKError } from './error';

// ============================================================================
// Service Interfaces
// ============================================================================

export interface Logger {
  readonly _: unique symbol;
  readonly info: (message: string, ...args: ReadonlyArray<unknown>) => Effect.Effect<never, never, void>;
  readonly warn: (message: string, ...args: ReadonlyArray<unknown>) => Effect.Effect<never, never, void>;
  readonly error: (message: string, ...args: ReadonlyArray<unknown>) => Effect.Effect<never, never, void>;
  readonly debug: (message: string, ...args: ReadonlyArray<unknown>) => Effect.Effect<never, never, void>;
}

export const Logger = Context.Tag('@tempeh/Logger');

export interface FileSystem {
  readonly _: unique symbol;
  readonly readFile: (path: string) => Effect.Effect<never, StateError, string>;
  readonly writeFile: (path: string, content: string) => Effect.Effect<never, StateError, void>;
  readonly exists: (path: string) => Effect.Effect<never, never, boolean>;
  readonly mkdir: (path: string, options?: { recursive?: boolean }) => Effect.Effect<never, StateError, void>;
}

export const FileSystem = Context.Tag('@tempeh/FileSystem');

export interface Process {
  readonly _: unique symbol;
  readonly exec: (command: string, options?: { cwd?: string; env?: Record<string, string> }) => Effect.Effect<never, WrappedCDKError, string>;
  readonly spawn: (command: string, args: ReadonlyArray<string>, options?: { cwd?: string; env?: Record<string, string> }) => Effect.Effect<never, WrappedCDKError, string>;
}

export const Process = Context.Tag('@tempeh/Process');

export interface Config {
  readonly _: unique symbol;
  readonly load: (path?: string) => Effect.Effect<never, ValidationError, TempehConfig>;
  readonly save: (config: TempehConfig, path?: string) => Effect.Effect<never, StateError, void>;
}

export const Config = Context.Tag('@tempeh/Config');
