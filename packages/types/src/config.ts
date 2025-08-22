// ============================================================================
// Configuration Types
// ============================================================================

export interface TempehConfig {
  version: string;
  defaults: {
    workingDir: string;
    stateFile: string;
    verbose: boolean;
  };
  workflows: Record<string, unknown>;
  aliases: Record<string, string>;
}

// ============================================================================
// Enhanced Configuration Validation Types
// ============================================================================

export interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum' | 'path' | 'url' | 'email' | 'regex' | 'custom';
  message?: string;
  allowedValues?: readonly string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  customValidator?: (value: unknown) => boolean | string;
}

export interface ValidationSchema {
  rules: ValidationRule[];
  nested?: Record<string, ValidationSchema>;
  arraySchema?: ValidationSchema;
  optional?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ConfigurationValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ConfigurationValidationError {
  field: string;
  value: unknown;
  message: string;
  severity: 'error' | 'critical';
  code: string;
  suggestions?: string[];
}

export interface ValidationWarning {
  field: string;
  value: unknown;
  message: string;
  code: string;
  suggestions?: string[];
}

export interface ConfigurationValidationContext {
  configPath: string;
  environment: string;
  workingDirectory: string;
  validationLevel: 'strict' | 'normal' | 'lenient';
}

export interface ValidationReport {
  timestamp: Date;
  configPath: string;
  validationLevel: string;
  summary: {
    totalFields: number;
    validatedFields: number;
    errors: number;
    warnings: number;
    suggestions: number;
  };
  results: ValidationResult;
  performance: {
    validationTimeMs: number;
    memoryUsageMb: number;
  };
}
