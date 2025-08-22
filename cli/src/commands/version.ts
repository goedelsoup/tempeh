import type { Command } from 'commander';
import * as chalk from 'chalk';
import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import { TempehError } from '@tempeh/types';

// ============================================================================
// Command Options Interface
// ============================================================================

// Version command doesn't need specific options
export type VersionOptions = Record<string, never>;

// ============================================================================
// Version Information Functions
// ============================================================================

const getVersionInfo = () => {
  return Effect.succeed({
    tempehVersion: '0.1.0',
    cdktfVersion: 'Not checked' // Temporarily disable CDKTF version check
  });
};

const displayVersionInfo = (info: { tempehVersion: string; cdktfVersion?: string | undefined }) => {
  return Effect.gen(function* (_) {
    yield* _(logger.info(chalk.blue.bold('Tempeh CLI')));
    yield* _(logger.info(chalk.gray(`Version: ${info.tempehVersion}`)));
    yield* _(logger.info(chalk.gray('A modern wrapper around CDKTF')));
    yield* _(logger.info(''));

    if (info.cdktfVersion) {
      yield* _(logger.info(chalk.blue.bold('CDKTF')));
      yield* _(logger.info(chalk.gray(`Version: ${info.cdktfVersion}`)));
    } else {
      yield* _(logger.info(chalk.red('CDKTF: Not installed or not found in PATH')));
    }

    yield* _(logger.info(''));
    yield* _(logger.info(chalk.gray('For more information, visit: https://github.com/your-org/tempeh')));
  });
};

// ============================================================================
// Command Implementation
// ============================================================================

export const version = (program: Command) => {
  program
    .command('version')
    .description('Show version information for Tempeh and CDKTF')
    .action(async (_options: VersionOptions) => {
      try {
        await Effect.runPromise(
          Effect.gen(function* (_) {
            yield* _(logger.info('Retrieving version information...'));
            
            const versionInfo = yield* _(getVersionInfo());
            yield* _(displayVersionInfo(versionInfo));
          })
        );
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Version command failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Version command failed:', error);
        }
        process.exit(1);
      }
    });
};

// ============================================================================
// Legacy Export (for backward compatibility)
// ============================================================================

export function registerVersionCommand(program: Command): void {
  version(program);
}
