import * as Effect from 'effect/Effect';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { logger } from './logger';
import { TempehError } from '@tempeh/types';
import type {
  TempehConfig,
  ValidationRule,
  ValidationSchema,
  ValidationResult,
  ConfigurationValidationError,
  ValidationWarning,
  ConfigurationValidationContext,
  ValidationReport
} from '@tempeh/types';

// ============================================================================
// Configuration Validator
// ============================================================================

export class ConfigurationValidator {
  private validationSchemas: Map<string, ValidationSchema> = new Map();
  private customValidators: Map<string, (value: unknown, context: ConfigurationValidationContext) => boolean | string> = new Map();

  constructor() {
    this.registerDefaultSchemas();
    this.registerCustomValidators();
  }

  // ============================================================================
  // Core Validation Methods
  // ============================================================================

  validateConfiguration(
    config: TempehConfig,
    context: ConfigurationValidationContext
  ): Effect.Effect<ValidationReport, TempehError> {
    return Effect.gen(this, function* (_) {
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;

      yield* _(logger.info('Starting configuration validation...'));

      // Validate basic structure
      const basicValidation = this.validateBasicStructure(config);
      
      // Validate against schema
      const schemaValidation = this.validateAgainstSchema(config);
      
      // Validate cross-field dependencies
      const dependencyValidation = this.validateCrossFieldDependencies(config);
      
      // Validate environment-specific rules
      const environmentValidation = this.validateEnvironmentSpecificRules(config, context);
      
      // Validate file system references
      const filesystemValidation = yield* _(this.validateFilesystemReferences(config, context));
      
      // Validate security and permissions
      const securityValidation = this.validateSecuritySettings(config, context);

      // Combine all validation results
      const combinedResult = this.combineValidationResults([
        basicValidation,
        schemaValidation,
        dependencyValidation,
        environmentValidation,
        filesystemValidation,
        securityValidation
      ]);

      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      const validationTime = endTime - startTime;
      const memoryUsage = (endMemory - startMemory) / 1024 / 1024; // Convert to MB

      const report: ValidationReport = {
        timestamp: new Date(),
        configPath: context.configPath,
        validationLevel: context.validationLevel,
        summary: {
          totalFields: this.countTotalFields(config),
          validatedFields: this.countValidatedFields(combinedResult),
          errors: combinedResult.errors.length,
          warnings: combinedResult.warnings.length,
          suggestions: combinedResult.suggestions.length
        },
        results: combinedResult,
        performance: {
          validationTimeMs: validationTime,
          memoryUsageMb: memoryUsage
        }
      };

      yield* _(logger.info(
        `Configuration validation completed in ${validationTime}ms (${memoryUsage.toFixed(2)}MB)`
      ));

      return report;
    }).pipe(
      Effect.catchAll((error) => {
        return Effect.fail(new TempehError({
          code: 'CONFIG_VALIDATION_ERROR',
          message: 'Configuration validation failed',
          suggestions: [
            'Check the configuration file format',
            'Verify all required fields are present',
            'Review validation error details'
          ],
          context: { configPath: context.configPath, error }
        }));
      })
    );
  }

  // ============================================================================
  // Validation Schema Management
  // ============================================================================

  registerSchema(name: string, schema: ValidationSchema): void {
    this.validationSchemas.set(name, schema);
  }

  getSchema(name: string): ValidationSchema | undefined {
    return this.validationSchemas.get(name);
  }

