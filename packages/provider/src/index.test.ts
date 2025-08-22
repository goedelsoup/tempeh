import { describe, it, expect } from 'vitest';
import { ProviderManager, type ProviderInfo } from './index';

describe('Provider Package', () => {
  it('should export ProviderManager class', () => {
    expect(ProviderManager).toBeDefined();
    expect(typeof ProviderManager).toBe('function');
  });

  it('should export ProviderInfo type', () => {
    const provider: ProviderInfo = {
      name: 'test',
      version: '1.0.0',
      source: 'test/test'
    };
    expect(provider).toBeDefined();
    expect(provider.name).toBe('test');
  });

  it('should create ProviderManager instance', () => {
    const manager = new ProviderManager();
    expect(manager).toBeInstanceOf(ProviderManager);
  });
});
