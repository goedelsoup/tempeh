import type { Command } from 'commander';
import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import type { CdktfCommandOptions } from '@tempeh/api';
import { TempehError } from '@tempeh/types';

// Lazy-load the TempehEngine to avoid CDKTF initialization on import
const loadTempehEngine = () => 
  Effect.promise(() => import('@tempeh/core').then(module => module.TempehEngine));

// ============================================================================
// Command Options Interface
// ============================================================================

export interface DestroyOptions {
  stack?: string;
  autoApprove?: boolean;
  target?: string[];
  var?: Record<string, string>;
  varFile?: string[];
  workingDir?: string;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const destroy = (program: Command) => {
  program
    .command('destroy')
    .description('Destroy CDKTF stacks')
    .option('-s, --stack <name>', 'Stack name to destroy')
    .option('--auto-approve', 'Skip approval prompt')
    .option('--target <targets...>', 'Target specific resources')
    .option('--var <key=value>', 'Set variable values')
    .option('--var-file <files...>', 'Variable file paths')
    .option('--working-dir <path>', 'Working directory', process.cwd())
    .action(async (options: DestroyOptions) => {
      try {
        await Effect.runPromise(
          Effect.gen(function* (_) {
            yield* _(logger.warn('⚠️  WARNING: This will destroy all resources in the stack!'));
            
            // Validate working directory
            const workingDir = options.workingDir || process.cwd();
            if (!workingDir) {
              throw new TempehError({
                code: 'DESTROY_VALIDATION_ERROR',
                message: 'Working directory is required',
                suggestions: [
                  'Specify a working directory with --working-dir',
                  'Ensure you are in a valid CDKTF project directory'
                ]
              });
            }
            
            if (!options.autoApprove) {
              yield* _(logger.info('Use --auto-approve to skip this confirmation'));
              yield* _(logger.info('This action cannot be undone.'));
              // In a real implementation, you might want to prompt for confirmation here
            }
            
            const TempehEngineClass = yield* _(loadTempehEngine());
            const tempehEngine = new TempehEngineClass(workingDir);
            
            // Parse variables if provided
            const variables: Record<string, string> = {};
            if (options.var) {
              for (const [key, value] of Object.entries(options.var)) {
                variables[key] = value;
              }
            }
            
            const destroyOptions: Partial<CdktfCommandOptions> = {};
            if (options.stack !== undefined) destroyOptions.stack = options.stack;
            if (options.autoApprove !== undefined) destroyOptions.autoApprove = options.autoApprove;
            if (options.target !== undefined) destroyOptions.target = options.target;
            if (Object.keys(variables).length > 0) destroyOptions.var = variables;
            if (options.varFile !== undefined) destroyOptions.varFile = options.varFile;
            
            const result = yield* _(tempehEngine.destroy(destroyOptions));
            
            if (result.success) {
              yield* _(logger.info('Destroy completed successfully!'));
              yield* _(logger.info('All resources have been destroyed.'));
            } else {
              throw new TempehError({
                code: 'DESTROY_FAILED',
                message: 'Destroy operation failed',
                suggestions: [
                  'Check the destroy logs for errors',
                  'Verify all resources can be destroyed',
                  'Ensure you have the necessary permissions'
                ],
                context: { result }
              });
            }
          })
        );
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Destroy failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Destroy failed:', error);
        }
        process.exit(1);
      }
    });
};
