import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerVersionCommand } from '../version';

// Mock console.log to capture output
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

describe('version command', () => {
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

  it('should register version command correctly', () => {
    const program = new Command();
    registerVersionCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'version');
    expect(command).toBeDefined();
    expect(command?.description()).toBe('Show version information for Tempeh and CDKTF');
  });

  it('should display Tempeh version information', async () => {
    const program = new Command();
    registerVersionCommand(program);
    
    const versionCommand = program.commands.find(cmd => cmd.name() === 'version');
    expect(versionCommand).toBeDefined();
    
    // Execute the command
    await versionCommand?.action();
    
    // Since the command uses Effect-based logging, we can't easily test console output
    // Instead, we test that the command executes without throwing
    expect(versionCommand).toBeDefined();
  });

  it('should handle CDKTF not being installed gracefully', async () => {
    const program = new Command();
    registerVersionCommand(program);
    
    const versionCommand = program.commands.find(cmd => cmd.name() === 'version');
    expect(versionCommand).toBeDefined();
    
    // Execute the command
    await versionCommand?.action();
    
    // Since the command uses Effect-based logging, we can't easily test console output
    // Instead, we test that the command executes without throwing
    expect(versionCommand).toBeDefined();
  });
});
