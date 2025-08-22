import type { Command } from 'commander';
import { TempehError } from '@tempeh/types';
import type { CdktfCommandOptions } from '@tempeh/api';
import { runEffectResult } from '../utils/effect-wrapper';

// ============================================================================
// Command Options Interface
// ============================================================================

interface DeployOptions {
  stack?: string;
  autoApprove?: boolean;
  refresh?: boolean;
  target?: string[];
  var?: Record<string, string>;
  varFile?: string[];
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

export const deploy = (program: Command) => {
  program
    .command('deploy')
    .description('Deploy CDKTF stacks')
    .option('-s, --stack <name>', 'Stack name to deploy')
    .option('--auto-approve', 'Skip approval prompt')
    .option('--refresh', 'Refresh state before deployment')
    .option('--target <targets...>', 'Target specific resources')
    .option('--var <key=value>', 'Set variable values')
    .option('--var-file <files...>', 'Variable file paths')
    .option('--working-dir <path>', 'Working directory', process.cwd())
    .action(async (options: DeployOptions) => {
      try {
        console.log('Starting deployment...');
        
        // Validate working directory
        const workingDir = options.workingDir || process.cwd();
        if (!workingDir) {
          throw new TempehError({
            code: 'DEPLOY_VALIDATION_ERROR',
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
        
        const deployOptions: Partial<CdktfCommandOptions> = {};
        if (options.stack !== undefined) deployOptions.stack = options.stack;
        if (options.autoApprove !== undefined) deployOptions.autoApprove = options.autoApprove;
        if (options.refresh !== undefined) deployOptions.refresh = options.refresh;
        if (options.target !== undefined) deployOptions.target = options.target;
        if (Object.keys(variables).length > 0) deployOptions.var = variables;
        if (options.varFile !== undefined) deployOptions.varFile = options.varFile;
        
        const result = await runEffectResult(tempehEngine.deploy(deployOptions));
        const resultData = result as Record<string, unknown>;
        
        if (resultData.success) {
          console.log('Deployment completed successfully!');
          
          const outputs = resultData.outputs as Record<string, unknown>;
          if (outputs && Object.keys(outputs).length > 0) {
            console.log('Outputs:');
            for (const [key, value] of Object.entries(outputs)) {
              console.log(`  ${key}: ${JSON.stringify(value)}`);
            }
          }
          
          const resources = resultData.resources as unknown[];
          if (resources && resources.length > 0) {
            console.log('Resources:');
            for (const resource of resources) {
              console.log(`  ${String(resource)}`);
            }
          }
        } else {
          throw new TempehError({
            code: 'DEPLOY_FAILED',
            message: 'Deployment failed',
            suggestions: [
              'Check the deployment logs for errors',
              'Verify all required resources are available',
              'Ensure you have the necessary permissions'
            ],
            context: { result: resultData }
          });
        }
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Deployment failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Deployment failed:', error);
        }
        process.exit(1);
      }
    });
};
