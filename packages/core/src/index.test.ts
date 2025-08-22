import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TempehEngine } from './index';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import type { StateInfo } from '@tempeh/types';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  exec: vi.fn()
}));

describe('TempehEngine', () => {
  let tempehEngine: TempehEngine;

  beforeEach(() => {
    tempehEngine = new TempehEngine('/test/project');
  });

  it('should create TempehEngine instance', () => {
    expect(tempehEngine).toBeInstanceOf(TempehEngine);
  });

  it('should have correct working directory', () => {
    const engine = new TempehEngine('/custom/path');
    expect(engine.workingDir).toBe('/custom/path');
  });

  it('should initialize successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.initialize());
    expect(result).toBeUndefined();
  });

  it('should validate successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.validate());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should get status', async () => {
    const result = await Effect.runPromise(tempehEngine.getStatus());
    expect(result.status).toBe('ready');
    expect(result.message).toBe('TempehEngine is ready');
  });

  it('should deploy successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.deploy());
    expect(result.success).toBe(true);
    expect(result.outputs).toEqual({});
    expect(result.resources).toEqual([]);
  });

  it('should plan successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.plan());
    expect(result.changes.add).toEqual([]);
    expect(result.changes.change).toEqual([]);
    expect(result.changes.destroy).toEqual([]);
    expect(result.summary).toBe('No changes');
  });

  it('should synth successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.synth());
    expect(result).toBeUndefined();
  });

  it('should diff successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.diff());
    expect(result.changes.add).toEqual([]);
    expect(result.changes.change).toEqual([]);
    expect(result.changes.destroy).toEqual([]);
    expect(result.summary).toBe('No differences');
  });

  it('should list successfully', async () => {
    const result = await Effect.runPromise(tempehEngine.list());
    expect(result.stacks).toEqual([]);
  });
});
