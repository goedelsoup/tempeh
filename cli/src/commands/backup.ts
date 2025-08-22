import type { Command } from 'commander';
import * as chalk from 'chalk';
import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import { StateBackupManager } from '@tempeh/state';
import { TempehError } from '@tempeh/types';

export function registerBackupCommand(program: Command): void {
  const backupCommand = program
    .command('backup')
    .description('Manage state backups');

  // Backup list command
  backupCommand
    .command('list')
    .description('List available backups')
    .option('-d, --dir <path>', 'Backup directory', '.tempeh/backups')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateBackupManager({ backupDir: options.dir });
            const backups = yield* _(manager.listBackups());
            
            if (options.json) {
              console.log(JSON.stringify(backups, null, 2));
              return;
            }

            if (backups.length === 0) {
              yield* _(logger.info(chalk.yellow('No backups found')));
              return;
            }

            yield* _(logger.info(chalk.blue.bold('Available Backups:')));
            for (const backup of backups) {
              yield* _(logger.info(chalk.green(`  ${backup.filename}`)));
              yield* _(logger.info(chalk.gray(`    Size: ${backup.size} bytes`)));
              yield* _(logger.info(chalk.gray(`    Created: ${backup.createdAt}`)));
              if (backup.modifiedAt) {
                yield* _(logger.info(chalk.gray(`    Modified: ${backup.modifiedAt}`)));
              }
              yield* _(logger.info(''));
            }

          } catch (error) {
            yield* _(logger.error('Failed to list backups:', error));
            throw new TempehError({
              code: 'BACKUP_LIST_ERROR',
              message: 'Failed to list backups',
              suggestions: [
                'Check if the backup directory exists',
                'Verify you have read permissions',
                'Ensure the backup directory is accessible'
              ],
              context: { backupDir: options.dir, error }
            });
          }
        })
      );
    });

  // Backup create command
  backupCommand
    .command('create')
    .description('Create a new backup')
    .option('-f, --file <path>', 'State file path', 'terraform.tfstate')
    .option('-d, --dir <path>', 'Backup directory', '.tempeh/backups')
    .option('-n, --name <name>', 'Backup name')
    .action(async (options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateBackupManager({ backupDir: options.dir });
            const backupFile = yield* _(manager.createBackupFromFile(options.file, options.name));
            
            yield* _(logger.info(chalk.green.bold('✓ Backup created successfully')));
            yield* _(logger.info(chalk.gray(`Backup file: ${backupFile}`)));
            
          } catch (error) {
            yield* _(logger.error('Failed to create backup:', error));
            throw new TempehError({
              code: 'BACKUP_CREATE_ERROR',
              message: 'Failed to create backup',
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

  // Backup delete command
  backupCommand
    .command('delete')
    .description('Delete a backup')
    .argument('<backup-file>', 'Backup file to delete')
    .option('-d, --dir <path>', 'Backup directory', '.tempeh/backups')
    .option('--dry-run', 'Show what would be deleted without making changes')
    .action(async (backupFile, options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateBackupManager({ backupDir: options.dir });
            
            if (options.dryRun) {
              yield* _(logger.info(chalk.yellow.bold('DRY RUN - No changes will be made')));
              yield* _(logger.info(chalk.gray(`Would delete: ${backupFile}`)));
              return;
            }

            yield* _(manager.deleteBackup(backupFile));
            
            yield* _(logger.info(chalk.green.bold('✓ Backup deleted successfully')));
            yield* _(logger.info(chalk.gray(`Deleted: ${backupFile}`)));
            
          } catch (error) {
            yield* _(logger.error('Failed to delete backup:', error));
            throw new TempehError({
              code: 'BACKUP_DELETE_ERROR',
              message: 'Failed to delete backup',
              suggestions: [
                'Check if the backup file exists',
                'Verify you have write permissions',
                'Ensure the backup file is not in use'
              ],
              context: { backupFile, backupDir: options.dir, error }
            });
          }
        })
      );
    });

  // Backup rotate command
  backupCommand
    .command('rotate')
    .description('Rotate old backups')
    .option('-d, --dir <path>', 'Backup directory', '.tempeh/backups')
    .option('-k, --keep <count>', 'Number of backups to keep', '10')
    .option('--dry-run', 'Show what would be rotated without making changes')
    .action(async (options) => {
      await Effect.runPromise(
        Effect.gen(function* (_) {
          try {
            const manager = new StateBackupManager({ backupDir: options.dir });
            const keepCount = Number.parseInt(options.keep, 10);
            
            if (options.dryRun) {
              yield* _(logger.info(chalk.yellow.bold('DRY RUN - No changes will be made')));
              yield* _(logger.info(chalk.gray(`Would keep ${keepCount} most recent backups`)));
              return;
            }

            const deletedCount = yield* _(manager.rotateBackups(keepCount));
            
            yield* _(logger.info(chalk.green.bold('✓ Backup rotation completed')));
            yield* _(logger.info(chalk.gray(`Kept ${keepCount} most recent backups`)));
            if (deletedCount > 0) {
              yield* _(logger.info(chalk.gray(`Deleted ${deletedCount} old backups`)));
            }
            
          } catch (error) {
            yield* _(logger.error('Failed to rotate backups:', error));
            throw new TempehError({
              code: 'BACKUP_ROTATE_ERROR',
              message: 'Failed to rotate backups',
              suggestions: [
                'Check if the backup directory exists',
                'Verify you have write permissions',
                'Ensure no backups are currently in use'
              ],
              context: { backupDir: options.dir, keepCount: options.keep, error }
            });
          }
        })
      );
    });
}
