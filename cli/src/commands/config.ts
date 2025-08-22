import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigurationValidator } from '@tempeh/utils';
import { TempehError } from '@tempeh/types';
import type { TempehConfig, ConfigurationValidationContext } from '@tempeh/types';
import { runEffectResult } from '../utils/effect-wrapper';

interface ValidationReport {
  results: {
    isValid: boolean;
    errors: Array<{ code: string; field: string; message: string; suggestions?: string[] }>;
    warnings: Array<{ field: string; message: string; suggestions?: string[] }>;
    suggestions: string[];
  };
  summary: {
    totalFields: number;
    validatedFields: number;
    errors: number;
    warnings: number;
    suggestions: number;
  };
  performance: {
    validationTimeMs: number;
    memoryUsageMb: number;
  };
  timestamp: Date;
  configPath: string;
  validationLevel: string;
}

export function createConfigCommand(): Command {
  const command = new Command('config')
    .description('Manage and validate Tempeh configuration');

  command
    .command('validate')
    .description('Validate configuration file')
    .option('-f, --file <path>', 'Configuration file path', 'tempeh.json')
    .option('-e, --environment <env>', 'Environment for validation', 'development')
    .option('-l, --level <level>', 'Validation level', 'normal')
    .option('--json', 'Output results in JSON format')
    .option('--report', 'Generate detailed validation report')
    .option('--fix', 'Attempt to fix common configuration issues')
    .action(async (options) => {
      try {
        const configPath = resolve(options.file);
        
        if (!existsSync(configPath)) {
          throw new TempehError({
            code: 'CONFIG_FILE_NOT_FOUND',
            message: `Configuration file not found: ${configPath}`,
            suggestions: [
              'Check if the configuration file exists',
              'Use --file to specify a different configuration file',
              'Create a configuration file using "tempeh config create"'
            ]
          });
        }

        // Load configuration
        const configContent = readFileSync(configPath, 'utf-8');
        let config: TempehConfig;
        
        try {
          config = JSON.parse(configContent);
        } catch (parseError) {
          throw new TempehError({
            code: 'INVALID_JSON',
            message: 'Configuration file contains invalid JSON',
            suggestions: [
              'Check the JSON syntax',
              'Use a JSON validator to identify issues',
              'Review the configuration file format'
            ],
            context: { configPath, error: parseError }
          });
        }

        // Initialize validator
        const validator = new ConfigurationValidator();
        
        // Create validation context
        const context: ConfigurationValidationContext = {
          configPath,
          environment: options.environment,
          workingDirectory: process.cwd(),
          validationLevel: options.level as 'strict' | 'normal' | 'lenient'
        };

        console.log(`Validating configuration: ${configPath}`);
        console.log(`Environment: ${context.environment}`);
        console.log(`Validation level: ${context.validationLevel}`);

        // Perform validation
        const reportResult = await runEffectResult(validator.validateConfiguration(config, context) as any);
        const report = reportResult as unknown as ValidationReport;

        // Display results
        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          displayValidationResults(report, options.report);
        }

        // Handle fix option
        if (options.fix && !report.results.isValid) {
          console.log('Attempting to fix configuration issues...');
          const fixedConfig = attemptConfigurationFix(config, report);
          
          if (fixedConfig) {
            writeFileSync(configPath, JSON.stringify(fixedConfig, null, 2));
            console.log(`Configuration fixed and saved to: ${configPath}`);
          }
        }

        // Exit with error code if validation failed
        if (!report.results.isValid) {
          process.exit(1);
        }

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

  command
    .command('create')
    .description('Create a sample configuration file')
    .option('-f, --file <path>', 'Output file path', 'tempeh.json')
    .option('-e, --environment <env>', 'Target environment', 'development')
    .action(async (options) => {
      try {
        const sampleConfig: TempehConfig = {
          version: '1.0.0',
          defaults: {
            workingDir: process.cwd(),
            stateFile: 'terraform.tfstate',
            verbose: options.environment === 'development'
          },
          workflows: {
            'sample-workflow': {
              name: 'sample-workflow',
              description: 'A sample workflow configuration',
              steps: [
                {
                  name: 'plan',
                  description: 'Create deployment plan',
                  command: 'plan'
                },
                {
                  name: 'deploy',
                  description: 'Deploy infrastructure',
                  command: 'deploy',
                  dependsOn: ['plan']
                }
              ]
            }
          },
          aliases: {
            'deploy': 'workflow run deploy-workflow',
            'plan': 'workflow run plan-workflow'
          }
        };

        // Add environment-specific configurations
        if (options.environment === 'production') {
          (sampleConfig as TempehConfig & { security?: Record<string, unknown>; logging?: Record<string, unknown> }).security = {
            encryption: true,
            allowInsecureConnections: false
          };
          (sampleConfig as TempehConfig & { security?: Record<string, unknown>; logging?: Record<string, unknown> }).logging = {
            level: 'info',
            file: 'tempeh.log'
          };
        }

        // Write configuration file
        writeFileSync(options.file, JSON.stringify(sampleConfig, null, 2));

        console.log(`✅ Sample configuration created: ${options.file}`);
        console.log('\n📋 Configuration includes:');
        console.log('   • Basic Tempeh settings');
        console.log('   • Sample workflow definition');
        console.log('   • Command aliases');
        
        if (options.environment === 'production') {
          console.log('   • Production security settings');
          console.log('   • Logging configuration');
        }
        
        console.log('\n💡 Edit the configuration file to customize it for your needs');
        console.log('🔍 Validate the configuration with: tempeh config validate');

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

  command
    .command('schema')
    .description('Generate configuration schema')
    .option('-f, --file <path>', 'Output schema file path', 'tempeh-schema.json')
    .option('--format <format>', 'Schema format (json, yaml)', 'json')
    .action(async (options) => {
      try {
        const validator = new ConfigurationValidator();
        const schema = validator.getSchema('tempeh-config');
        
        if (!schema) {
          throw new TempehError({
            code: 'SCHEMA_NOT_FOUND',
            message: 'Configuration schema not found',
            suggestions: ['Check if the validator is properly initialized']
          });
        }

        let output: string;
        
        if (options.format === 'yaml') {
          const yaml = require('js-yaml');
          output = yaml.dump(schema);
        } else {
          output = JSON.stringify(schema, null, 2);
        }

        writeFileSync(options.file, output);

        console.log(`✅ Configuration schema generated: ${options.file}`);
        console.log(`📋 Format: ${options.format.toUpperCase()}`);
        console.log('\n💡 Use this schema to validate configuration files in your IDE or CI/CD pipeline');

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

  return command;
}

// ============================================================================
// Helper Functions
// ============================================================================

function displayValidationResults(report: ValidationReport, detailed: boolean): void {
  const { results, summary, performance } = report;
  
  console.log('\n🔍 Configuration Validation Report');
  console.log('='.repeat(50));
  console.log(`📅 Timestamp: ${report.timestamp.toISOString()}`);
  console.log(`📁 Config Path: ${report.configPath}`);
  console.log(`🔧 Validation Level: ${report.validationLevel}`);
  
  console.log('\n📊 Summary:');
  console.log(`   📋 Total Fields: ${summary.totalFields}`);
  console.log(`   ✅ Validated Fields: ${summary.validatedFields}`);
  console.log(`   ❌ Errors: ${summary.errors}`);
  console.log(`   ⚠️  Warnings: ${summary.warnings}`);
  console.log(`   💡 Suggestions: ${summary.suggestions}`);
  
  console.log('\n⚡ Performance:');
  console.log(`   ⏱️  Validation Time: ${performance.validationTimeMs}ms`);
  console.log(`   💾 Memory Usage: ${performance.memoryUsageMb.toFixed(2)}MB`);

  // Display errors
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const error of results.errors) {
      console.log(`   🔴 ${error.field}: ${error.message}`);
      if (error.suggestions) {
        for (const suggestion of error.suggestions) {
          console.log(`      💡 ${suggestion}`);
        }
      }
    }
  }

  // Display warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of results.warnings) {
      console.log(`   🟡 ${warning.field}: ${warning.message}`);
      if (warning.suggestions) {
        for (const suggestion of warning.suggestions) {
          console.log(`      💡 ${suggestion}`);
        }
      }
    }
  }

  // Display suggestions
  if (results.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    for (const suggestion of results.suggestions) {
      console.log(`   💭 ${suggestion}`);
    }
  }

  // Overall result
  console.log('\n🎯 Result:');
  if (results.isValid) {
    console.log('   ✅ Configuration is valid');
  } else {
    console.log('   ❌ Configuration has validation errors');
  }

  if (detailed) {
    console.log('\n📋 Detailed Report:');
    console.log(JSON.stringify(report, null, 2));
  }
}

function attemptConfigurationFix(config: TempehConfig, report: ValidationReport): TempehConfig | null {
  const fixedConfig = { ...config };
  let hasFixes = false;

  // Fix common issues
  for (const error of report.results.errors) {
    switch (error.code) {
      case 'MISSING_VERSION':
        fixedConfig.version = '1.0.0';
        hasFixes = true;
        break;
        
      case 'MISSING_DEFAULTS':
        fixedConfig.defaults = {
          workingDir: process.cwd(),
          stateFile: 'terraform.tfstate',
          verbose: false
        };
        hasFixes = true;
        break;
        
      case 'INVALID_WORKING_DIRECTORY':
        fixedConfig.defaults = {
          ...fixedConfig.defaults,
          workingDir: process.cwd()
        };
        hasFixes = true;
        break;
        
      case 'INVALID_STATE_FILE':
        fixedConfig.defaults = {
          ...fixedConfig.defaults,
          stateFile: 'terraform.tfstate'
        };
        hasFixes = true;
        break;
    }
  }

  return hasFixes ? fixedConfig : null;
}
