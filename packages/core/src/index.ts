import * as Effect from 'effect/Effect';
import type { TempehError } from '@tempeh/types';
import { createTempehError, fileSystem } from '@tempeh/utils';

// ============================================================================
// Tempeh Engine Implementation
// ============================================================================

export class TempehEngine {

  constructor(private workingDir: string) {}

  // ============================================================================
  // Properties
  // ============================================================================

  // get workingDir(): string {
  //   return this._workingDir;
  // }

  // ============================================================================
  // Engine Operations
  // ============================================================================

  initialize(): Effect.Effect<void, TempehError> {
    const program = Effect.gen(this, function* () {
      const defaultProjectFileExists = yield* fileSystem.exists(`${this.workingDir}/cdktf.json`);
      if (!defaultProjectFileExists) {
        // todo: support scan
        return Effect.fail(createTempehError('Only default project files are currently supported', 'INVALID_PROJECT_FILE'));
      }
      return;
    })
    return program;
  }

  getStatus(): Effect.Effect<{ status: string; message: string }, TempehError> {
    return Effect.succeed({ status: 'ready', message: 'TempehEngine is ready' });
  }

  deploy(_options: Record<string, unknown>): Effect.Effect<{ success: boolean; outputs: Record<string, unknown>; resources: unknown[] }, TempehError> {
    return Effect.succeed({ success: true, outputs: {}, resources: [] });
  }

  destroy(_options: Record<string, unknown>): Effect.Effect<Record<string, unknown>, TempehError> {
    return Effect.succeed({ success: true });
  }

  plan(_options: Record<string, unknown>): Effect.Effect<{ success: boolean; summary: string; changes: { add: unknown[]; change: unknown[]; destroy: unknown[] } }, TempehError> {
    return Effect.succeed({ 
      success: true, 
      summary: 'No changes',
      changes: { add: [], change: [], destroy: [] }
    });
  }

  diff(_options: Record<string, unknown>): Effect.Effect<{ success: boolean; summary: string; changes: { add: unknown[]; change: unknown[]; destroy: unknown[] } }, TempehError> {
    return Effect.succeed({ 
      success: true, 
      summary: 'No differences',
      changes: { add: [], change: [], destroy: [] }
    });
  }

  synth(_options: Record<string, unknown>): Effect.Effect<void, TempehError> {
    return Effect.succeed(undefined);
  }

  validate(_options: Record<string, unknown>): Effect.Effect<{ isValid: boolean; errors: unknown[]; warnings: unknown[] }, TempehError> {
    return Effect.succeed({ isValid: true, errors: [], warnings: [] });
  }

  list(): Effect.Effect<{ stacks: unknown[] }, TempehError> {
    return Effect.succeed({ stacks: [] });
  }
}

