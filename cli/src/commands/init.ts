import type { Command } from 'commander';
import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import { writeJsonFile, ensureDirectory } from '@tempeh/utils';
import { TempehError } from '@tempeh/types';
import { existsSync } from 'node:fs';

// ============================================================================
// Command Options Interface
// ============================================================================

export interface InitOptions {
  name?: string;
  description?: string;
  workingDir?: string;
  stateFile?: string;
  backupDir?: string;
  force?: boolean;
}

// ============================================================================
// Configuration Functions
// ============================================================================

const createDefaultConfig = (options: InitOptions) => ({
  version: '0.1.0',
  name: options.name || 'tempeh-project',
  description: options.description || 'A Tempeh-managed infrastructure project',
  defaults: {
    workingDir: options.workingDir || '.',
    stateFile: options.stateFile || 'terraform.tfstate',
    backupDir: options.backupDir || '.tempeh/backups',
    autoBackup: true,
    maxBackups: 10
  },
  workflows: {
    deploy: {
      name: 'Deploy Infrastructure',
      description: 'Deploy the infrastructure',
      required: true,
      steps: [
        {
          name: 'Synthesize',
          description: 'Synthesize CDKTF code',
          command: 'synth'
        },
        {
          name: 'Plan',
          description: 'Show deployment plan',
          command: 'plan'
        },
        {
          name: 'Deploy',
          description: 'Deploy infrastructure',
          command: 'deploy',
          options: {
            autoApprove: true
          }
        }
      ]
    },
    destroy: {
      name: 'Destroy Infrastructure',
      description: 'Destroy the infrastructure',
      required: true,
      steps: [
        {
          name: 'Plan Destroy',
          description: 'Show destroy plan',
          command: 'plan',
          options: {
            destroy: true
          }
        },
        {
          name: 'Destroy',
          description: 'Destroy infrastructure',
          command: 'destroy',
          options: {
            autoApprove: true
          }
        }
      ]
    }
  }
});

// ============================================================================
// Command Implementation
// ============================================================================

export const init = (program: Command) => {
  program
    .command('init')
    .description('Initialize a new Tempeh project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('--working-dir <path>', 'Working directory', '.')
    .option('--state-file <path>', 'State file path', 'terraform.tfstate')
    .option('--backup-dir <path>', 'Backup directory', '.tempeh/backups')
    .option('-f, --force', 'Overwrite existing configuration')
    .action(async (options: InitOptions) => {
      try {
        await Effect.runPromise(
          Effect.gen(function* (_) {
            const configFile = 'tempeh.json';
            
            yield* _(logger.info('Initializing new Tempeh project...'));
            
            // Check if config already exists
            if (existsSync(configFile) && !options.force) {
              throw new TempehError({
                code: 'INIT_CONFIG_EXISTS',
                message: `Configuration file ${configFile} already exists`,
                suggestions: [
                  'Use --force to overwrite the existing configuration',
                  'Remove the existing configuration file manually',
                  'Choose a different project directory'
                ],
                context: { configFile }
              });
            }

            // Validate project name
            if (options.name && !/^[a-zA-Z0-9-_]+$/.test(options.name)) {
              throw new TempehError({
                code: 'INIT_INVALID_NAME',
                message: 'Project name contains invalid characters',
                suggestions: [
                  'Use only letters, numbers, hyphens, and underscores',
                  'Start with a letter or number',
                  'Keep the name simple and descriptive'
                ],
                context: { name: options.name }
              });
            }
            
            // Create default configuration
            const config = createDefaultConfig(options);
            
            // Ensure backup directory exists
            yield* _(
              Effect.try({
                try: () => ensureDirectory(config.defaults.backupDir),
                catch: (error) => new TempehError({
                  code: 'INIT_BACKUP_DIR_ERROR',
                  message: 'Failed to create backup directory',
                  suggestions: [
                    'Check if you have write permissions',
                    'Verify the backup directory path is valid',
                    'Try using a different backup directory'
                  ],
                  context: { backupDir: config.defaults.backupDir, error }
                })
              })
            );
            
            // Write configuration file
            yield* _(
              Effect.try({
                try: () => writeJsonFile(configFile, config),
                catch: (error) => new TempehError({
                  code: 'INIT_WRITE_CONFIG_ERROR',
                  message: 'Failed to write configuration file',
                  suggestions: [
                    'Check if you have write permissions',
                    'Verify the directory is accessible',
                    'Try using a different project location'
                  ],
                  context: { configFile, error }
                })
              })
            );
            
            yield* _(logger.info('✅ Project initialized successfully!'));
            yield* _(logger.info(`📁 Configuration file: ${configFile}`));
            yield* _(logger.info(`📁 Working directory: ${config.defaults.workingDir}`));
            yield* _(logger.info(`📁 State file: ${config.defaults.stateFile}`));
            yield* _(logger.info(`📁 Backup directory: ${config.defaults.backupDir}`));
            yield* _(logger.info(''));
            yield* _(logger.info('Next steps:'));
            yield* _(logger.info('  1. Add your CDKTF code to the working directory'));
            yield* _(logger.info('  2. Run "tempeh scan" to discover your projects'));
            yield* _(logger.info('  3. Run "tempeh deploy" to deploy your infrastructure'));
          })
        );
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Failed to initialize project:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Failed to initialize project:', error);
        }
        process.exit(1);
      }
    });
};
