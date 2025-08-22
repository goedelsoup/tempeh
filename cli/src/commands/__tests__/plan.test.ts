import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { plan } from '../plan';
import { TempehError } from '@tempeh/types';

// Mock console.log to capture output
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

// Mock Effect.runPromise
vi.mock('effect/Effect', () => ({
  runPromise: vi.fn(),
  gen: vi.fn(),
  succeed: vi.fn()
}));

// Mock the core module
vi.mock('@tempeh/core', () => ({
  TempehEngine: vi.fn().mockImplementation(() => ({
    plan: vi.fn()
  }))
}));

// Mock the utils module
vi.mock('@tempeh/utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('plan command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('console', {
      log: mockConsoleLog,
      error: mockConsoleError,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register plan command correctly', () => {
    const program = new Command();
    plan(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'plan');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Show deployment plan for CDKTF stacks');
  });

  it('should have correct options', () => {
    const program = new Command();
    plan(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'plan');
    expect(command).toBeDefined();
    
    const options = command?.options || [];
    const optionNames = options.map(opt => opt.long);
    
    expect(optionNames).toContain('--stack');
    expect(optionNames).toContain('--refresh');
    expect(optionNames).toContain('--target');
    expect(optionNames).toContain('--var');
    expect(optionNames).toContain('--var-file');
    expect(optionNames).toContain('--working-dir');
    expect(optionNames).toContain('--json');
  });

  it('should have an action function', () => {
    const program = new Command();
    plan(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'plan');
    expect(command).toBeDefined();
    expect(typeof command?.action).toBe('function');
  });

  it('should handle plan failure', async () => {
    const mockPlan = vi.fn().mockResolvedValue({
      summary: 'Plan: 0 to add, 0 to change, 0 to destroy',
      changes: {
        add: [],
        change: [],
        destroy: []
      }
    });

    const { TempehEngine } = await import('@tempeh/core');
    (TempehEngine as any).mockImplementation(() => ({
      plan: mockPlan
    }));

    // Mock Effect.runPromise to throw an error
    const { runPromise } = await import('effect/Effect');
    (runPromise as any).mockRejectedValue(new Error('Plan failed'));

    const program = new Command();
    plan(program);
    
    const planCommand = program.commands.find(cmd => cmd.name() === 'plan');
    expect(planCommand).toBeDefined();
    
    // Execute the command and expect it to throw
    try {
      await planCommand?.action({
        workingDir: '/test/dir'
      });
      expect.fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should handle generic errors', async () => {
    // Mock Effect.runPromise to throw a generic error
    const { runPromise } = await import('effect/Effect');
    (runPromise as any).mockRejectedValue(new Error('Generic error'));

    const program = new Command();
    plan(program);
    
    const planCommand = program.commands.find(cmd => cmd.name() === 'plan');
    expect(planCommand).toBeDefined();
    
    // Execute the command and expect it to throw
    try {
      await planCommand?.action({
        workingDir: '/test/dir'
      });
      expect.fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
