// ============================================================================
// Workflow Types
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

// ============================================================================
// Workflow Execution Types
// ============================================================================

export interface WorkflowExecutionOptions {
  dryRun?: boolean;
  timeout?: number;
  parallel?: boolean;
  maxConcurrency?: number; // Maximum number of steps to run in parallel
  continueOnError?: boolean;
  rollbackOnError?: boolean;
  saveCheckpoints?: boolean;
  checkpointDir?: string;
  resumeFromCheckpoint?: string;
  allowManualIntervention?: boolean;
  maxManualInterventions?: number;
}

export interface WorkflowExecutionResult {
  success: boolean;
  completedSteps: string[];
  failedSteps: string[];
  errors: string[];
  duration: number;
  rollbackPerformed?: boolean;
  rollbackDetails?: RollbackExecutionDetails;
  checkpointsSaved?: string[];
  resumedFromCheckpoint?: string;
  manualInterventionsRequested?: number;
  parallelExecutionStats?: ParallelExecutionStats;
}

export interface RollbackExecutionDetails {
  executed: boolean;
  success: boolean;
  steps: string[];
  failedSteps: string[];
  duration: number;
  errors: string[];
  warnings: string[];
}

export interface ParallelExecutionStats {
  totalSteps: number;
  parallelSteps: number;
  maxConcurrentSteps: number;
  averageConcurrency: number;
  parallelGroups: ParallelGroupStats[];
}

export interface ParallelGroupStats {
  groupName?: string;
  stepCount: number;
  duration: number;
  success: boolean;
}

// ============================================================================
// CDKTF Workflow Types
// ============================================================================

export interface CdktfWorkflowStep extends WorkflowStep {
  cdktfOptions?: {
    stack?: string;
    autoApprove?: boolean;
    refresh?: boolean;
    target?: string[];
    var?: Record<string, string>;
    varFile?: string[];
  };
  condition?: {
    type: 'file-exists' | 'state-has-resource' | 'output-equals' | 'custom';
    value: string | Record<string, unknown>;
  };
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier?: number;
  };
  dependsOn?: string[]; // Step names this step depends on
  parallelGroup?: string; // Steps in the same parallel group can run together
  timeout?: number; // Step timeout in milliseconds
}

export interface CdktfWorkflow extends Workflow {
  steps: CdktfWorkflowStep[];
  preHooks?: CdktfWorkflowStep[];
  postHooks?: CdktfWorkflowStep[];
  rollbackSteps?: CdktfWorkflowStep[];
  rollbackStrategy?: RollbackStrategy;
}

// ============================================================================
// Workflow Validation Types
// ============================================================================

export interface WorkflowValidationResult {
  isValid: boolean;
  issues: string[];
}

// ============================================================================
// Workflow Configuration Types
// ============================================================================

export interface WorkflowStepCondition {
  type: 'file-exists' | 'state-has-resource' | 'output-equals' | 'custom';
  value: string | Record<string, unknown>;
}

export interface WorkflowStepRetry {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  strategy?: 'linear' | 'exponential' | 'fixed';
  maxDelayMs?: number;
  retryOnCodes?: string[];
  jitter?: boolean;
}

export interface WorkflowHookOptions {
  continueOnFailure?: boolean;
  timeout?: number;
}

// ============================================================================
// Error Recovery Types
// ============================================================================

export interface WorkflowCheckpoint {
  id: string;
  workflowName: string;
  stepIndex: number;
  stepName: string;
  timestamp: Date;
  state: Record<string, unknown>;
  completedSteps: string[];
  failedSteps: string[];
}

export interface WorkflowErrorContext {
  step: CdktfWorkflowStep;
  stepIndex: number;
  error: Error;
  attemptNumber: number;
  previousErrors: Error[];
  workflowState: Record<string, unknown>;
}

export interface ManualInterventionRequest {
  id: string;
  stepName: string;
  error: Error;
  suggestedActions: string[];
  timestamp: Date;
  context: WorkflowErrorContext;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'skip' | 'rollback' | 'manual' | 'abort';
  reason?: string;
  parameters?: Record<string, unknown>;
}

export interface RecoveryHandlerResult {
  strategy: ErrorRecoveryStrategy;
  modifiedStep?: CdktfWorkflowStep;
  skipToStep?: number;
}

// ============================================================================
// Rollback Workflow Types
// ============================================================================

export interface RollbackStrategy {
  type: 'automatic' | 'manual' | 'selective' | 'progressive';
  triggerConditions: RollbackTriggerCondition[];
  rollbackSteps: RollbackStep[];
  validationSteps?: RollbackStep[];
  cleanupSteps?: RollbackStep[];
  options?: RollbackOptions;
}

export interface RollbackTriggerCondition {
  type: 'step-failure' | 'timeout' | 'resource-error' | 'state-inconsistency' | 'manual' | 'custom';
  stepName?: string;
  errorPattern?: string;
  timeoutMs?: number;
  customCondition?: (context: RollbackContext) => boolean;
}

export interface RollbackStep extends CdktfWorkflowStep {
  rollbackType: 'state-restore' | 'resource-destroy' | 'configuration-revert' | 'cleanup' | 'validation' | 'custom';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  rollbackCondition?: (context: RollbackContext) => boolean;
  rollbackData?: Record<string, unknown>;
}

export interface RollbackOptions {
  maxRollbackAttempts?: number;
  rollbackTimeoutMs?: number;
  preserveState?: boolean;
  validateAfterRollback?: boolean;
  notifyOnRollback?: boolean;
  rollbackOnPartialSuccess?: boolean;
}

export interface RollbackContext {
  workflowName: string;
  failedStep: string;
  failedStepIndex: number;
  error: Error;
  completedSteps: string[];
  failedSteps: string[];
  workflowState: Record<string, unknown>;
  rollbackReason: string;
  rollbackTimestamp: Date;
  previousState?: Record<string, unknown>;
}

export interface RollbackExecutionResult {
  success: boolean;
  rollbackSteps: string[];
  failedRollbackSteps: string[];
  errors: string[];
  warnings: string[];
  duration: number;
  stateRestored: boolean;
  resourcesDestroyed: string[];
  validationResults?: Record<string, unknown>[];
}

export interface RollbackPlan {
  rollbackSteps: RollbackStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: Map<string, string[]>;
  validationSteps: RollbackStep[];
  cleanupSteps: RollbackStep[];
}

export interface RollbackHistory {
  id: string;
  workflowName: string;
  rollbackTimestamp: Date;
  triggerReason: string;
  rollbackStrategy: string;
  executionResult: RollbackExecutionResult;
  context: RollbackContext;
}

// ============================================================================
// Parallel Execution Types
// ============================================================================

export interface StepDependency {
  stepName: string;
  dependencies: string[];
  satisfied: boolean;
}

export interface ExecutionBatch {
  steps: CdktfWorkflowStep[];
  batchNumber: number;
  parallelGroup?: string;
}

export interface StepExecutionContext {
  step: CdktfWorkflowStep;
  stepIndex: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: Error;
}

export interface ParallelExecutionContext {
  batches: ExecutionBatch[];
  dependencyGraph: Map<string, StepDependency>;
  executionOrder: string[];
  runningSteps: Map<string, Promise<StepExecutionContext>>;
  completedSteps: Set<string>;
  failedSteps: Set<string>;
  stats: ParallelExecutionStats;
}
