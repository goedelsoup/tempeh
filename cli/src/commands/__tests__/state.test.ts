import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerStateCommand } from '../state';
import { StateManager, StateInspector } from '@tempeh/state';
import type { StateInfo } from '@tempeh/types';

// Mock the state management classes
vi.mock('@tempeh/state', () => ({
  StateManager: vi.fn(),
  StateInspector: vi.fn()
}));

// Mock console.log to capture output
const mockConsoleLog = vi.fn();

describe('state command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('console', {
      log: mockConsoleLog,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register state command correctly', () => {
    const program = new Command();
    registerStateCommand(program);
    
    const stateCommand = program.commands.find(cmd => cmd.name() === 'state');
    expect(stateCommand).toBeDefined();
    expect(stateCommand?.description()).toBe('Manage Terraform state');
  });

  it('should register state show subcommand', () => {
    const program = new Command();
    registerStateCommand(program);
    
    const stateCommand = program.commands.find(cmd => cmd.name() === 'state');
    const showCommand = stateCommand?.commands.find(cmd => cmd.name() === 'show');
    expect(showCommand).toBeDefined();
    expect(showCommand?.description()).toBe('Show current state information');
  });

  it('should register state backup subcommand', () => {
    const program = new Command();
    registerStateCommand(program);
    
    const stateCommand = program.commands.find(cmd => cmd.name() === 'state');
    const backupCommand = stateCommand?.commands.find(cmd => cmd.name() === 'backup');
    expect(backupCommand).toBeDefined();
    expect(backupCommand?.description()).toBe('Create a state backup');
  });

  it('should register state restore subcommand', () => {
    const program = new Command();
    registerStateCommand(program);
    
    const stateCommand = program.commands.find(cmd => cmd.name() === 'state');
    const restoreCommand = stateCommand?.commands.find(cmd => cmd.name() === 'restore');
    expect(restoreCommand).toBeDefined();
    expect(restoreCommand?.description()).toBe('Restore state from backup');
  });

  it('should register state validate subcommand', () => {
    const program = new Command();
    registerStateCommand(program);
    
    const stateCommand = program.commands.find(cmd => cmd.name() === 'state');
    const validateCommand = stateCommand?.commands.find(cmd => cmd.name() === 'validate');
    expect(validateCommand).toBeDefined();
    expect(validateCommand?.description()).toBe('Validate Terraform state file');
  });
});
