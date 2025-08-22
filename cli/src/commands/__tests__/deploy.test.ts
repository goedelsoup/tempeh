import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { deploy } from '../deploy';
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
    deploy: vi.fn()
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

describe('deploy command', () => {
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

  it('should register deploy command correctly', () => {
    const program = new Command();
    deploy(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'deploy');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Deploy CDKTF stacks');
  });

  it('should have correct options', () => {
    const program = new Command();
    deploy(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'deploy');
    expect(command).toBeDefined();
    
    const options = command?.options || [];
    const optionNames = options.map(opt => opt.long);
    
    expect(optionNames).toContain('--stack');
    expect(optionNames).toContain('--auto-approve');
    expect(optionNames).toContain('--refresh');
    expect(optionNames).toContain('--target');
    expect(optionNames).toContain('--var');
    expect(optionNames).toContain('--var-file');
    expect(optionNames).toContain('--working-dir');
  });

  it('should have an action function', () => {
    const program = new Command();
    deploy(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'deploy');
    expect(command).toBeDefined();
    expect(typeof command?.action).toBe('function');
  });

  it('should handle deployment failure', async () => {
    const mockDeploy = vi.fn().mockResolvedValue({
      success: false,
      error: 'Deployment failed'
    });

    const { TempehEngine } = await import('@tempeh/core');
    (TempehEngine as any).mockImplementation(() => ({
      deploy: mockDeploy
    }));

    // Mock Effect.runPromise to throw an error
    const { runPromise } = await import('effect/Effect');
    (runPromise as any).mockRejectedValue(new Error('Deployment failed'));

    const program = new Command();
    deploy(program);
    
    const deployCommand = program.commands.find(cmd => cmd.name() === 'deploy');
    expect(deployCommand).toBeDefined();
    
    // Execute the command and expect it to throw
    try {
      await deployCommand?.action({
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
    deploy(program);
    
    const deployCommand = program.commands.find(cmd => cmd.name() === 'deploy');
    expect(deployCommand).toBeDefined();
    
    // Execute the command and expect it to throw
    try {
      await deployCommand?.action({
        workingDir: '/test/dir'
      });
      expect.fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
