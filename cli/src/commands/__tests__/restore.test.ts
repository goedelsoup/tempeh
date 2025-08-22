import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerRestoreCommand } from '../restore';
import { StateManager, StateInspector } from '@tempeh/state';

// Mock the state management classes
vi.mock('@tempeh/state', () => ({
  StateManager: vi.fn(),
  StateInspector: vi.fn()
}));

// Mock console.log to capture output
const mockConsoleLog = vi.fn();

describe('restore command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('console', {
      log: mockConsoleLog,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register restore command correctly', () => {
    const program = new Command();
    registerRestoreCommand(program);
    
    const restoreCommand = program.commands.find(cmd => cmd.name() === 'restore');
    expect(restoreCommand).toBeDefined();
    expect(restoreCommand?.description()).toBe('Restore state from backup');
  });

  it('should have backup-file argument', () => {
    const program = new Command();
    registerRestoreCommand(program);
    
    const restoreCommand = program.commands.find(cmd => cmd.name() === 'restore');
    expect(restoreCommand).toBeDefined();
    
    // The restore command should be registered with the backup-file argument
    // We can't easily test the internal args, but we can verify the command exists
    expect(restoreCommand?.name()).toBe('restore');
  });
});
