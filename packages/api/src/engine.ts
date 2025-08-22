// ============================================================================
// Engine Service Interfaces
// ============================================================================

import type * as Effect from 'effect/Effect';

// Generic types for engine interfaces
export interface StateManager {
  // Minimal interface for state management
  loadState(): Effect.Effect<StateInfo, Error>;
  saveState(state: StateInfo): Effect.Effect<void, Error>;
  createBackup(): Effect.Effect<string, Error>;
  restoreBackup(backupFile: string): Effect.Effect<StateInfo, Error>;
}

export interface StateInfo {
  version: string;
  terraformVersion: string;
  serial: number;
  lineage: string;
  resources: StateResource[];
  outputs: Record<string, unknown>;
}

export interface StateResource {
  type: string;
  name: string;
  module: string;
  provider: string;
  instances?: Array<{
    attributes: Record<string, unknown>;
    dependencies?: string[];
  }>;
}

// ============================================================================
// Base Engine Interface
// ============================================================================

export interface BaseEngine {
  readonly workingDir: string;
  readonly stateManager?: StateManager;
  
  /**
   * Initialize the engine with required resources
   */
  initialize(): Effect.Effect<void, Error>;
  
  /**
   * Validate the current state and configuration
   */
  validate(): Effect.Effect<ValidationResult, Error>;
  
  /**
   * Get engine status and health information
   */
  getStatus(): Effect.Effect<EngineStatus, Error>;
}

// ============================================================================
// CDKTF Engine Interface
// ============================================================================

export interface CdktfCommandOptions {
  stack?: string;
  autoApprove?: boolean;
  refresh?: boolean;
  target?: string[];
  var?: Record<string, string>;
  varFile?: string[];
  stateFile?: string;
}

export interface CdktfListResult {
  stacks: CdktfStack[];
}

export interface CdktfStack {
  name: string;
  status: 'active' | 'inactive' | 'error';
  outputs?: Record<string, unknown>;
}

export interface CdktfPlanResult {
  changes: {
    add: string[];
    change: string[];
    destroy: string[];
  };
  summary: string;
  rawOutput?: string;
}

export interface CdktfDeployResult {
  success: boolean;
  outputs: Record<string, unknown>;
  resources: string[];
  stateInfo?: StateInfo;
}

export interface CdktfEngine extends BaseEngine {
  /**
   * Deploy CDKTF stacks
   */
  deploy(options?: CdktfCommandOptions): Effect.Effect<CdktfDeployResult, Error>;
  
  /**
   * Destroy CDKTF stacks
   */
  destroy(options?: CdktfCommandOptions): Effect.Effect<CdktfDeployResult, Error>;
  
  /**
   * Generate deployment plan
   */
  plan(options?: CdktfCommandOptions): Effect.Effect<CdktfPlanResult, Error>;
  
  /**
   * Synthesize CDKTF code
   */
  synth(options?: CdktfCommandOptions): Effect.Effect<void, Error>;
  
  /**
   * Show differences between current and planned state
   */
  diff(options?: CdktfCommandOptions): Effect.Effect<CdktfPlanResult, Error>;
  
  /**
   * List available stacks
   */
  list(options?: CdktfCommandOptions): Effect.Effect<CdktfListResult, Error>;
}

// ============================================================================
// Provider Engine Interface
// ============================================================================

export interface ProviderInfo {
  name: string;
  version: string;
  source: string;
  constraints?: string;
}

export interface ProviderGenerationOptions {
  providers: ProviderInfo[];
  outputDir?: string;
  language?: 'typescript' | 'python' | 'java' | 'csharp' | 'go';
  force?: boolean;
}

export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  providers: ProviderInfo[];
}

export interface ProviderEngine extends BaseEngine {
  /**
   * Generate provider bindings
   */
  generateProviders(options: ProviderGenerationOptions): Effect.Effect<void, Error>;
  
  /**
   * Validate provider configuration
   */
  validateProviders(providers: ProviderInfo[]): Effect.Effect<ProviderValidationResult, Error>;
  
  /**
   * List available providers
   */
  listProviders(): Effect.Effect<ProviderInfo[], Error>;
  
