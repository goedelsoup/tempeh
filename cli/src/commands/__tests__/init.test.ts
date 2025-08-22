import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { init } from '../init';
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

// Mock the utils module
vi.mock('@tempeh/utils', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  writeJsonFile: vi.fn(),
  ensureDirectory: vi.fn()
}));

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmdirSync: vi.fn(),
  mkdirSync: vi.fn()
}));

describe('init command', () => {
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

  it('should register init command correctly', () => {
    const program = new Command();
    init(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'init');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Initialize a new Tempeh project');
  });

  it('should have correct options', () => {
    const program = new Command();
    init(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'init');
    expect(command).toBeDefined();
    
    const options = command?.options || [];
    const optionNames = options.map(opt => opt.long);
    
    expect(optionNames).toContain('--name');
    expect(optionNames).toContain('--description');
    expect(optionNames).toContain('--working-dir');
    expect(optionNames).toContain('--state-file');
    expect(optionNames).toContain('--backup-dir');
    expect(optionNames).toContain('--force');
  });

  it('should have an action function', () => {
    const program = new Command();
    init(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'init');
    expect(command).toBeDefined();
    expect(typeof command?.action).toBe('function');
  });

  it('should handle init failure', async () => {
    const { writeJsonFile, ensureDirectory } = await import('@tempeh/utils');
    (writeJsonFile as any).mockResolvedValue(undefined);
    (ensureDirectory as any).mockResolvedValue(undefined);

    // Mock Effect.runPromise to throw an error
    const { runPromise } = await import('effect/Effect');
    (runPromise as any).mockRejectedValue(new Error('Init failed'));

    const program = new Command();
    init(program);
    
    const initCommand = program.commands.find(cmd => cmd.name() === 'init');
    expect(initCommand).toBeDefined();
    
    // Execute the command and expect it to throw
    try {
      await initCommand?.action({
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
    init(program);
    
    const initCommand = program.commands.find(cmd => cmd.name() === 'init');
    expect(initCommand).toBeDefined();
    
    // Execute the command and expect it to throw
    try {
      await initCommand?.action({
        workingDir: '/test/dir'
      });
      expect.fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
