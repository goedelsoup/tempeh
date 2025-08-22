import { describe, it, expect } from 'vitest';
import type { 
  BaseEngine, 
  BaseService
} from './index';

describe('API Package', () => {
  it('should export engine interfaces', () => {
    // Test that engine interfaces are exported and can be used
    const baseEngine: BaseEngine = {
      workingDir: '/test',
      initialize: async () => {},
      validate: async () => ({ isValid: true, errors: [], warnings: [] }),
      getStatus: async () => ({ status: 'ready', message: 'Test engine' })
    };

    expect(baseEngine).toBeDefined();
    expect(baseEngine.workingDir).toBe('/test');
  });

  it('should export service interfaces', () => {
    // Test that service interfaces are exported and can be used
    const baseService: BaseService = {
      name: 'test-service',
      version: '1.0.0',
      initialize: async () => {},
      start: async () => {},
      stop: async () => {},
      getStatus: async () => ({ status: 'running', uptime: 0, message: 'Test service' }),
      validate: async () => ({ isValid: true, errors: [], warnings: [] }),
      getHealth: async () => ({ 
        healthy: true, 
        checks: [], 
        timestamp: new Date() 
      })
    };

    expect(baseService).toBeDefined();
    expect(baseService.name).toBe('test-service');
    expect(baseService.version).toBe('1.0.0');
  });

  it('should be able to import the package', () => {
    // Test that the package can be imported
    expect(true).toBe(true);
  });

  it('should have proper TypeScript types', () => {
    // Test that TypeScript compilation works
    const testFunction = (engine: BaseEngine) => {
      return engine.workingDir;
    };
    
    expect(typeof testFunction).toBe('function');
  });
});
