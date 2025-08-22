#!/usr/bin/env node

import { Command } from 'commander';
import * as Effect from 'effect/Effect';
import { logger, loadConfig } from '@tempeh/utils';
import { TempehError } from '@tempeh/types';
import { registerVersionCommand } from './commands/version';
import { init } from './commands/init';
import { scan } from './commands/scan';
import { list } from './commands/list';
import { registerStateCommand } from './commands/state';
import { registerBackupCommand } from './commands/backup';
import { registerRestoreCommand } from './commands/restore';
import { deploy } from './commands/deploy';
import { destroy } from './commands/destroy';
import { plan } from './commands/plan';
import { synth } from './commands/synth';
import { diff } from './commands/diff';
import { createProviderCommand } from './commands/provider';
import { createWorkflowCommand } from './commands/workflow';
import { createConfigCommand } from './commands/config';
import { createPluginCommand } from './commands/plugin';
import { createSecurityCommand } from './commands/security';

// TODO: Import more commands as they are implemented
import { registerValidateCommand } from './commands/validate';

const program = new Command();

// Set up the main program
program
  .name('tempeh')
  .description('A modern wrapper around CDKTF')
  .version('0.1.0');

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Suppress output')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--working-dir <path>', 'Working directory')
  .option('--state-file <path>', 'State file path');

// Register commands
registerVersionCommand(program);
init(program);
scan(program);
list(program);
registerStateCommand(program);
registerBackupCommand(program);
registerRestoreCommand(program);
deploy(program);
destroy(program);
plan(program);
synth(program);
diff(program);

// Register enhanced commands
program.addCommand(createProviderCommand());
program.addCommand(createWorkflowCommand());
program.addCommand(createConfigCommand());
program.addCommand(createPluginCommand());
program.addCommand(createSecurityCommand());

// TODO: Register more commands as they are implemented
registerValidateCommand(program);

// Pre-action hook for global options
program.hook('preAction', (thisCommand) => {
  const options = thisCommand.opts();
  
  // Load configuration if specified
  if (options.config) {
    Effect.runPromise(
      Effect.gen(function* (_) {
        try {
          yield* _(loadConfig(options.config));
          yield* _(logger.debug('Configuration loaded successfully'));
        } catch (_error) {
          yield* _(logger.warn('Failed to load configuration, using defaults'));
        }
      })
    ).catch(() => {
      // Ignore errors in pre-action hook
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Effect.runPromise(
    Effect.gen(function* (_) {
      yield* _(logger.error('Uncaught exception:', error));
      yield* _(handleError(error, true));
    })
  ).catch(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason) => {
  Effect.runPromise(
    Effect.gen(function* (_) {
      yield* _(logger.error('Unhandled rejection, reason:', reason));
      yield* _(handleError(reason, true));
    })
  ).catch(() => {
    process.exit(1);
  });
});

// ============================================================================
// Error handling
// ============================================================================

function handleError(error: unknown, isFatal = false) {
  return Effect.gen(function* (_) {
    if (error instanceof TempehError) {
      yield* _(logger.error('Tempeh Error:', error.message));
      
      if (error.suggestions && error.suggestions.length > 0) {
        yield* _(logger.info('Suggestions:'));
        for (const suggestion of error.suggestions) {
          yield* _(logger.info(`  • ${suggestion}`));
        }
      }
      
      if (error.context) {
        yield* _(logger.debug('Context:', error.context));
      }
    } else if (error instanceof Error) {
      yield* _(logger.error('Error:', error.message));
      if (error.stack) {
        yield* _(logger.debug('Stack trace:', error.stack));
      }
    } else {
      yield* _(logger.error('Unknown error:', error));
    }
    
    if (isFatal) {
      yield* _(logger.error('Fatal error occurred. Exiting.'));
    }
  });
}

// ============================================================================
// Main execution
// ============================================================================

async function main() {
  try {
    await program.parseAsync();
  } catch (error) {
    await Effect.runPromise(handleError(error, true));
    process.exit(1);
  }
}

// Export for testing
export { program };

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start CLI:', error);
    process.exit(1);
  });
}