  private registerDefaultSchemas(): void {
    // Tempeh configuration schema
    const tempehConfigSchema: ValidationSchema = {
      rules: [
        {
          field: 'version',
          type: 'required',
          message: 'Configuration version is required'
        },
        {
          field: 'version',
          type: 'string',
          message: 'Version must be a string'
        },
        {
          field: 'version',
          type: 'regex',
          pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.-]+)?(\\+[a-zA-Z0-9.-]+)?$',
          message: 'Version must follow semantic versioning format'
        },
        {
          field: 'defaults.workingDir',
          type: 'path',
          message: 'Working directory must be a valid path'
        },
        {
          field: 'defaults.stateFile',
          type: 'path',
          message: 'State file path must be valid'
        },
        {
          field: 'defaults.verbose',
          type: 'boolean',
          message: 'Verbose flag must be a boolean'
        }
      ],
      nested: {
        defaults: {
          rules: [
            {
              field: 'workingDir',
              type: 'required',
              message: 'Working directory is required'
            },
            {
              field: 'stateFile',
              type: 'required',
              message: 'State file path is required'
            }
          ]
        },
        workflows: {
          rules: [
            {
              field: 'workflows',
              type: 'object',
              message: 'Workflows must be an object'
            }
          ]
        },
        aliases: {
          rules: [
            {
              field: 'aliases',
              type: 'object',
              message: 'Aliases must be an object'
            }
          ]
        }
      }
    };

    this.registerSchema('tempeh-config', tempehConfigSchema);
  }

  // ============================================================================
  // Custom Validators
  // ============================================================================

  registerCustomValidator(
    name: string,
    validator: (value: unknown, context: ConfigurationValidationContext) => boolean | string
  ): void {
    this.customValidators.set(name, validator);
  }

  private registerCustomValidators(): void {
    // Working directory validator
    this.registerCustomValidator('working-directory', (value) => {
      if (typeof value !== 'string') return 'Working directory must be a string';
      
      const resolvedPath = resolve(value);
      if (!existsSync(resolvedPath)) {
        return 'Working directory does not exist';
      }
      
      try {
        const stats = readFileSync(resolvedPath, 'utf-8');
        if (!stats) {
          return 'Working directory is not readable';
        }
      } catch {
        return 'Working directory is not accessible';
      }
      
      return true;
    });

    // State file validator
    this.registerCustomValidator('state-file', (value, context) => {
      if (typeof value !== 'string') return 'State file path must be a string';
      
      const statePath = join(context.workingDirectory, value);
      const stateDir = join(statePath, '..');
      
      if (!existsSync(stateDir)) {
        return 'State file directory does not exist';
      }
      
      return true;
    });

    // Workflow validator
    this.registerCustomValidator('workflow-config', (value) => {
      if (typeof value !== 'object' || value === null) {
        return 'Workflow configuration must be an object';
      }
      
      const workflow = value as Record<string, unknown>;
      
      if (!workflow.name || typeof workflow.name !== 'string') {
        return 'Workflow must have a valid name';
      }
      
      if (!workflow.steps || !Array.isArray(workflow.steps)) {
        return 'Workflow must have steps array';
      }
      
      return true;
    });
  }

  // ============================================================================
  // Validation Implementation Methods
  // ============================================================================

  private validateBasicStructure(config: TempehConfig): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Check for required top-level fields
    if (!config) {
      errors.push({
        field: 'config',
        value: config,
        message: 'Configuration object is required',
        severity: 'critical',
        code: 'MISSING_CONFIG'
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    if (!config.version) {
      errors.push({
        field: 'version',
        value: config.version,
        message: 'Configuration version is required',
        severity: 'critical',
        code: 'MISSING_VERSION'
      });
    }

    if (!config.defaults) {
      errors.push({
        field: 'defaults',
        value: config.defaults,
        message: 'Default configuration is required',
        severity: 'critical',
        code: 'MISSING_DEFAULTS'
      });
    }

    // Check for deprecated fields
    const configWithExtras = config as TempehConfig & { legacyField?: unknown };
    if (configWithExtras.legacyField) {
      warnings.push({
        field: 'legacyField',
        value: configWithExtras.legacyField,
        message: 'Legacy field is deprecated and will be removed in future versions',
        code: 'DEPRECATED_FIELD',
        suggestions: ['Use the new fieldName instead']
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private validateAgainstSchema(config: TempehConfig): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    const schema = this.getSchema('tempeh-config');
    if (!schema) {
      warnings.push({
        field: 'schema',
        value: 'tempeh-config',
        message: 'No validation schema found for configuration',
        code: 'NO_SCHEMA'
      });
      return { isValid: true, errors, warnings, suggestions };
    }

    // Validate against schema rules
    for (const rule of schema.rules) {
      const value = this.getNestedValue(config, rule.field);
      const validationResult = this.validateField(value, rule);
      
      if (validationResult.error) {
        const error: ConfigurationValidationError = {
          field: rule.field,
          value,
          message: validationResult.error,
          severity: 'error',
          code: `INVALID_${rule.type.toUpperCase()}`
        };
        if (validationResult.suggestions) {
          error.suggestions = validationResult.suggestions;
        }
        errors.push(error);
      }
    }

    // Validate nested schemas
    if (schema.nested) {
      for (const [nestedKey, nestedSchema] of Object.entries(schema.nested)) {
        const nestedValue = (config as any)[nestedKey];
        if (nestedValue !== undefined) {
          const nestedResult = this.validateNestedObject(nestedValue, nestedSchema, nestedKey);
          errors.push(...nestedResult.errors);
          warnings.push(...nestedResult.warnings);
          suggestions.push(...nestedResult.suggestions);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private validateCrossFieldDependencies(config: TempehConfig): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Example: If verbose is true, ensure log level is set
    const configWithLogging = config as TempehConfig & { logging?: { level?: string } };
    if (config.defaults?.verbose && !configWithLogging.logging?.level) {
      warnings.push({
        field: 'logging.level',
        value: undefined,
        message: 'Log level should be set when verbose mode is enabled',
        code: 'MISSING_LOG_LEVEL',
        suggestions: ['Set logging.level to "debug" or "info" for better verbose output']
      });
    }

    // Example: If workflows are defined, ensure they have valid structure
    if (config.workflows && Object.keys(config.workflows).length > 0) {
      for (const [workflowName, workflow] of Object.entries(config.workflows)) {
        if (typeof workflow === 'object' && workflow !== null) {
          const workflowObj = workflow as Record<string, unknown>;
          if (!workflowObj.steps || !Array.isArray(workflowObj.steps)) {
            errors.push({
              field: `workflows.${workflowName}.steps`,
              value: workflowObj.steps,
              message: `Workflow "${workflowName}" must have a steps array`,
              severity: 'error',
              code: 'INVALID_WORKFLOW_STRUCTURE'
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private validateEnvironmentSpecificRules(config: TempehConfig, context: ConfigurationValidationContext): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Environment-specific validations
    if (context.environment === 'production') {
      // Production-specific rules
      if (config.defaults?.verbose) {
        warnings.push({
          field: 'defaults.verbose',
          value: config.defaults.verbose,
          message: 'Verbose logging is not recommended in production',
          code: 'PRODUCTION_VERBOSE_WARNING',
          suggestions: ['Set verbose to false in production environments']
        });
      }

      const configWithSecurity = config as TempehConfig & { security?: { encryption?: boolean } };
      if (!configWithSecurity.security?.encryption) {
        warnings.push({
          field: 'security.encryption',
          value: undefined,
          message: 'Encryption should be enabled in production',
          code: 'PRODUCTION_ENCRYPTION_WARNING',
          suggestions: ['Enable encryption for sensitive data in production']
        });
      }
    }

    if (context.environment === 'development') {
      // Development-specific rules
      if (!config.defaults?.verbose) {
        suggestions.push('Consider enabling verbose mode in development for better debugging');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private validateFilesystemReferences(config: TempehConfig, context: ConfigurationValidationContext): Effect.Effect<ValidationResult, TempehError> {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Validate working directory
    if (config.defaults?.workingDir) {
      const workingDirValidator = this.customValidators.get('working-directory');
      if (workingDirValidator) {
        const result = workingDirValidator(config.defaults.workingDir, context);
        if (result !== true) {
          errors.push({
            field: 'defaults.workingDir',
            value: config.defaults.workingDir,
            message: result as string,
            severity: 'error',
            code: 'INVALID_WORKING_DIRECTORY'
          });
        }
      }
    }

    // Validate state file path
    if (config.defaults?.stateFile) {
      const stateFileValidator = this.customValidators.get('state-file');
      if (stateFileValidator) {
        const result = stateFileValidator(config.defaults.stateFile, context);
        if (result !== true) {
          errors.push({
            field: 'defaults.stateFile',
            value: config.defaults.stateFile,
            message: result as string,
            severity: 'error',
            code: 'INVALID_STATE_FILE'
          });
        }
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
    return result.isValid ?
      Effect.succeed(result) :
      Effect.fail(new TempehError({
        code: 'INVALID_STATE_FILE_PATH',
        message: `Unexpected filesystem error when loading ${config.defaults?.stateFile}`,
      }));
  }

  private validateSecuritySettings(config: TempehConfig, context: ConfigurationValidationContext): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    // Check for sensitive information in configuration
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'credential'];
    const configString = JSON.stringify(config).toLowerCase();
    
    for (const field of sensitiveFields) {
      if (configString.includes(field)) {
        warnings.push({
          field: 'security',
          value: 'sensitive_data_detected',
          message: `Potential sensitive data detected in configuration (${field})`,
          code: 'SENSITIVE_DATA_WARNING',
          suggestions: [
            'Use environment variables for sensitive data',
            'Consider using a secrets management system',
            'Review configuration for hardcoded secrets'
          ]
        });
      }
    }

    // Check for insecure defaults
    if (context.validationLevel === 'strict') {
      if ((config as any).security?.allowInsecureConnections) {
        errors.push({
          field: 'security.allowInsecureConnections',
          value: (config as any).security?.allowInsecureConnections,
          message: 'Insecure connections are not allowed in strict mode',
          severity: 'error',
          code: 'INSECURE_CONNECTION_ERROR'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private validateField(
    value: unknown,
    rule: ValidationRule
  ): { error?: string; suggestions?: string[] } {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return { error: rule.message || 'Field is required' };
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          return { error: rule.message || 'Field must be a string' };
        }
        if (rule.minLength && value.length < rule.minLength) {
          return { error: `Minimum length is ${rule.minLength} characters` };
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return { error: `Maximum length is ${rule.maxLength} characters` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return { error: rule.message || 'Field must be a number' };
        }
        if (rule.minValue !== undefined && value < rule.minValue) {
          return { error: `Minimum value is ${rule.minValue}` };
        }
        if (rule.maxValue !== undefined && value > rule.maxValue) {
          return { error: `Maximum value is ${rule.maxValue}` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { error: rule.message || 'Field must be a boolean' };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return { error: rule.message || 'Field must be an array' };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return { error: rule.message || 'Field must be an object' };
        }
        break;

      case 'enum':
        if (!rule.allowedValues?.includes(value as string)) {
          const result: { error?: string; suggestions?: string[] } = {
            error: rule.message || `Must be one of: ${rule.allowedValues?.join(', ')}`
          };
          if (rule.allowedValues) {
            result.suggestions = rule.allowedValues.map(v => `Use "${v}"`);
          }
          return result;
        }
        break;

      case 'regex':
        if (typeof value === 'string' && rule.pattern) {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(value)) {
            return { error: rule.message || `Must match pattern: ${rule.pattern}` };
          }
        }
        break;

      case 'custom':
        if (rule.customValidator) {
          const result = rule.customValidator(value);
          if (result !== true) {
            return { error: result as string };
          }
        }
        break;
    }

    return {};
  }

  private validateNestedObject(
    obj: unknown,
    schema: ValidationSchema,
    parentField: string
  ): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    if (typeof obj !== 'object' || obj === null) {
      errors.push({
        field: parentField,
        value: obj,
        message: 'Must be an object',
        severity: 'error',
        code: 'INVALID_OBJECT_TYPE'
      });
      return { isValid: false, errors, warnings, suggestions };
    }

    for (const rule of schema.rules) {
      const value = (obj as Record<string, unknown>)[rule.field];
      const validationResult = this.validateField(value, rule);
      
      if (validationResult.error) {
        const error: ConfigurationValidationError = {
          field: `${parentField}.${rule.field}`,
          value,
          message: validationResult.error,
          severity: 'error',
          code: `INVALID_${rule.type.toUpperCase()}`
        };
        if (validationResult.suggestions) {
          error.suggestions = validationResult.suggestions;
        }
        errors.push(error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  private combineValidationResults(results: ValidationResult[]): ValidationResult {
    const errors: ConfigurationValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: string[] = [];

    for (const result of results) {
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      suggestions.push(...result.suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private countTotalFields(config: TempehConfig): number {
    let count = 0;
    const countFields = (obj: unknown): void => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        count += Object.keys(obj).length;
        for (const value of Object.values(obj)) {
          countFields(value);
        }
      }
    };
    countFields(config);
    return count;
  }

  private countValidatedFields(result: ValidationResult): number {
    return result.errors.length + result.warnings.length;
  }
}
