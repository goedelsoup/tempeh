import * as Effect from 'effect/Effect';
import { spawn, exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { WrappedCDKError } from '@tempeh/types';

const exec = promisify(execCallback);

// ============================================================================
// Process Implementation
// ============================================================================

export class Process {
  exec(command: string, options?: { cwd?: string; env?: Record<string, string> }) {
    return Effect.tryPromise({
      try: () => exec(command, options),
      catch: (error) => new WrappedCDKError({
        command,
        message: `Failed to execute command: ${command}`,
        output: error instanceof Error ? error.message : String(error),
      }),
    }).pipe(Effect.map(result => result.stdout));
  }

  spawn(command: string, args: ReadonlyArray<string>, options?: { cwd?: string; env?: Record<string, string> }) {
    return Effect.tryPromise({
      try: () => new Promise<string>((resolve, reject) => {
        const child = spawn(command, args, options);
        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(stderr || `Process exited with code ${code}`));
          }
        });

        child.on('error', (error) => {
          reject(error);
        });
      }),
      catch: (error) => new WrappedCDKError({
        command: `${command} ${args.join(' ')}`,
        message: `Failed to spawn process: ${command}`,
        output: error instanceof Error ? error.message : String(error),
      }),
    });
  }
}

// ============================================================================
// Process Factory
// ============================================================================

export const makeProcess = (): Process => {
  return new Process();
};

// ============================================================================
// Global Process Instance
// ============================================================================

export const process = makeProcess();

// ============================================================================
// Process Effects
// ============================================================================

export const execCommand = (command: string, options?: { cwd?: string; env?: Record<string, string> }) => {
  return process.exec(command, options);
};

export const spawnCommand = (command: string, args: ReadonlyArray<string>, options?: { cwd?: string; env?: Record<string, string> }) => {
  return process.spawn(command, args, options);
};

// ============================================================================
// Utility Functions
// ============================================================================

export const execCdktf = (args: ReadonlyArray<string>, options?: { cwd?: string; env?: Record<string, string> }) => {
  return execCommand(`cdktf ${args.join(' ')}`, options);
};

export const getCdktfVersion = () => {
  return execCdktf(['--version']);
};

export const checkCdktfInstalled = () => {
  return Effect.gen(function* (_) {
    try {
      yield* _(getCdktfVersion());
      return true;
    } catch {
      return false;
    }
  });
};
