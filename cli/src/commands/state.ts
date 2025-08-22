import type { Command } from 'commander';
import * as chalk from 'chalk';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { logger } from '@tempeh/utils';
import { StateManager, StateInspector } from '@tempeh/state';
import { TempehError } from '@tempeh/types';
import type { StateInfo } from '@tempeh/types';

export function registerStateCommand(program: Command): void {
  const stateCommand = program
    .command('state')
    .description('Manage Terraform state');

  // State show command
  stateCommand
    .command('show')
    .description('Show current state information')
    .option('-f, --file <path>', 'State file path', 'terraform.tfstate')
    .option('--json', 'Output in JSON format')
    .option('--summary', 'Show summary only')
    .action(async (options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateManager(Effect.runSync(Ref.make({ 
              version: '4.0',
              terraformVersion: '1.0.0',
              serial: 1,
              lineage: 'default',
              resources: [], 
              outputs: {} 
            } as StateInfo)), { stateFile: options.file });
            const state = yield* _(manager.loadState());
            
            if (options.json) {
              console.log(JSON.stringify(state, null, 2));
              return;
            }

            if (options.summary) {
              const inspector = new StateInspector(Effect.runSync(Ref.make(state)));
              const analysis = yield* _(inspector.analyze());
              
              yield* _(logger.info(chalk.blue.bold('State Summary')));
              yield* _(logger.info(chalk.gray(`Version: ${state.version}`)));
              yield* _(logger.info(chalk.gray(`Terraform Version: ${state.terraformVersion}`)));
              yield* _(logger.info(chalk.gray(`Total Resources: ${analysis.totalResources}`)));
              yield* _(logger.info(chalk.gray(`Resource Types: ${Object.keys(analysis.resourceTypes).length}`)));
              yield* _(logger.info(chalk.gray(`Outputs: ${analysis.outputs.length}`)));
              return;
            }

            yield* _(logger.info(chalk.blue.bold('Terraform State')));
            yield* _(logger.info(chalk.gray(`Version: ${state.version}`)));
            yield* _(logger.info(chalk.gray(`Terraform Version: ${state.terraformVersion}`)));
            yield* _(logger.info(chalk.gray(`Serial: ${state.serial}`)));
            yield* _(logger.info(chalk.gray(`Lineage: ${state.lineage}`)));
            yield* _(logger.info(''));

            // Show resources
            if (state.resources && state.resources.length > 0) {
              yield* _(logger.info(chalk.blue.bold('Resources:')));
              for (const resource of state.resources) {
                yield* _(logger.info(chalk.green(`  ${resource.type}.${resource.name}`)));
                yield* _(logger.info(chalk.gray(`    Module: ${resource.module}`)));
                yield* _(logger.info(chalk.gray(`    Provider: ${resource.provider}`)));
                if (resource.instances?.[0]?.attributes?.id) {
                  yield* _(logger.info(chalk.gray(`    ID: ${resource.instances[0].attributes.id}`)));
                }
                yield* _(logger.info(''));
              }
            }

            // Show outputs
            if (state.outputs && Object.keys(state.outputs).length > 0) {
              yield* _(logger.info(chalk.blue.bold('Outputs:')));
              for (const [name, output] of Object.entries(state.outputs)) {
                if (output && typeof output === 'object' && 'value' in output) {
                  const outputObj = output as { value: unknown; sensitive?: boolean };
                  const value = outputObj.sensitive ? '[SENSITIVE]' : String(outputObj.value);
                  yield* _(logger.info(chalk.green(`  ${name}: ${value}`)));
                }
              }
            }

          } catch (error) {
            yield* _(logger.error('Failed to show state:', error));
            throw new TempehError({
              code: 'STATE_SHOW_ERROR',
              message: 'Failed to show state information',
              suggestions: [
                'Check if the state file exists',
                'Verify the state file is valid JSON',
                'Ensure you have read permissions'
              ],
              context: { stateFile: options.file, error }
            });
          }
        })
      );
    });

  // State backup command
  stateCommand
    .command('backup')
    .description('Create a state backup')
    .option('-f, --file <path>', 'State file path', 'terraform.tfstate')
    .option('-d, --dir <path>', 'Backup directory', '.tempeh/backups')
    .option('-n, --name <name>', 'Backup name')
    .action(async (options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateManager(Effect.runSync(Ref.make({ 
              version: '4.0',
              terraformVersion: '1.0.0',
              serial: 1,
              lineage: 'default',
              resources: [], 
              outputs: {} 
            } as StateInfo)), { 
              stateFile: options.file,
              backupDir: options.dir
            });
            
            yield* _(manager.loadState());
            const backupFile = yield* _(manager.createBackup());
            
            yield* _(logger.info(chalk.green.bold('✓ State backup created successfully')));
            yield* _(logger.info(chalk.gray(`Backup file: ${backupFile}`)));
            
          } catch (error) {
            yield* _(logger.error('Failed to create backup:', error));
            throw new TempehError({
              code: 'STATE_BACKUP_ERROR',
              message: 'Failed to create state backup',
              suggestions: [
                'Check if the state file exists',
                'Verify you have write permissions to the backup directory',
                'Ensure the backup directory is accessible'
              ],
              context: { stateFile: options.file, backupDir: options.dir, error }
            });
          }
        })
      );
    });

  // State restore command
  stateCommand
    .command('restore')
    .description('Restore state from backup')
    .argument('<backup-file>', 'Backup file to restore from')
    .option('-f, --file <path>', 'Target state file path', 'terraform.tfstate')
    .option('--dry-run', 'Show what would be restored without making changes')
    .action(async (backupFile, options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateManager(Effect.runSync(Ref.make({ 
              version: '4.0',
              terraformVersion: '1.0.0',
              serial: 1,
              lineage: 'default',
              resources: [], 
              outputs: {} 
            } as StateInfo)), { stateFile: options.file });
            
            if (options.dryRun) {
              yield* _(logger.info(chalk.yellow.bold('DRY RUN - No changes will be made')));
              yield* _(logger.info(chalk.gray(`Would restore from: ${backupFile}`)));
              yield* _(logger.info(chalk.gray(`Would restore to: ${options.file}`)));
              return;
            }

            const state = yield* _(manager.restoreBackup(backupFile));
            yield* _(manager.saveState(state));
            
            yield* _(logger.info(chalk.green.bold('✓ State restored successfully')));
            yield* _(logger.info(chalk.gray(`Restored from: ${backupFile}`)));
            yield* _(logger.info(chalk.gray(`Restored to: ${options.file}`)));
            
          } catch (error) {
            yield* _(logger.error('Failed to restore state:', error));
            throw new TempehError({
              code: 'STATE_RESTORE_ERROR',
              message: 'Failed to restore state from backup',
              suggestions: [
                'Check if the backup file exists',
                'Verify the backup file is valid',
                'Ensure you have write permissions to the target file'
              ],
              context: { backupFile, targetFile: options.file, error }
            });
          }
        })
      );
    });

  // State validate command
  stateCommand
    .command('validate')
    .description('Validate Terraform state file')
    .option('-f, --file <path>', 'State file path', 'terraform.tfstate')
    .option('--json', 'Output validation results in JSON format')
    .option('--report', 'Generate detailed validation report')
    .action(async (options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateManager(Effect.runSync(Ref.make({ 
              version: '4.0',
              terraformVersion: '1.0.0',
              serial: 1,
              lineage: 'default',
              resources: [], 
              outputs: {} 
            } as StateInfo)), { stateFile: options.file });
            
            // Load state first
            yield* _(manager.loadState());
            
            // Validate state using the new comprehensive validator
            const validationResult = yield* _(manager.validateState());
            
            if (options.json) {
              console.log(JSON.stringify(validationResult, null, 2));
              return;
            }

            if (options.report) {
              const report = yield* _(manager.getValidationReport());
              console.log(report);
              return;
            }

            // Default validation output
            if (validationResult.isValid) {
              yield* _(logger.info(chalk.green.bold('✅ State validation passed!')));
            } else {
              yield* _(logger.info(chalk.red.bold('❌ State validation failed!')));
            }

            yield* _(logger.info(chalk.gray(`Errors: ${validationResult.summary.errorCount}`)));
            yield* _(logger.info(chalk.gray(`Warnings: ${validationResult.summary.warningCount}`)));
            yield* _(logger.info(chalk.gray(`Info: ${validationResult.summary.infoCount}`)));

            if (validationResult.issues.length > 0) {
              yield* _(logger.info(''));
              yield* _(logger.info(chalk.blue.bold('Issues:')));
              
              for (const issue of validationResult.issues) {
                const icon = issue.level === 'error' ? '❌' : 
                            issue.level === 'warning' ? '⚠️' : 'ℹ️';
                const color = issue.level === 'error' ? chalk.red : 
                             issue.level === 'warning' ? chalk.yellow : chalk.blue;
                
                yield* _(logger.info(color(`${icon} [${issue.code}] ${issue.message}`)));
                if (issue.resource) {
                  yield* _(logger.info(chalk.gray(`   Resource: ${issue.resource}`)));
                }
                if (issue.module) {
                  yield* _(logger.info(chalk.gray(`   Module: ${issue.module}`)));
                }
                if (issue.suggestion) {
                  yield* _(logger.info(chalk.gray(`   Suggestion: ${issue.suggestion}`)));
                }
                yield* _(logger.info(''));
              }
            }

            // Exit with error code if validation failed
            if (!validationResult.isValid) {
              throw new TempehError({
                code: 'STATE_VALIDATION_ERROR',
                message: 'State validation failed',
                suggestions: [
                  'Review the issues above',
                  'Consider restoring from a backup',
                  'Check for corruption in the state file'
                ],
                context: { validationResult }
              });
            }
            
          } catch (error) {
            if (error instanceof TempehError) {
              throw error;
            }
            yield* _(logger.error('Failed to validate state:', error));
            throw new TempehError({
              code: 'STATE_VALIDATION_ERROR',
              message: 'Failed to validate state',
              suggestions: [
                'Check if the state file exists',
                'Verify the state file is valid JSON',
                'Ensure you have read permissions'
              ],
              context: { stateFile: options.file, error }
            });
          }
        })
      );
    });
}
