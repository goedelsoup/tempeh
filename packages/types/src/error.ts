import * as Data from 'effect/Data';

// ============================================================================
// Error Types
// ============================================================================

export class TempehError extends Data.TaggedError('TempehError')<{
  readonly code: string;
  readonly message: string;
  readonly suggestions?: ReadonlyArray<string>;
  readonly context?: Record<string, unknown>;
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly field: string;
  readonly value: unknown;
  readonly message: string;
}> {}

export class StateError extends Data.TaggedError('StateError')<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class WrappedCDKError extends Data.TaggedError('WrappedCDKError')<{
  readonly command: string;
  readonly message: string;
  readonly exitCode?: number;
  readonly output?: string;
}> {}

export class WorkflowError extends Data.TaggedError('WorkflowError')<{
  readonly workflowName: string;
  readonly stepName: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}
