import * as Effect from 'effect/Effect';
import type { TempehError } from '@tempeh/types';

// ============================================================================
// Effect Wrapper for CLI Commands
// ============================================================================

/**
 * Wraps an Effect and converts it to a Promise with standardized error handling
 * for CLI commands. This simplifies the type system and provides consistent error handling.
 */
export async function runEffect<T>(
  effect: Effect.Effect<T, TempehError>
): Promise<T> {
  try {
    return await Effect.runPromise(effect);
  } catch (error) {
    // Handle TempehError specifically
    if (error && typeof error === 'object' && 'code' in error) {
      const tempehError = error as TempehError;
      throw new Error(`[${tempehError.code}] ${tempehError.message}`);
    }
    
    // Handle other errors
    if (error instanceof Error) {
      throw error;
    }
    
    // Handle unknown errors
    throw new Error(`Unknown error: ${String(error)}`);
  }
}

/**
 * Wraps an Effect that returns void and converts it to a Promise
 */
export async function runEffectVoid(
  effect: Effect.Effect<void, TempehError>
): Promise<void> {
  return runEffect(effect);
}

/**
 * Wraps an Effect that returns a result object and provides type-safe access
 */
export async function runEffectResult<T extends Record<string, unknown>>(
  effect: Effect.Effect<T, TempehError>
): Promise<T> {
  return runEffect(effect);
}

/**
 * Wraps an Effect that returns an array and provides type-safe access
 */
export async function runEffectArray<T>(
  effect: Effect.Effect<T[], TempehError>
): Promise<T[]> {
  return runEffect(effect);
}

/**
 * Wraps an Effect and provides a default value if it fails
 */
export async function runEffectWithDefault<T>(
  effect: Effect.Effect<T, TempehError>,
  defaultValue: T
): Promise<T> {
  try {
    return await Effect.runPromise(effect);
  } catch (error) {
    console.warn(`Warning: Effect failed, using default value: ${error}`);
    return defaultValue;
  }
}

/**
 * Wraps an Effect and returns a boolean indicating success/failure
 */
export async function runEffectSuccess(
  effect: Effect.Effect<unknown, TempehError>
): Promise<boolean> {
  try {
    await Effect.runPromise(effect);
    return true;
  } catch (error) {
    console.error(`Effect failed: ${error}`);
    return false;
  }
}
