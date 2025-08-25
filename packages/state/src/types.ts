
export interface StateAnalysis {
  totalResources: number;
  resourceTypes: Record<string, number>;
  modules: string[];
  outputs: string[];
  terraformVersion: string;
  stateVersion: number;
}

export interface ResourceFilter {
  type?: string;
  module?: string;
  name?: string;
}

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  resource?: string;
  module?: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    totalResources: number;
    totalOutputs: number;
    totalModules: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}