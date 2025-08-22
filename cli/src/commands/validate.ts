import type { Command } from 'commander';
import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import { TempehError } from '@tempeh/types';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ============================================================================
// Command Options Interface
// ============================================================================

export interface ValidateOptions {
  workingDir?: string;
  state?: string;
  workflow?: string;
  providers?: boolean;
}

// ============================================================================
// Validation Functions
// ============================================================================

function validateCdktfConfig(workingDir: string): Effect.Effect<{ isValid: boolean; errors: string[]; warnings: string[] }, Error> {
  return Effect.try({
    try: () => {
      const result = { isValid: true, errors: [] as string[], warnings: [] as string[] };
      
      const cdktfJsonPath = join(workingDir, 'cdktf.json');
      const mainTsPath = join(workingDir, 'main.ts');
      
      // Check if cdktf.json exists
      if (!existsSync(cdktfJsonPath)) {
        result.errors.push('cdktf.json not found');
        result.isValid = false;
        return result;
      }
      
      // Validate cdktf.json structure
      try {
        const cdktfConfig = JSON.parse(readFileSync(cdktfJsonPath, 'utf-8'));
        
        const requiredFields = ['language', 'app', 'output', 'codeMakerOutput', 'projectId'];
        for (const field of requiredFields) {
          if (!cdktfConfig[field]) {
            result.errors.push(`Missing required field in cdktf.json: ${field}`);
            result.isValid = false;
          }
        }
        
        // Validate language
        const validLanguages = ['typescript', 'python', 'java', 'csharp', 'go'];
        if (cdktfConfig.language && !validLanguages.includes(cdktfConfig.language)) {
          result.errors.push(`Invalid language in cdktf.json: ${cdktfConfig.language}`);
          result.isValid = false;
        }
        
      } catch (error) {
        result.errors.push(`Invalid JSON in cdktf.json: ${error instanceof Error ? error.message : String(error)}`);
        result.isValid = false;
      }
      
      // Check if main.ts exists
      if (!existsSync(mainTsPath)) {
        result.warnings.push('main.ts not found - this may be expected for some project structures');
      }
      
      return result;
    },
    catch: (error) => new Error(`Failed to validate CDKTF config: ${error instanceof Error ? error.message : String(error)}`)
  });
}

function validateState(stateFile: string): Effect.Effect<{ isValid: boolean; errors: string[]; warnings: string[] }, Error> {
  return Effect.try({
    try: () => {
      const result = { isValid: true, errors: [] as string[], warnings: [] as string[] };
      
      if (!existsSync(stateFile)) {
        result.warnings.push(`State file not found: ${stateFile}`);
        return result;
      }
      
      // Basic state file validation
      try {
        const stateContent = JSON.parse(readFileSync(stateFile, 'utf-8'));
        
        // Validate state structure
        if (!stateContent.version) {
          result.warnings.push('State file missing version information');
        }
        
        if (!stateContent.resources && !stateContent.outputs) {
          result.warnings.push('State file appears to be empty (no resources or outputs)');
        }
      } catch (error) {
        result.errors.push(`Invalid JSON in state file: ${error instanceof Error ? error.message : String(error)}`);
        result.isValid = false;
      }
      
      return result;
    },
    catch: (error) => new Error(`Failed to validate state file: ${error instanceof Error ? error.message : String(error)}`)
  });
}

function validateWorkflow(workflowFile: string): Effect.Effect<{ isValid: boolean; errors: string[]; warnings: string[] }, Error> {
  return Effect.try({
    try: () => {
      const result = { isValid: true, errors: [] as string[], warnings: [] as string[] };
      
      if (!existsSync(workflowFile)) {
        result.warnings.push(`Workflow file not found: ${workflowFile}`);
        return result;
      }
      
      // Basic workflow file validation
      try {
        const workflowContent = JSON.parse(readFileSync(workflowFile, 'utf-8'));
        
        // Validate required fields
        if (!workflowContent.name) {
          result.errors.push('Workflow missing required field: name');
          result.isValid = false;
        }
        
        if (!workflowContent.steps || !Array.isArray(workflowContent.steps)) {
          result.errors.push('Workflow missing required field: steps (array)');
          result.isValid = false;
        }
        
        // Validate steps
        if (workflowContent.steps) {
          for (let i = 0; i < workflowContent.steps.length; i++) {
            const step = workflowContent.steps[i];
            if (!step.name) {
              result.errors.push(`Step ${i + 1} missing required field: name`);
              result.isValid = false;
            }
            if (!step.command) {
              result.errors.push(`Step ${i + 1} missing required field: command`);
              result.isValid = false;
            }
          }
        }
        
      } catch (error) {
        result.errors.push(`Invalid JSON in workflow file: ${error instanceof Error ? error.message : String(error)}`);
        result.isValid = false;
      }
      
      return result;
    },
    catch: (error) => new Error(`Failed to validate workflow: ${error instanceof Error ? error.message : String(error)}`)
  });
}

