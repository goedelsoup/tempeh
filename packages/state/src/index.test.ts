import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { StateManager } from './state-manager';
import { StateInspector } from './state-inspector';
import { StateBackupManager } from './state-backup';
import { StateMigrationManager } from './state-migration';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import type { StateInfo } from '@tempeh/types';

const mockState: StateInfo = {
  version: '4',
  terraformVersion: '1.5.0',
  serial: 1,
  lineage: 'test-lineage',
  outputs: {
    test_output: {
      value: 'test-value',
      type: 'string'
    }
  },
  resources: [
    {
      module: 'root',
      mode: 'managed',
      type: 'aws_instance',
      name: 'test_instance',
      provider: 'aws',
      instances: [
        {
          schemaVersion: 1,
          attributes: {
            id: 'i-1234567890abcdef0',
            instance_type: 't3.micro'
          },
          private: 'test-private',
          dependencies: []
        }
      ]
    }
  ]
};

describe('StateManager', () => {
  const testDir = join(process.cwd(), 'test-state');
  const stateFile = join(testDir, 'terraform.tfstate');

  beforeEach(() => {
    if (existsSync(testDir)) {
      try {
        if (existsSync(stateFile)) {
          unlinkSync(stateFile);
        }
        rmdirSync(testDir);
      } catch {
        // Ignore errors if files don't exist
      }
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        if (existsSync(stateFile)) {
          unlinkSync(stateFile);
        }
        rmdirSync(testDir);
      } catch {
        // Ignore errors if files don't exist
      }
    }
  });

  it('should load state from file', async () => {
    writeFileSync(stateFile, JSON.stringify(mockState));
    
    const stateRef = Effect.runSync(Ref.make(mockState));
    const manager = new StateManager(stateRef, { stateFile });
    const loadedState = await Effect.runPromise(manager.loadState());
    
    expect(loadedState).toEqual(mockState);
  });

  it('should save state to file', async () => {
    const stateRef = Effect.runSync(Ref.make(mockState));
    const manager = new StateManager(stateRef, { stateFile });
    await Effect.runPromise(manager.saveState(mockState));
    
    expect(existsSync(stateFile)).toBe(true);
    const savedState = JSON.parse(require('node:fs').readFileSync(stateFile, 'utf-8'));
    expect(savedState).toEqual(mockState);
  });

  it('should find resources', async () => {
    writeFileSync(stateFile, JSON.stringify(mockState));
    
    const stateRef = Effect.runSync(Ref.make(mockState));
    const manager = new StateManager(stateRef, { stateFile });
    await Effect.runPromise(manager.loadState());
    
    const resource = await Effect.runPromise(manager.getResource('aws_instance', 'test_instance'));
    expect(resource).toBeDefined();
    expect(resource?.type).toBe('aws_instance');
    expect(resource?.name).toBe('test_instance');
  });

  it('should get outputs', async () => {
    writeFileSync(stateFile, JSON.stringify(mockState));
    
    const stateRef = Effect.runSync(Ref.make(mockState));
    const manager = new StateManager(stateRef, { stateFile });
    await Effect.runPromise(manager.loadState());
    
    const outputs = await Effect.runPromise(manager.getOutputs());
    expect(outputs).toEqual(mockState.outputs);
    
    const output = await Effect.runPromise(manager.getOutput('test_output'));
    expect(output).toEqual(mockState.outputs.test_output);
  });
});

describe('StateInspector', () => {
  it('should analyze state', async () => {
    const stateRef = Effect.runSync(Ref.make(mockState));
    const inspector = new StateInspector(stateRef);
    Effect.runSync(inspector.setState(mockState));
    
    const analysis = await Effect.runPromise(inspector.analyze());
    
    expect(analysis.totalResources).toBe(1);
    expect(analysis.resourceTypes.aws_instance).toBe(1);
    expect(analysis.modules).toContain('root');
    expect(analysis.outputs).toContain('test_output');
  });

  it('should find resources with filter', async () => {
    const stateRef = Effect.runSync(Ref.make(mockState));
    const inspector = new StateInspector(stateRef);
    Effect.runSync(inspector.setState(mockState));
    
    const resources = await Effect.runPromise(inspector.findResources({ type: 'aws_instance' }));
    expect(resources).toHaveLength(1);
    expect(resources[0].name).toBe('test_instance');
  });

  it('should list resource types', async () => {
    const stateRef = Effect.runSync(Ref.make(mockState));
    const inspector = new StateInspector(stateRef);
    Effect.runSync(inspector.setState(mockState));
    
    const types = await Effect.runPromise(inspector.listResourceTypes());
    expect(types).toContain('aws_instance');
  });

  it('should validate state', async () => {
    const stateRef = Effect.runSync(Ref.make(mockState));
    const inspector = new StateInspector(stateRef);
    Effect.runSync(inspector.setState(mockState));
    
    const validation = await Effect.runPromise(inspector.validateState());
    expect(validation).toBe(true);
  });
});

describe('StateBackupManager', () => {
  const testDir = join(process.cwd(), 'test-backups');

  beforeEach(() => {
    if (existsSync(testDir)) {
      require('node:fs').rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      require('node:fs').rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create backup', async () => {
    const manager = new StateBackupManager({ backupDir: testDir });
    const backupFile = await Effect.runPromise(manager.createBackup(mockState));
    
    expect(existsSync(backupFile)).toBe(true);
    const backupState = JSON.parse(require('node:fs').readFileSync(backupFile, 'utf-8'));
    expect(backupState).toEqual(mockState);
  });

  it('should list backups', async () => {
    const manager = new StateBackupManager({ backupDir: testDir });
    await Effect.runPromise(manager.createBackup(mockState, 'test-backup'));
    
    const backups = await Effect.runPromise(manager.listBackups());
    expect(backups).toHaveLength(1);
    expect(backups[0].filename).toContain('test-backup');
  });

  it('should get backup stats', async () => {
    const manager = new StateBackupManager({ backupDir: testDir });
    await Effect.runPromise(manager.createBackup(mockState));
    
    const stats = await Effect.runPromise(manager.getBackupStats());
    expect(stats.totalBackups).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });
});

describe('StateMigrationManager', () => {
  it('should migrate state', async () => {
    const manager = new StateMigrationManager();
    const oldState = { ...mockState, version: '1.0.0' };
    
    const result = await Effect.runPromise(manager.migrateState(oldState, '1.2.0'));
    
    expect(result.success).toBe(true);
    expect(result.migratedState).toBeDefined();
    expect(result.migratedState?.version).toBe('1.2.0');
  });

  it('should validate state', async () => {
    const manager = new StateMigrationManager();
    const validation = await Effect.runPromise(manager.validateState(mockState));
    
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });
});
