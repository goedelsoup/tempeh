import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createProviderCommand } from '../provider';
import { TempehError } from '@tempeh/types';

// Mock console.log to capture output
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
const mockConsoleWarn = vi.fn();

// Mock Effect.runPromise
vi.mock('effect/Effect', () => ({
  runPromise: vi.fn(),
  gen: vi.fn(),
  succeed: vi.fn()
}));

// Mock the provider module
vi.mock('@tempeh/provider', () => ({
  ProviderManager: vi.fn().mockImplementation(() => ({
    listAvailableProviders: vi.fn(),
    validateProviders: vi.fn(),
    generateProviders: vi.fn(),
    updateProviders: vi.fn()
  }))
}));

describe('provider command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('console', {
      log: mockConsoleLog,
      error: mockConsoleError,
      warn: mockConsoleWarn,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register provider command correctly', () => {
    const command = createProviderCommand();
    
    expect(command.name()).toBe('provider');
    expect(command.description()).toBe('Manage CDKTF providers');
  });

  it('should have correct global options', () => {
    const command = createProviderCommand();
    
    const options = command.options || [];
    const optionNames = options.map(opt => opt.long);
    
    expect(optionNames).toContain('--working-dir');
    expect(optionNames).toContain('--verbose');
  });

  it('should have list subcommand', () => {
    const command = createProviderCommand();
    
    const listCommand = command.commands.find(cmd => cmd.name() === 'list');
    expect(listCommand).toBeDefined();
    expect(listCommand?.description()).toBe('List available CDKTF providers');
  });

  it('should have generate subcommand', () => {
    const command = createProviderCommand();
    
    const generateCommand = command.commands.find(cmd => cmd.name() === 'generate');
    expect(generateCommand).toBeDefined();
    expect(generateCommand?.description()).toBe('Generate CDKTF providers');
  });

  it('should have action functions', () => {
    const command = createProviderCommand();
    
    const listCommand = command.commands.find(cmd => cmd.name() === 'list');
    expect(listCommand).toBeDefined();
    expect(typeof listCommand?.action).toBe('function');
    
    const generateCommand = command.commands.find(cmd => cmd.name() === 'generate');
    expect(generateCommand).toBeDefined();
    expect(typeof generateCommand?.action).toBe('function');
  });
});
