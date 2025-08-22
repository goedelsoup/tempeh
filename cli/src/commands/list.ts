import type { Command } from 'commander';
import { ProjectManager } from '@tempeh/project';
import { TempehError } from '@tempeh/types';
import { runEffectResult } from '../utils/effect-wrapper';

// ============================================================================
// Command Options Interface
// ============================================================================

export interface ListOptions {
  directory?: string;
  type?: string;
  json?: boolean;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const list = (program: Command) => {
  program
    .command('list')
    .description('List available projects')
    .option('-d, --directory <path>', 'Directory to scan', process.cwd())
    .option('-t, --type <type>', 'Filter by project type (cdktf|terraform)')
    .option('--json', 'Output in JSON format')
    .action(async (options: ListOptions) => {
      try {
        console.log('Scanning for projects...');
        
        // Validate directory
        const directory = options.directory || process.cwd();
        if (!directory) {
          throw new TempehError({
            code: 'LIST_VALIDATION_ERROR',
            message: 'Directory to scan is required',
            suggestions: [
              'Specify a directory with --directory',
              'Ensure the directory exists and is accessible'
            ]
          });
        }
        
        // Validate type filter if provided
        if (options.type && !['cdktf', 'terraform'].includes(options.type)) {
          throw new TempehError({
            code: 'LIST_INVALID_TYPE',
            message: 'Invalid project type filter',
            suggestions: [
              'Use "cdktf" for CDKTF projects',
              'Use "terraform" for Terraform projects',
              'Omit the type filter to see all projects'
            ],
            context: { type: options.type }
          });
        }
        
        const projectManager = new ProjectManager(directory);
        const result = await runEffectResult(projectManager.scanProjects());
        
        // Filter by type if specified
        const resultData = result as Record<string, unknown>;
        let projects = resultData.projects as Record<string, unknown>[] || [];
        if (options.type) {
          projects = projects.filter((p: Record<string, unknown>) => p.type === options.type);
        }
        
        if (options.json) {
          // Output JSON format
          console.log(JSON.stringify(projects, null, 2));
        } else {
          // Output human-readable format
          console.log('');
          console.log('=== Available Projects ===');
          console.log('');
          
          if (projects.length === 0) {
            console.log('No projects found.');
            if (options.type) {
              console.log('Try running "tempeh scan" to see all projects.');
            } else {
              console.log('Try running "tempeh init" to create a new project.');
            }
          } else {
            for (const project of projects) {
              const projectData = project as Record<string, unknown>;
              const status = projectData.hasState ? '📊' : '📁';
              const typeIcon = projectData.type === 'cdktf' ? '☁️' : '🏗️';
              
              console.log(`${status} ${projectData.name || 'Unknown'} ${typeIcon}`);
              console.log(`   Type: ${projectData.type || 'Unknown'}`);
              console.log(`   Path: ${projectData.workingDirectory || 'Unknown'}`);
              
              if (projectData.hasState) {
                console.log('   Status: Has state file');
              } else {
                console.log('   Status: No state file');
              }
              
              console.log('');
            }
            
            console.log('Commands:');
            console.log('  tempeh deploy <project>    Deploy a project');
            console.log('  tempeh plan <project>      Show deployment plan');
            console.log('  tempeh destroy <project>   Destroy a project');
            console.log('  tempeh synth <project>     Synthesize CDKTF code');
          }
        }
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Failed to list projects:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Failed to list projects:', error);
        }
        process.exit(1);
      }
    });
};