function validateProviders(workingDir: string): Effect.Effect<{ isValid: boolean; errors: string[]; warnings: string[] }, Error> {
  return Effect.try({
    try: () => {
      const result = { isValid: true, errors: [] as string[], warnings: [] as string[] };
      
      // Check for provider files
      const genDir = join(workingDir, '.gen');
      if (!existsSync(genDir)) {
        result.warnings.push('No .gen directory found - consider running "tempeh provider generate"');
        return result;
      }
      
      // Check for provider configuration in cdktf.json
      const cdktfJsonPath = join(workingDir, 'cdktf.json');
      if (existsSync(cdktfJsonPath)) {
        try {
          const cdktfConfig = JSON.parse(readFileSync(cdktfJsonPath, 'utf-8'));
          if (!cdktfConfig.terraformProviders || cdktfConfig.terraformProviders.length === 0) {
            result.warnings.push('No providers configured in cdktf.json');
          }
        } catch (_error) {
          result.warnings.push('Could not read cdktf.json to validate providers');
        }
      }
      
      return result;
    },
    catch: (error) => new Error(`Failed to validate providers: ${error instanceof Error ? error.message : String(error)}`)
  });
}

// ============================================================================
// Main Validation Function
// ============================================================================

export function validate(options: ValidateOptions): Effect.Effect<void, Error> {
  return Effect.gen(function* (_) {
    const workingDir = options.workingDir || process.cwd();
    const stateFile = options.state || join(workingDir, 'terraform.tfstate');
    const workflowFile = options.workflow || join(workingDir, 'tempeh-workflow.json');
    
    yield* _(logger.info('🔍 Starting validation...'));
    
    const results = {
      cdktf: { isValid: true, errors: [] as string[], warnings: [] as string[] },
      state: { isValid: true, errors: [] as string[], warnings: [] as string[] },
      workflow: { isValid: true, errors: [] as string[], warnings: [] as string[] },
      providers: { isValid: true, errors: [] as string[], warnings: [] as string[] }
    };
    
    // Validate CDKTF configuration
    yield* _(logger.info('📋 Validating CDKTF configuration...'));
    results.cdktf = yield* _(validateCdktfConfig(workingDir));
    
    // Validate state file
    yield* _(logger.info('🗄️  Validating state file...'));
    results.state = yield* _(validateState(stateFile));
    
    // Validate workflow file
    yield* _(logger.info('⚡ Validating workflow configuration...'));
    results.workflow = yield* _(validateWorkflow(workflowFile));
    
    // Validate providers (if requested)
    if (options.providers) {
      yield* _(logger.info('📦 Validating providers...'));
      results.providers = yield* _(validateProviders(workingDir));
    }
    
    // Display results
    yield* _(logger.info('\n📊 Validation Results:'));
    yield* _(logger.info('='.repeat(50)));
    
    const allValid = results.cdktf.isValid && results.state.isValid && 
                    results.workflow.isValid && results.providers.isValid;
    
    // CDKTF Config
    yield* _(logger.info(`\n📋 CDKTF Configuration: ${results.cdktf.isValid ? '✅ Valid' : '❌ Invalid'}`));
    if (results.cdktf.errors.length > 0) {
      for (const error of results.cdktf.errors) {
        yield* _(logger.error(`   • ${error}`));
      }
    }
    if (results.cdktf.warnings.length > 0) {
      for (const warning of results.cdktf.warnings) {
        yield* _(logger.warn(`   • ${warning}`));
      }
    }
    
    // State
    yield* _(logger.info(`\n🗄️  State File: ${results.state.isValid ? '✅ Valid' : '❌ Invalid'}`));
    if (results.state.errors.length > 0) {
      for (const error of results.state.errors) {
        yield* _(logger.error(`   • ${error}`));
      }
    }
    if (results.state.warnings.length > 0) {
      for (const warning of results.state.warnings) {
        yield* _(logger.warn(`   • ${warning}`));
      }
    }
    
    // Workflow
    yield* _(logger.info(`\n⚡ Workflow Configuration: ${results.workflow.isValid ? '✅ Valid' : '❌ Invalid'}`));
    if (results.workflow.errors.length > 0) {
      for (const error of results.workflow.errors) {
        yield* _(logger.error(`   • ${error}`));
      }
    }
    if (results.workflow.warnings.length > 0) {
      for (const warning of results.workflow.warnings) {
        yield* _(logger.warn(`   • ${warning}`));
      }
    }
    
    // Providers
    if (options.providers) {
      yield* _(logger.info(`\n📦 Providers: ${results.providers.isValid ? '✅ Valid' : '❌ Invalid'}`));
      if (results.providers.errors.length > 0) {
        for (const error of results.providers.errors) {
          yield* _(logger.error(`   • ${error}`));
        }
      }
      if (results.providers.warnings.length > 0) {
        for (const warning of results.providers.warnings) {
          yield* _(logger.warn(`   • ${warning}`));
        }
      }
    }
    
    // Summary
    yield* _(logger.info('\n📊 Summary:'));
    yield* _(logger.info('='.repeat(50)));
    
    if (allValid) {
      yield* _(logger.info('✅ All validations passed!'));
    } else {
      yield* _(logger.error('❌ Some validations failed. Please review the errors above.'));
    }
    return Effect.succeed(undefined);
  });
}

// ============================================================================
// Command Registration
// ============================================================================

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('Validate CDKTF configuration, state, and workflows')
    .option('-w, --working-dir <path>', 'Working directory', process.cwd())
    .option('-s, --state <path>', 'Path to state file')
    .option('-f, --workflow <path>', 'Path to workflow file')
    .option('-p, --providers', 'Validate providers')
    .action(async (options: ValidateOptions) => {
      try {
        await Effect.runPromise(validate(options));
      } catch (error) {
        if (error instanceof TempehError) {
          console.error(`❌ ${error.message}`);
          if (error.suggestions) {
            console.error('\n💡 Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`   • ${suggestion}`);
            }
          }
        } else {
          console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exit(1);
      }
    });
}
