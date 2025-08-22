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

export interface SynthOptions {
  stack?: string;
  workingDir?: string;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const synth = (program: Command) => {
  program
    .command('synth')
    .description('Synthesize CDKTF code to Terraform')
    .option('-s, --stack <name>', 'Stack name to synthesize')
    .option('--working-dir <path>', 'Working directory', process.cwd())
    .action(async (options: SynthOptions) => {
      try {
        await Effect.runPromise(
          Effect.gen(function* (_) {
            yield* _(logger.info('Synthesizing CDKTF code...'));
            
            // Validate working directory
            const workingDir = options.workingDir || process.cwd();
            if (!workingDir) {
              throw new TempehError({
                code: 'SYNTH_VALIDATION_ERROR',
                message: 'Working directory is required',
                suggestions: [
                  'Specify a working directory with --working-dir',
                  'Ensure you are in a valid CDKTF project directory'
                ]
              });
            }
            
            const TempehEngineClass = yield* _(loadTempehEngine());
            const tempehEngine = new TempehEngineClass(workingDir);
            
            const synthOptions: Partial<CdktfCommandOptions> = {};
            if (options.stack !== undefined) synthOptions.stack = options.stack;
            
            yield* _(tempehEngine.synth(synthOptions));
            
            yield* _(logger.info('Synthesis completed successfully!'));
            yield* _(logger.info('Terraform configuration has been generated.'));
          })
        );
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Synthesis failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Synthesis failed:', error);
        }
        process.exit(1);
      }
    });
};
