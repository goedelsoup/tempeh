import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerBackupCommand } from '../backup';
import { StateBackupManager } from '@tempeh/state';

// Mock the state backup manager
vi.mock('@tempeh/state', () => ({
  StateBackupManager: vi.fn()
}));

// Mock console.log to capture output
const mockConsoleLog = vi.fn();

describe('backup command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('console', {
      log: mockConsoleLog,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register backup command correctly', () => {
    const program = new Command();
    registerBackupCommand(program);
    
    const backupCommand = program.commands.find(cmd => cmd.name() === 'backup');
    expect(backupCommand).toBeDefined();
    expect(backupCommand?.description()).toBe('Manage state backups');
  });

  it('should register backup list subcommand', () => {
    const program = new Command();
    registerBackupCommand(program);
    
    const backupCommand = program.commands.find(cmd => cmd.name() === 'backup');
    const listCommand = backupCommand?.commands.find(cmd => cmd.name() === 'list');
    expect(listCommand).toBeDefined();
    expect(listCommand?.description()).toBe('List available backups');
  });

  it('should register backup create subcommand', () => {
    const program = new Command();
    registerBackupCommand(program);
    
    const backupCommand = program.commands.find(cmd => cmd.name() === 'backup');
    const createCommand = backupCommand?.commands.find(cmd => cmd.name() === 'create');
    expect(createCommand).toBeDefined();
    expect(createCommand?.description()).toBe('Create a new backup');
  });

  it('should register backup delete subcommand', () => {
    const program = new Command();
    registerBackupCommand(program);
    
    const backupCommand = program.commands.find(cmd => cmd.name() === 'backup');
    const deleteCommand = backupCommand?.commands.find(cmd => cmd.name() === 'delete');
    expect(deleteCommand).toBeDefined();
    expect(deleteCommand?.description()).toBe('Delete a backup');
  });

  it('should register backup rotate subcommand', () => {
    const program = new Command();
    registerBackupCommand(program);
    
    const backupCommand = program.commands.find(cmd => cmd.name() === 'backup');
    const rotateCommand = backupCommand?.commands.find(cmd => cmd.name() === 'rotate');
    expect(rotateCommand).toBeDefined();
    expect(rotateCommand?.description()).toBe('Rotate old backups');
  });
});
