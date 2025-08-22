// ============================================================================
// Project Types
// ============================================================================

export interface ProjectInfo {
  name: string;
  type: 'cdktf' | 'terraform' | 'unknown';
  config?: CdktfConfig;
  tempehConfig?: TempehConfig;
  hasState: boolean;
  hasOutputs: boolean;
  workingDirectory: string;
}

export interface ProjectScanResult {
  projects: ProjectInfo[];
  totalProjects: number;
  cdktfProjects: number;
  terraformProjects: number;
}

export interface ProjectValidationResult {
  isValid: boolean;
  issues: string[];
}

// ============================================================================
// Project Configuration Types
// ============================================================================

export interface CdktfConfig {
  language: 'typescript' | 'python' | 'java' | 'csharp' | 'go';
  app: string;
  output: string;
  codeMakerOutput: string;
  projectId: string;
  sendCrashReports: boolean;
  terraformProviders?: string[];
  terraformModules?: string[];
}

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
// Project Analysis Types
// ============================================================================

export interface ProjectAnalysis {
  name: string;
  type: 'cdktf' | 'terraform' | 'unknown';
  hasState: boolean;
  hasOutputs: boolean;
  hasTempehConfig: boolean;
  configSummary?: string;
  issues: string[];
}

export interface ProjectSummary {
  name: string;
  type: 'cdktf' | 'terraform' | 'unknown';
  directory: string;
  hasState: boolean;
  hasOutputs: boolean;
  cdktfConfig?: CdktfConfigSummary;
  tempehConfig?: TempehConfigSummary;
}

export interface CdktfConfigSummary {
  language: string;
  app: string;
  output: string;
  projectId: string;
}

export interface TempehConfigSummary {
  version: string;
  workingDir: string;
  stateFile: string;
}

// ============================================================================
// Project Discovery Types
// ============================================================================

export interface ProjectDiscoveryOptions {
  directory?: string;
  recursive?: boolean;
  maxDepth?: number;
  includeHidden?: boolean;
}

export interface ProjectDiscoveryResult {
  projects: ProjectInfo[];
  scannedDirectories: string[];
  totalDirectories: number;
  totalProjects: number;
  errors: string[];
}
