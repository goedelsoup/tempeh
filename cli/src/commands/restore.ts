import type { Command } from 'commander';
import * as chalk from 'chalk';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { logger } from '@tempeh/utils';
import { StateManager, StateInspector } from '@tempeh/state';
import { TempehError } from '@tempeh/types';
import type { StateInfo } from '@tempeh/types';

// ============================================================================
// Command Options Interface
// ============================================================================

export interface RestoreOptions {
  file?: string;
  dryRun?: boolean;
  validate?: boolean;
  force?: boolean;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const restore = (program: Command) => {
  program
    .command('restore')
    .description('Restore state from backup')
    .argument('<backup-file>', 'Backup file to restore from')
    .option('-f, --file <path>', 'Target state file path', 'terraform.tfstate')
    .option('--dry-run', 'Show what would be restored without making changes')
    .option('--validate', 'Validate the restored state after restoration')
    .option('--force', 'Force restoration even if validation fails')
    .action(async (backupFile: string, options: RestoreOptions) => {
      try {
        await Effect.runPromise(
          Effect.gen(function* (_) {
            yield* _(logger.info('Starting state restoration...'));
            
            // Validate backup file
            if (!backupFile) {
              throw new TempehError({
                code: 'RESTORE_VALIDATION_ERROR',
                message: 'Backup file is required',
                suggestions: [
                  'Specify a backup file as the first argument',
                  'Use "tempeh backup list" to see available backups'
                ]
              });
            }
            
            // Validate target file path
            const targetFile = options.file || 'terraform.tfstate';
            if (!targetFile) {
              throw new TempehError({
                code: 'RESTORE_VALIDATION_ERROR',
                message: 'Target state file path is required',
                suggestions: [
                  'Specify a target file with --file',
                  'Use the default terraform.tfstate'
                ]
              });
            }

            const manager = new StateManager(Effect.runSync(Ref.make({ 
              version: '4.0',
              terraformVersion: '1.0.0',
              serial: 1,
              lineage: 'default',
              resources: [], 
              outputs: {} 
            } as StateInfo)), { stateFile: targetFile });
            
            if (options.dryRun) {
              yield* _(logger.info(chalk.yellow.bold('DRY RUN - No changes will be made')));
              yield* _(logger.info(chalk.gray(`Would restore from: ${backupFile}`)));
              yield* _(logger.info(chalk.gray(`Would restore to: ${targetFile}`)));
              
              // Load and show backup info
              const backupState = yield* _(manager.restoreBackup(backupFile));
              const inspector = new StateInspector(Effect.runSync(Ref.make(backupState)));
              const analysis = yield* _(inspector.analyze());
              
              yield* _(logger.info(chalk.blue.bold('Backup Information:')));
              yield* _(logger.info(chalk.gray(`Version: ${backupState.version}`)));
              yield* _(logger.info(chalk.gray(`Terraform Version: ${backupState.terraformVersion}`)));
              yield* _(logger.info(chalk.gray(`Total Resources: ${analysis.totalResources}`)));
              yield* _(logger.info(chalk.gray(`Resource Types: ${Object.keys(analysis.resourceTypes).length}`)));
              yield* _(logger.info(chalk.gray(`Outputs: ${analysis.outputs.length}`)));
              return;
            }

            // Perform the actual restoration
            yield* _(logger.info(chalk.blue.bold('Restoring state from backup...')));
            const state = yield* _(manager.restoreBackup(backupFile));
            yield* _(manager.saveState(state));
            
            yield* _(logger.info(chalk.green.bold('✓ State restored successfully')));
            yield* _(logger.info(chalk.gray(`Restored from: ${backupFile}`)));
            yield* _(logger.info(chalk.gray(`Restored to: ${targetFile}`)));
            
            // Validate the restored state if requested
            if (options.validate) {
              yield* _(logger.info(chalk.blue.bold('Validating restored state...')));
              const inspector = new StateInspector(Effect.runSync(Ref.make(state)));
              const validation = yield* _(inspector.validateState());
            
              if (validation) {
                yield* _(logger.info(chalk.green.bold('✓ State validation passed')));
                yield* _(logger.info(chalk.gray('No issues found')));
              } else {
                yield* _(logger.error(chalk.red.bold('✗ State validation failed')));
                yield* _(logger.error(chalk.gray('State validation failed - check state structure')));
                
                if (!options.force) {
                  throw new TempehError({
                    code: 'RESTORE_VALIDATION_ERROR',
                    message: 'Restored state validation failed',
                    suggestions: [
                      'Check the state file structure',
                      'Use --force to restore anyway',
                      'Consider using a different backup'
                    ],
                    context: { validationFailed: true }
                  });
                }
                yield* _(logger.warn(chalk.yellow.bold('⚠ Restoration completed despite validation issues (--force used)')));
              }
            }
          })
        );
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Failed to restore state:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Failed to restore state:', error);
        }
        process.exit(1);
      }
    });
};

// ============================================================================
// Legacy Export (for backward compatibility)
// ============================================================================

export function registerRestoreCommand(program: Command): void {
  restore(program);
}
