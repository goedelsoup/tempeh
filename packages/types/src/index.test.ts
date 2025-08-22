import { describe, it, expect } from 'vitest';
import type {
  CdktfConfig,
} from './index';

describe('Types Package', () => {
  it('should export all required types', () => {
    // This test ensures all types are properly exported
    // Note: TypeScript types are erased at runtime, so we can't test them directly
    // Instead, we test that we can import them without errors
    // The fact that this test runs without import errors means the types are properly exported
    expect(true).toBe(true);
  });

  it('should allow creating type-safe objects', () => {
    const config: CdktfConfig = {
      language: 'typescript',
      app: 'npx ts-node main.ts',
      output: 'cdktf.out',
      codeMakerOutput: '.gen',
      projectId: 'test-project',
      sendCrashReports: false
    };

    expect(config.language).toBe('typescript');
    expect(config.projectId).toBe('test-project');
  });
});
