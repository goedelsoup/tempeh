import type { Command } from 'commander';
import { TempehError } from '@tempeh/types';
import type { CdktfCommandOptions } from '@tempeh/api';
import { runEffectResult } from '../utils/effect-wrapper';

// ============================================================================
// Command Options Interface
// ============================================================================

interface PlanOptions {
  stack?: string;
  refresh?: boolean;
  target?: string[];
  var?: Record<string, string>;
  varFile?: string[];
  workingDir?: string;
  json?: boolean;
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

export const plan = (program: Command) => {
  program
    .command('plan')
    .description('Show deployment plan for CDKTF stacks')
    .option('-s, --stack <name>', 'Stack name to plan')
    .option('--refresh', 'Refresh state before planning')
    .option('--target <targets...>', 'Target specific resources')
    .option('--var <key=value>', 'Set variable values')
    .option('--var-file <files...>', 'Variable file paths')
    .option('--working-dir <path>', 'Working directory', process.cwd())
    .option('--json', 'Output plan in JSON format')
    .action(async (options: PlanOptions) => {
      try {
        console.log('Generating deployment plan...');
        
        // Validate working directory
        const workingDir = options.workingDir || process.cwd();
        if (!workingDir) {
          throw new TempehError({
            code: 'PLAN_VALIDATION_ERROR',
            message: 'Working directory is required',
            suggestions: [
              'Specify a working directory with --working-dir',
              'Ensure you are in a valid CDKTF project directory'
            ]
          });
        }
        
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(workingDir);
        
        // Parse variables if provided
        const variables: Record<string, string> = {};
        if (options.var) {
          for (const [key, value] of Object.entries(options.var)) {
            variables[key] = value;
          }
        }
        
        const planOptions: Partial<CdktfCommandOptions> = {};
        if (options.stack !== undefined) planOptions.stack = options.stack;
        if (options.refresh !== undefined) planOptions.refresh = options.refresh;
        if (options.target !== undefined) planOptions.target = options.target;
        if (Object.keys(variables).length > 0) planOptions.var = variables;
        if (options.varFile !== undefined) planOptions.varFile = options.varFile;
        
        const result = await runEffectResult(tempehEngine.plan(planOptions));
        const resultData = result as Record<string, unknown>;
        
        if (options.json) {
          // Output JSON format
          console.log(JSON.stringify(resultData, null, 2));
        } else {
          // Output human-readable format
          console.log('');
          console.log('=== Deployment Plan ===');
          console.log('');
          console.log(resultData.summary as string);
          console.log('');
          
          const changes = resultData.changes as Record<string, unknown[]>;
          if (changes?.add && changes.add.length > 0) {
            console.log('Resources to add:');
            for (const resource of changes.add) {
              console.log(`  + ${String(resource)}`);
            }
            console.log('');
          }
          
          if (changes?.change && changes.change.length > 0) {
            console.log('Resources to change:');
            for (const resource of changes.change) {
              console.log(`  ~ ${String(resource)}`);
            }
            console.log('');
          }
          
          if (changes?.destroy && changes.destroy.length > 0) {
            console.log('Resources to destroy:');
            for (const resource of changes.destroy) {
              console.log(`  - ${String(resource)}`);
            }
            console.log('');
          }
          
          if (changes && 
              (!changes.add || changes.add.length === 0) && 
              (!changes.change || changes.change.length === 0) && 
              (!changes.destroy || changes.destroy.length === 0)) {
            console.log('No changes. Infrastructure is up-to-date.');
          }
        }
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Plan failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Plan failed:', error);
        }
        process.exit(1);
      }
    });
};
