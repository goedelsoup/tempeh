import type { Command } from 'commander';
import { TempehError } from '@tempeh/types';
import type { CdktfCommandOptions } from '@tempeh/api';
import { runEffectResult } from '../utils/effect-wrapper';

// ============================================================================
// Command Options Interface
// ============================================================================

interface DiffOptions {
  stack?: string;
  workingDir?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function loadTempehEngine() {
  const { TempehEngine } = await import('@tempeh/core');
  return TempehEngine;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const diff = (program: Command) => {
  program
    .command('diff')
    .description('Show differences between current and desired state')
    .option('-s, --stack <name>', 'Stack name to diff')
    .option('--working-dir <path>', 'Working directory', process.cwd())
    .action(async (options: DiffOptions) => {
      try {
        console.log('Generating diff...');
        
        // Validate working directory
        const workingDir = options.workingDir || process.cwd();
        if (!workingDir) {
          throw new TempehError({
            code: 'DIFF_VALIDATION_ERROR',
            message: 'Working directory is required',
            suggestions: [
              'Specify a working directory with --working-dir',
              'Ensure you are in a valid CDKTF project directory'
            ]
          });
        }
        
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(workingDir);
        
        const diffOptions: Partial<CdktfCommandOptions> = {};
        if (options.stack !== undefined) diffOptions.stack = options.stack;
        
        const result = await runEffectResult(tempehEngine.diff(diffOptions));
        const resultData = result as Record<string, unknown>;
        
        console.log('');
        console.log('=== Diff Output ===');
        console.log('');
        console.log(resultData.summary as string);
        console.log('');
        console.log('=== End Diff ===');
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Diff failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Diff failed:', error);
        }
        process.exit(1);
      }
    });
};