  /**
   * Get provider schema
   */
  getProviderSchema(provider: ProviderInfo): Effect.Effect<unknown, Error>;
}

// ============================================================================
// Workflow Engine Interface
// ============================================================================

export interface WorkflowStep {
  name: string;
  description: string;
  command: string;
  args?: string[];
  options?: Record<string, unknown>;
}

export interface Workflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
  required?: boolean;
}

export interface WorkflowExecutionOptions {
  dryRun?: boolean;
  timeout?: number;
  parallel?: boolean;
  continueOnError?: boolean;
  rollbackOnError?: boolean;
}

export interface WorkflowExecutionResult {
  success: boolean;
  completedSteps: string[];
  failedSteps: string[];
  errors: string[];
  duration: number;
  rollbackPerformed?: boolean;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface WorkflowEngine extends BaseEngine {
  /**
   * Execute a workflow
   */
  executeWorkflow(workflow: Workflow, options?: WorkflowExecutionOptions): Effect.Effect<WorkflowExecutionResult, Error>;
  
  /**
   * Validate a workflow
   */
  validateWorkflow(workflow: Workflow): Effect.Effect<WorkflowValidationResult, Error>;
  
  /**
   * List available workflows
   */
  listWorkflows(): Effect.Effect<Workflow[], Error>;
  
  /**
   * Get workflow by name
   */
  getWorkflow(name: string): Effect.Effect<Workflow | null, Error>;
}

// ============================================================================
// Project Engine Interface
// ============================================================================

export interface ProjectInfo {
  name: string;
  type: 'cdktf' | 'terraform' | 'unknown';
  config?: unknown;
  tempehConfig?: unknown;
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

export interface ProjectEngine extends BaseEngine {
  /**
   * Scan for projects in a directory
   */
  scanForProjects(directory?: string): Effect.Effect<ProjectScanResult, Error>;
  
  /**
   * Analyze a specific project
   */
  analyzeProject(projectPath: string): Effect.Effect<ProjectInfo, Error>;
  
  /**
   * Validate a project
   */
  validateProject(projectPath: string): Effect.Effect<ProjectValidationResult, Error>;
  
  /**
   * Get project summary
   */
  getProjectSummary(projectPath: string): Effect.Effect<string, Error>;
}

// ============================================================================
// State Engine Interface
// ============================================================================

export interface StateAnalysis {
  totalResources: number;
  resourceTypes: Record<string, number>;
  modules: string[];
  outputs: string[];
  terraformVersion: string;
  stateVersion: number;
}



export interface StateEngine extends BaseEngine {
  /**
   * Load state from file
   */
  loadState(): Effect.Effect<StateInfo, Error>;
  
  /**
   * Save state to file
   */
  saveState(state: StateInfo): Effect.Effect<void, Error>;
  
  /**
   * Create state backup
   */
  createBackup(): Effect.Effect<string, Error>;
  
  /**
   * Restore state from backup
   */
  restoreBackup(backupFile: string): Effect.Effect<StateInfo, Error>;
  
  /**
   * Analyze state
   */
  analyzeState(): Effect.Effect<StateAnalysis, Error>;
  
  /**
   * Find resources in state
   */
  findResources(filter: {
    type?: string;
    module?: string;
    name?: string;
  }): Effect.Effect<StateResource[], Error>;
  
  /**
   * Get state outputs
   */
  getOutputs(): Effect.Effect<Record<string, unknown>, Error>;
  
  /**
   * Get specific output
   */
  getOutput(name: string): Effect.Effect<unknown, Error>;
}

// ============================================================================
// Common Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EngineStatus {
  status: 'ready' | 'initializing' | 'error' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
}

export interface EngineError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
}

// ============================================================================
// Engine Factory Interface
// ============================================================================

export interface EngineFactory {
  createCdktfEngine(workingDir: string, stateManager?: StateManager): CdktfEngine;
  createProviderEngine(workingDir: string): ProviderEngine;
  createWorkflowEngine(cdktfEngine: CdktfEngine, stateManager: StateManager): WorkflowEngine;
  createProjectEngine(workingDir: string): ProjectEngine;
  createStateEngine(workingDir: string, stateManager: StateManager): StateEngine;
}
