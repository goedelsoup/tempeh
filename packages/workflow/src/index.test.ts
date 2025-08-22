import { describe, it, expect } from 'vitest';
import { WorkflowEngine, type CdktfWorkflow } from './index';
import * as Effect from 'effect/Effect';
import type { WorkflowValidationResult } from './types';

describe('Workflow Package', () => {
  it('should export WorkflowEngine class', () => {
    expect(WorkflowEngine).toBeDefined();
    expect(typeof WorkflowEngine).toBe('function');
  });

  it('should export CdktfWorkflow type', () => {
    const workflow: CdktfWorkflow = {
      name: 'test-workflow',
      description: 'Test workflow',
      steps: [
        {
          name: 'test-step',
          description: 'Test step',
          command: 'plan'
        }
      ]
    };
    expect(workflow).toBeDefined();
    expect(workflow.name).toBe('test-workflow');
  });

  it('should validate workflow correctly', async () => {
    const mockCdktfEngine = {
      deploy: async () => {},
      destroy: async () => {},
      plan: async () => ({}),
      synth: async () => {},
      diff: async () => ({})
    };
    
    const mockStateManager = {
      createBackup: async () => 'backup-file',
      restoreBackup: async () => ({}),
      getResource: async () => ({}),
      getOutputs: async () => ({})
    };

    const workflowEngine = new WorkflowEngine(mockCdktfEngine, mockStateManager);
    
    const workflow: CdktfWorkflow = {
      name: 'test-workflow',
      description: 'Test workflow',
      steps: [
        {
          name: 'test-step',
          description: 'Test step',
          command: 'plan'
        }
      ]
    };

    const result = await Effect.runPromise(workflowEngine.validateWorkflow(workflow));
    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('should detect invalid workflow', async () => {
    const mockCdktfEngine = {
      deploy: async () => {},
      destroy: async () => {},
      plan: async () => ({}),
      synth: async () => {},
      diff: async () => ({})
    };
    
    const mockStateManager = {
      createBackup: async () => 'backup-file',
      restoreBackup: async () => ({}),
      getResource: async () => ({}),
      getOutputs: async () => ({})
    };

    const workflowEngine = new WorkflowEngine(mockCdktfEngine, mockStateManager);
    
    const invalidWorkflow: CdktfWorkflow = {
      name: '',
      description: '',
      steps: []
    };

    const result = await Effect.runPromise(workflowEngine.validateWorkflow(invalidWorkflow));
    expect(result.isValid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
