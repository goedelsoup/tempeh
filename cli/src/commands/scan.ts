import type { Command } from 'commander';
import { ProjectManager } from '@tempeh/project';
import { TempehError } from '@tempeh/types';
import { runEffectResult } from '../utils/effect-wrapper';

// ============================================================================
// Command Options Interface
// ============================================================================

export interface ScanOptions {
  directory?: string;
  verbose?: boolean;
  json?: boolean;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const scan = (program: Command) => {
  program
    .command('scan')
    .description('Scan for CDKTF and Terraform projects')
    .option('-d, --directory <path>', 'Directory to scan', process.cwd())
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output in JSON format')
    .action(async (options: ScanOptions) => {
      try {
        // Validate directory
        const directory = options.directory || process.cwd();
        if (!directory) {
          throw new TempehError({
            code: 'SCAN_VALIDATION_ERROR',
            message: 'Directory to scan is required',
            suggestions: [
              'Specify a directory with --directory',
              'Ensure the directory exists and is accessible'
            ]
          });
        }

        console.log(`Scanning for projects in: ${directory}`);

        const projectManager = new ProjectManager(directory);
        const result = await runEffectResult(projectManager.scanProjects());

        if (options.json) {
          // Output JSON format
          console.log(JSON.stringify(result, null, 2));
        } else {
          // Output human-readable format
          console.log('');
          console.log('=== Project Scan Results ===');
          const resultData = result as Record<string, unknown>;
          console.log(`Total projects found: ${resultData.totalProjects || 0}`);
          console.log(`CDKTF projects: ${resultData.cdktfProjects || 0}`);
          console.log(`Terraform projects: ${resultData.terraformProjects || 0}`);
          console.log('');

          const projects = resultData.projects as Record<string, unknown>[] || [];
          if (projects.length === 0) {
            console.log('No projects found.');
            console.log('Make sure you have CDKTF or Terraform files in the scanned directory.');
          } else {
            console.log('Projects found:');
            console.log('');

            for (const project of projects) {
              const projectData = project as Record<string, unknown>;
              console.log(`📁 ${projectData.name || 'Unknown'}`);
              console.log(`   Type: ${projectData.type || 'Unknown'}`);
              console.log(`   Directory: ${projectData.workingDirectory || 'Unknown'}`);
              console.log(`   Has State: ${projectData.hasState ? 'Yes' : 'No'}`);
              console.log(`   Has Outputs: ${projectData.hasOutputs ? 'Yes' : 'No'}`);

              if (projectData.config && options.verbose) {
                const config = projectData.config as Record<string, unknown>;
                console.log(`   Language: ${config.language || 'Unknown'}`);
                console.log(`   App: ${config.app || 'Unknown'}`);
                console.log(`   Output: ${config.output || 'Unknown'}`);
                console.log(`   Project ID: ${config.projectId || 'Unknown'}`);
              }

              if (projectData.tempehConfig && options.verbose) {
                const tempehConfig = projectData.tempehConfig as Record<string, unknown>;
                console.log(`   Tempeh Config: ${tempehConfig.version || 'Unknown'}`);
              }

              console.log('');
            }
          }

          console.log('Next steps:');
          console.log('  • Run "tempeh list" to see available projects');
          console.log('  • Run "tempeh deploy <project>" to deploy a project');
          console.log('  • Run "tempeh plan <project>" to see deployment plan');
        }
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Failed to scan for projects:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Failed to scan for projects:', error);
        }
        process.exit(1);
      }
    });
};
