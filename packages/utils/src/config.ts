import * as Effect from 'effect/Effect';
import type { TempehConfig } from '@tempeh/types';
import { ValidationError } from '@tempeh/types';
import { readJsonFile, writeJsonFile, exists } from './file';

export const DEFAULT_TEMPEH_CONFIG = 'tempeh.json';

// ============================================================================
// Configuration Implementation
// ============================================================================

export class Config {
  load(path?: string) {
    const configPath = path || DEFAULT_TEMPEH_CONFIG;
    
    return Effect.gen(function* (_) {
      const configExists = yield* _(exists(configPath));
      
      if (!configExists) {
        // Return default configuration
        return getDefaultConfig();
      }

      const config = yield* _(readJsonFile<TempehConfig>(configPath));
      return config;
    });
  }

  save(config: TempehConfig, path?: string) {
    const configPath = path || 'tempeh.json';
    return writeJsonFile(configPath, config);
  }
}

// ============================================================================
// Configuration Factory
// ============================================================================

export const makeConfig = (): Config => {
  return new Config();
};

// ============================================================================
// Global Config Instance
// ============================================================================

export const config = makeConfig();

// ============================================================================
// Configuration Effects
// ============================================================================

export const loadConfig = (path?: string) => {
  return config.load(path);
};

export const saveConfig = (configData: TempehConfig, path?: string) => {
  return config.save(configData, path);
};

// ============================================================================
// Utility Functions
// ============================================================================

export const getDefaultConfig = (): TempehConfig => {
  return {
    version: '0.1.0',
    defaults: {
      workingDir: '.',
      stateFile: 'terraform.tfstate',
      verbose: false,
    },
    workflows: {
      deploy: {
        name: 'deploy',
        description: 'Deploy infrastructure',
        steps: [
          {
            name: 'plan',
            description: 'Generate execution plan',
            command: 'plan',
          },
          {
            name: 'deploy',
            description: 'Deploy the stack',
            command: 'deploy',
          },
        ],
      },
      destroy: {
        name: 'destroy',
        description: 'Destroy infrastructure',
        steps: [
          {
            name: 'plan',
            description: 'Generate destruction plan',
            command: 'plan',
            args: ['--destroy'],
          },
          {
            name: 'destroy',
            description: 'Destroy the stack',
            command: 'destroy',
          },
        ],
      },
    },
    aliases: {
      prod: 'deploy --stack production',
      dev: 'deploy --stack development',
    },
  };
};

export const validateConfig = (configData: unknown) => {
  return Effect.try({
    try: () => configData as TempehConfig,
    catch: (_error) => new ValidationError({
      field: 'config',
      value: configData,
      message: 'Invalid configuration format',
    }),
  });
};

export const mergeConfig = (defaultConfig: TempehConfig, userConfig: Partial<TempehConfig>): TempehConfig => {
  return {
    ...defaultConfig,
    ...userConfig,
    defaults: {
      ...defaultConfig.defaults,
      ...userConfig.defaults,
    },
    workflows: {
      ...defaultConfig.workflows,
      ...userConfig.workflows,
    },
    aliases: {
      ...defaultConfig.aliases,
      ...userConfig.aliases,
    },
  };
};
