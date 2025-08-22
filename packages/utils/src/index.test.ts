import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Effect from 'effect/Effect';
import { readJsonFile, writeJsonFile, ensureDirectoryExists, findFileUpward, ensureDirectory } from './file';
import { validateString, validateNumber, validateEnum } from './validation';
import { createTempehError, isTempehError, formatError } from './error';
import { loadConfig, mergeConfig } from './config';
import { Logger, LogLevel } from './logger';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';

describe('File Utils', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const testFile = join(testDir, 'test.json');

  beforeEach(() => {
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
    if (existsSync(testDir)) {
      rmdirSync(testDir);
    }
  });

  it('should read JSON file', async () => {
    const testData = { test: 'data' };
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, JSON.stringify(testData));

    const result = await Effect.runPromise(readJsonFile(testFile));
    expect(result).toEqual(testData);
  });

  it('should write JSON file', async () => {
    const testData = { test: 'data' };
    await Effect.runPromise(writeJsonFile(testFile, testData));

    expect(existsSync(testFile)).toBe(true);
    const content = await Effect.runPromise(readJsonFile(testFile));
    expect(content).toEqual(testData);
  });

  it('should ensure directory exists', async () => {
    await Effect.runPromise(ensureDirectory(testDir));
    expect(existsSync(testDir)).toBe(true);
  });
});

describe('Validation Utils', () => {
  it('should validate string', () => {
    expect(() => validateString('test', 'field')).not.toThrow();
    expect(() => validateString('', 'field')).toThrow();
    expect(() => validateString(123, 'field')).toThrow();
  });

  it('should validate number', () => {
    expect(() => validateNumber(123, 'field')).not.toThrow();
    expect(() => validateNumber('123', 'field')).toThrow();
    expect(() => validateNumber(Number.NaN, 'field')).toThrow();
  });

  it('should validate enum', () => {
    const allowedValues = ['a', 'b', 'c'] as const;
    expect(validateEnum('a', 'field', allowedValues)).toBe('a');
    expect(() => validateEnum('d', 'field', allowedValues)).toThrow();
  });
});

describe('Error Utils', () => {
  it('should create TempehError', () => {
    const error = createTempehError('Test error', 'TEST_ERROR', ['suggestion']);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.suggestions).toEqual(['suggestion']);
  });

  it('should check if error is TempehError', () => {
    const tempehError = createTempehError('Test', 'TEST');
    const regularError = new Error('Test');
    
    expect(isTempehError(tempehError)).toBe(true);
    expect(isTempehError(regularError)).toBe(false);
  });

  it('should format error', () => {
    const error = createTempehError('Test error', 'TEST_ERROR', ['suggestion']);
    const formatted = formatError(error);
    expect(formatted).toContain('Test error');
    expect(formatted).toContain('suggestion');
  });
});

describe('Config Utils', () => {
  it('should merge configs', () => {
    const defaultConfig = {
      version: '1.0.0',
      defaults: { workingDir: '.' },
      workflows: {},
      aliases: {}
    };
    
    const userConfig = {
      defaults: { workingDir: '/custom' }
    };
    
    const merged = mergeConfig(defaultConfig, userConfig);
    expect(merged.defaults.workingDir).toBe('/custom');
    expect(merged.version).toBe('1.0.0');
  });
});

describe('Logger', () => {
  it('should create logger with default options', () => {
    const logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should set log level', () => {
    const logger = new Logger();
    logger.setLevel(LogLevel.DEBUG);
    // Note: We can't easily test console output in unit tests
    // This just ensures the method doesn't throw
    expect(() => logger.debug('test')).not.toThrow();
  });
});
