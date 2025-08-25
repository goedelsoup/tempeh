import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { StateValidator } from './state-validator';
import type { StateInfo } from '@tempeh/types';

describe('StateValidator', () => {
  let validator: StateValidator;
  let stateRef: Ref.Ref<StateInfo>;

  beforeEach(() => {
    const info: StateInfo = {
      version: '4.0',
      terraformVersion: '1.0.0',
      serial: 1,
      lineage: 'test-lineage',
      resources: [],
      outputs: {}
    };
    stateRef = Effect.runSync(Ref.make(info));
    validator = new StateValidator(stateRef);
  });

  describe('validate', () => {
    it('should validate a valid state successfully', async () => {
      const validState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: [
              {
                schemaVersion: 1,
                attributes: { id: 'i-1234567890abcdef0' },
                private: 'private-data',
                dependencies: []
              }
            ]
          }
        ],
        outputs: {
          instance_id: { value: 'i-1234567890abcdef0', sensitive: false }
        }
      };

      Effect.runSync(Ref.set(stateRef, validState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(true);
      // The validator may add info messages for valid states, so we only check for errors and warnings
      expect(result.summary.errorCount).toBe(0);
      expect(result.summary.warningCount).toBe(0);
    });

    it('should detect missing version field', async () => {
      const invalidState: StateInfo = {
        version: '',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'error',
        code: 'MISSING_VERSION',
        message: 'State file missing version field'
      });
    });

    it('should detect missing terraform version', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(true); // Warnings don't make state invalid
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'warning',
        code: 'MISSING_TERRAFORM_VERSION',
        message: 'State file missing terraform version'
      });
    });

    it('should detect invalid serial number', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        // biome-ignore lint/suspicious/noExplicitAny: required for negative test case
        serial: 'invalid' as any,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'error',
        code: 'INVALID_SERIAL',
        message: 'State file has invalid serial number'
      });
    });

    it('should detect invalid resources field', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        // biome-ignore lint/suspicious/noExplicitAny: required for negative test case
        resources: 'not-an-array' as any,
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      // The validator may detect multiple issues, so we check for the specific error
      expect(result.issues.some(issue => 
        issue.level === 'error' && 
        issue.code === 'INVALID_RESOURCES' &&
        issue.message === 'Resources field is not an array'
      )).toBe(true);
    });

    it('should detect invalid outputs field', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        // biome-ignore lint/suspicious/noExplicitAny: required for negative test case
        outputs: null as any
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'error',
        code: 'INVALID_OUTPUTS',
        message: 'Outputs field is not an object'
      });
    });

    it('should detect duplicate resources', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: []
          },
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: []
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      // The validator may detect multiple issues, so we check for the specific error
      expect(result.issues.some(issue => 
        issue.level === 'error' && 
        issue.code === 'DUPLICATE_RESOURCE' &&
        issue.message === 'Duplicate resource found: aws_instance.test'
      )).toBe(true);
    });

    it('should detect resources with missing type or name', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: '',
            name: 'test',
            provider: 'aws',
            instances: []
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      // The validator may detect multiple issues, so we check for the specific error
      expect(result.issues.some(issue => 
        issue.level === 'error' && 
        issue.code === 'INVALID_RESOURCE' &&
        issue.message === 'Resource at index 0 missing type or name'
      )).toBe(true);
    });

    it('should detect resources with missing provider', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: '',
            instances: []
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(true); // Warnings don't make state invalid
      // The validator may detect multiple issues, so we check for the specific warning
      expect(result.issues.some(issue => 
        issue.level === 'warning' && 
        issue.code === 'MISSING_PROVIDER' &&
        issue.message === 'Resource aws_instance.test missing provider field'
      )).toBe(true);
    });

    it('should detect resources with no instances', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: []
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(true); // Warnings don't make state invalid
      // The validator may detect multiple issues, so we check for the specific warning
      expect(result.issues.some(issue => 
        issue.level === 'warning' && 
        issue.code === 'NO_INSTANCES' &&
        issue.message === 'Resource aws_instance.test has no instances'
      )).toBe(true);
    });

    it('should detect invalid instance schema version', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: [
              {
                // biome-ignore lint/suspicious/noExplicitAny: required for negative test case
                schemaVersion: 'invalid' as any,
                attributes: {},
                private: 'private-data',
                dependencies: []
              }
            ]
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      // The validator may detect multiple issues, so we check for the specific error
      expect(result.issues.some(issue => 
        issue.level === 'error' && 
        issue.code === 'INVALID_SCHEMA_VERSION' &&
        issue.message === 'Resource aws_instance.test has invalid schema version'
      )).toBe(true);
    });

    it('should detect null outputs', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {
          test_output: null
        }
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(true); // Warnings don't make state invalid
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'warning',
        code: 'NULL_OUTPUT',
        message: 'Output \'test_output\' has null/undefined value'
      });
    });

    it('should detect sensitive outputs', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {
          password: 'secret-password-123'
        }
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(true); // Info doesn't make state invalid
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'info',
        code: 'SENSITIVE_OUTPUT',
        message: 'Output \'password\' may contain sensitive data'
      });
    });

    it('should detect missing dependencies', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: [
              {
                schemaVersion: 1,
                attributes: {},
                private: 'private-data',
                dependencies: ['aws_security_group.missing']
              }
            ]
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'error',
        code: 'MISSING_DEPENDENCY',
        message: 'Resource aws_instance.test depends on missing resource: aws_security_group.missing'
      });
    });

    it('should detect circular dependencies', async () => {
      const invalidState: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'instance1',
            provider: 'aws',
            instances: [
              {
                schemaVersion: 1,
                attributes: {},
                private: 'private-data',
                dependencies: ['aws_instance.instance2']
              }
            ]
          },
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'instance2',
            provider: 'aws',
            instances: [
              {
                schemaVersion: 1,
                attributes: {},
                private: 'private-data',
                dependencies: ['aws_instance.instance1']
              }
            ]
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const result = await Effect.runPromise(validator.validate());

      expect(result.isValid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        level: 'error',
        code: 'CIRCULAR_DEPENDENCY',
        message: 'Circular dependency detected involving resource: aws_instance.instance1'
      });
    });
  });

  describe('validateResourceExists', () => {
    it('should return true for existing resource', async () => {
      const state: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [
          {
            module: 'root',
            mode: 'managed',
            type: 'aws_instance',
            name: 'test',
            provider: 'aws',
            instances: []
          }
        ],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, state));
      const exists = await Effect.runPromise(validator.validateResourceExists('aws_instance', 'test'));

      expect(exists).toBe(true);
    });

    it('should return false for non-existing resource', async () => {
      const state: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, state));
      const exists = await Effect.runPromise(validator.validateResourceExists('aws_instance', 'test'));

      expect(exists).toBe(false);
    });
  });

  describe('validateOutputExists', () => {
    it('should return true for existing output', async () => {
      const state: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {
          test_output: { value: 'test' }
        }
      };

      Effect.runSync(Ref.set(stateRef, state));
      const exists = await Effect.runPromise(validator.validateOutputExists('test_output'));

      expect(exists).toBe(true);
    });

    it('should return false for non-existing output', async () => {
      const state: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, state));
      const exists = await Effect.runPromise(validator.validateOutputExists('test_output'));

      expect(exists).toBe(false);
    });
  });

  describe('getValidationReport', () => {
    it('should generate a validation report', async () => {
      const state: StateInfo = {
        version: '4.0',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, state));
      const report = await Effect.runPromise(validator.getValidationReport());

      expect(report).toContain('State Validation Report');
      expect(report).toContain('✅ State is valid!');
      expect(report).toContain('Errors: 0');
      expect(report).toContain('Warnings: 0');
      expect(report).toContain('Info: 0');
    });

    it('should include issues in the report', async () => {
      const invalidState: StateInfo = {
        version: '',
        terraformVersion: '1.0.0',
        serial: 1,
        lineage: 'test-lineage',
        resources: [],
        outputs: {}
      };

      Effect.runSync(Ref.set(stateRef, invalidState));
      const report = await Effect.runPromise(validator.getValidationReport());

      expect(report).toContain('❌ State has validation issues');
      expect(report).toContain('Errors: 1');
      expect(report).toContain('[MISSING_VERSION]');
      expect(report).toContain('State file missing version field');
    });
  });
});
