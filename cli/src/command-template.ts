import type { Command } from 'commander';
import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import { TempehError } from '@tempeh/types';

// ============================================================================
// Command Options Interface
// ============================================================================

export interface TemplateOptions {
  // Define your command-specific options here
  example?: string;
  workingDir?: string;
}

// ============================================================================
// Command Implementation
// ============================================================================

export const template = (program: Command) => {
  program
    .command('template')
    .description('Template command description')
    .option('-e, --example <value>', 'Example option')
    .option('--working-dir <path>', 'Working directory', process.cwd())
    .action(async (options: TemplateOptions) => {
      try {
        await Effect.runPromise(
          Effect.gen(function* (_) {
            yield* _(logger.info('Starting template command...'));
            
            // Validate working directory
            const workingDir = options.workingDir || process.cwd();
            if (!workingDir) {
              throw new TempehError({
                code: 'TEMPLATE_VALIDATION_ERROR',
                message: 'Working directory is required',
                suggestions: [
                  'Specify a working directory with --working-dir',
                  'Ensure you are in a valid CDKTF project directory'
                ]
              });
            }
            
            // Your command logic here
            yield* _(logger.info('Template command completed successfully!'));
          })
        );
      } catch (error) {
        if (error instanceof TempehError) {
          console.error('Template command failed:', error.message);
          if (error.suggestions && error.suggestions.length > 0) {
            console.error('Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`  • ${suggestion}`);
            }
          }
        } else {
          console.error('Template command failed:', error);
        }
        process.exit(1);
      }
    });
};

// ============================================================================
// Usage Example
// ============================================================================

/*
This template shows the standardized pattern for CLI commands:

1. **Proper TypeScript interfaces** for command options
2. **Consistent error handling** using TempehError
3. **Working directory validation** 
4. **Structured error messages** with suggestions
5. **Effect-based async operations**
6. **Consistent logging** using the logger utility

Key improvements over the old pattern:
- ✅ Proper typing for all options
- ✅ Structured error handling with suggestions
- ✅ Consistent validation patterns
- ✅ Better error messages for users
- ✅ Maintains Effect-based architecture
- ✅ Follows the same pattern across all commands

To use this template:
1. Copy this file
2. Replace "template" with your command name
3. Add your command-specific options to the interface
4. Implement your command logic in the Effect.gen block
5. Add appropriate error handling for your use case
*/
