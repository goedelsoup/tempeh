import * as Effect from 'effect/Effect';
import { writeJsonFile, readJsonFile, ensureDirectory } from '@tempeh/utils';
import { logger } from '@tempeh/utils';
import { type StateError, TempehError } from '@tempeh/types';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type {
  WorkflowCheckpoint,
  WorkflowErrorContext,
  ManualInterventionRequest,
  ErrorRecoveryStrategy,
  RecoveryHandlerResult,
  WorkflowStepRetry
} from './types';

// ============================================================================
// Error Recovery Manager
// ============================================================================

export class ErrorRecoveryManager {
  private checkpointDir: string;
  private manualInterventions = new Map<string, ManualInterventionRequest>();

  constructor(checkpointDir = '.tempeh/checkpoints') {
    this.checkpointDir = checkpointDir;
  }

  // ============================================================================
  // Checkpoint Management
  // ============================================================================

  saveCheckpoint(checkpoint: WorkflowCheckpoint): Effect.Effect<string, StateError> {
    return Effect.gen(this, function* (_) {
      yield* _(ensureDirectory(this.checkpointDir));
      
      const checkpointFile = join(this.checkpointDir, `${checkpoint.id}.json`);
      yield* _(writeJsonFile(checkpointFile, {
        ...checkpoint,
        timestamp: checkpoint.timestamp.toISOString()
      }));
      
      yield* _(logger.debug(`Checkpoint saved: ${checkpointFile}`));
      return checkpointFile;
    });
  }

  loadCheckpoint(checkpointId: string): Effect.Effect<WorkflowCheckpoint, StateError> {
    return Effect.gen(this, function* (_) {
      const checkpointFile = join(this.checkpointDir, `${checkpointId}.json`);
      
      if (!existsSync(checkpointFile)) {
        throw new TempehError({
          code: 'CHECKPOINT_NOT_FOUND',
          message: `Checkpoint not found: ${checkpointId}`,
          suggestions: [
            'Check the checkpoint ID',
            'Verify the checkpoint directory exists',
            'List available checkpoints'
          ]
        });
      }
      
      const checkpointData = yield* _(readJsonFile<WorkflowCheckpoint & { timestamp: string }>(checkpointFile));
      
      return {
        ...checkpointData,
        timestamp: new Date(checkpointData.timestamp)
      };
    });
  }

  listCheckpoints(workflowName?: string): Effect.Effect<WorkflowCheckpoint[], StateError> {
    return Effect.gen(this, function* (_) {
      if (!existsSync(this.checkpointDir)) {
        return [];
      }
      
      const { readdirSync } = require('node:fs');
      const files = readdirSync(this.checkpointDir).filter((f: string) => f.endsWith('.json'));
      
      const checkpoints: WorkflowCheckpoint[] = [];
      
      for (const file of files) {
        try {
          const checkpointData = yield* _(readJsonFile<WorkflowCheckpoint & { timestamp: string }>(
            join(this.checkpointDir, file)
          ));
          
          const checkpoint = {
            ...checkpointData,
            timestamp: new Date(checkpointData.timestamp)
          };
          
          if (!workflowName || checkpoint.workflowName === workflowName) {
            checkpoints.push(checkpoint);
          }
        } catch (error) {
          yield* _(logger.warn(`Failed to load checkpoint ${file}: ${error}`));
        }
      }
      
      return checkpoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
  }

  // ============================================================================
  // Retry Strategy Implementation
  // ============================================================================

  async executeWithAdvancedRetry<T>(
    operation: () => Promise<T>,
    retryConfig: WorkflowStepRetry,
    stepName: string
  ): Promise<T> {
    const strategy = retryConfig.strategy || 'exponential';
    const maxDelayMs = retryConfig.maxDelayMs || 30000; // 30 seconds max
    const jitter = retryConfig.jitter ?? true;
    
    let lastError: Error | null = null;
    const errors: Error[] = [];
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        await Effect.runPromise(logger.debug(
          `Executing ${stepName} (attempt ${attempt}/${retryConfig.maxAttempts})`
        ));
        
        const result = await operation();
        
        if (attempt > 1) {
          await Effect.runPromise(logger.info(
            `${stepName} succeeded on attempt ${attempt}/${retryConfig.maxAttempts}`
          ));
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        errors.push(lastError);
        
        // Check if we should retry based on error codes
        if (retryConfig.retryOnCodes && lastError instanceof TempehError) {
          if (!retryConfig.retryOnCodes.includes(lastError.code)) {
            await Effect.runPromise(logger.debug(
              `Not retrying ${stepName} - error code ${lastError.code} not in retry list`
            ));
            break;
          }
        }
        
        if (attempt < retryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(
            attempt,
            retryConfig.delayMs,
            strategy,
            retryConfig.backoffMultiplier || 2,
            maxDelayMs,
            jitter
          );
          
          await Effect.runPromise(logger.warn(
            `${stepName} failed (attempt ${attempt}), retrying in ${delay}ms: ${lastError.message}`
          ));
          
          await this.sleep(delay);
        } else {
          await Effect.runPromise(logger.error(
            `${stepName} failed after ${retryConfig.maxAttempts} attempts`
          ));
        }
      }
    }
    
    // All retry attempts failed
    const finalError = new TempehError({
      code: 'MAX_RETRIES_EXCEEDED',
      message: `${stepName} failed after ${retryConfig.maxAttempts} attempts`,
      suggestions: [
        'Check the underlying cause of the failures',
        'Consider increasing retry attempts or delay',
        'Review the step configuration',
        'Check if manual intervention is needed'
      ],
      context: { 
        stepName, 
        retryConfig, 
        attemptCount: retryConfig.maxAttempts,
        lastError: lastError?.message,
        allErrors: errors.map(e => e.message)
      }
    });
    
    throw finalError;
  }

  private calculateRetryDelay(
    attempt: number,
    baseDelayMs: number,
    strategy: 'linear' | 'exponential' | 'fixed',
    backoffMultiplier: number,
    maxDelayMs: number,
    jitter: boolean
  ): number {
    let delay: number;
    
    switch (strategy) {
      case 'fixed':
        delay = baseDelayMs;
        break;
      case 'linear':
        delay = baseDelayMs * attempt;
        break;
      case 'exponential':
        delay = baseDelayMs * (backoffMultiplier ** (attempt - 1));
        break;
      default:
        delay = baseDelayMs * (backoffMultiplier ** (attempt - 1));
        break;
    }
    
    // Apply maximum delay limit
    delay = Math.min(delay, maxDelayMs);
    
    // Apply jitter to avoid thundering herd
    if (jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(0, Math.round(delay));
  }

  private sleep(ms: number): Effect.Effect<void, StateError> {
    return Effect.delay(ms)(Effect.sync(() => {return}));
  }

  // ============================================================================
  // Manual Intervention Management
  // ============================================================================

  requestManualIntervention(
    context: WorkflowErrorContext,
    suggestedActions: string[]
  ): Effect.Effect<ManualInterventionRequest, StateError> {
    const request: ManualInterventionRequest = {
      id: uuidv4(),
      stepName: context.step.name,
      error: context.error,
      suggestedActions,
      timestamp: new Date(),
      context
    };
    
    this.manualInterventions.set(request.id, request);
    
    return Effect.gen(this, function* (_) {
      yield* _(logger.warn(`Manual intervention requested for step ${context.step.name}`));
      yield* _(logger.info('Suggested actions:'));
      return yield* _(logger.info(`Intervention ID: ${request.id}`)
        .pipe(Effect.as(request)));
    });
  }

  resolveManualIntervention(
    interventionId: string,
    strategy: ErrorRecoveryStrategy
  ): Effect.Effect<RecoveryHandlerResult, StateError> {
    const request = this.manualInterventions.get(interventionId);
    
    if (!request) {
      throw new TempehError({
        code: 'INTERVENTION_NOT_FOUND',
        message: `Manual intervention not found: ${interventionId}`,
        suggestions: [
          'Check the intervention ID',
          'List pending interventions'
        ]
      });
    }
    
    this.manualInterventions.delete(interventionId);
    
    const result: RecoveryHandlerResult = {
      strategy
    };
    
    if (strategy.type === 'retry') {
      result.modifiedStep = request.context.step;
    }
    
    return logger.info(
      `Manual intervention resolved for ${request.stepName}: ${strategy.type}`
    ).pipe(Effect.as(result));
  }

  listPendingInterventions(): Effect.Effect<ManualInterventionRequest[], StateError> {
    return Effect.succeed(Array.from(this.manualInterventions.values())); // todo: use Ref
  }

  // ============================================================================
  // Smart Error Analysis
  // ============================================================================

  analyzeError(context: WorkflowErrorContext): Effect.Effect<ErrorRecoveryStrategy, StateError> {
    const { error, step, attemptNumber } = context;
    
    // Analyze error patterns and suggest recovery strategy
    if (error instanceof TempehError) {
      switch (error.code) {
        case 'NETWORK_ERROR':
        case 'TIMEOUT_ERROR':
        case 'TEMPORARY_FAILURE':
          if (attemptNumber < 3) {
            return Effect.succeed({
              type: 'retry',
              reason: 'Temporary error detected, retrying with backoff'
            });
          }
          break;
          
        case 'PERMISSION_DENIED':
        case 'AUTHENTICATION_FAILED':
          return Effect.succeed({
            type: 'manual',
            reason: 'Authentication/permission issue requires manual intervention',
            parameters: {
              suggestedActions: [
                'Check AWS credentials',
                'Verify IAM permissions',
                'Refresh authentication tokens'
              ]
            }
          });
          
        case 'RESOURCE_CONFLICT':
        case 'STATE_LOCK_ERROR':
          return Effect.succeed({
            type: 'retry',
            reason: 'Resource conflict detected, retrying after delay',
            parameters: {
              delayMs: 5000 + (attemptNumber * 2000) // Increasing delay
            }
          });
          
        case 'CONFIGURATION_ERROR':
        case 'VALIDATION_ERROR':
          return Effect.succeed({
            type: 'manual',
            reason: 'Configuration error requires manual correction',
            parameters: {
              suggestedActions: [
                'Review step configuration',
                'Check CDKTF options',
                'Validate workflow definition'
              ]
            }
          });
      }
    }
    
    // Default strategies based on step type
    if (step.command === 'deploy' && attemptNumber < 2) {
      return Effect.succeed({
        type: 'retry',
        reason: 'Deployment failures often resolve with retry'
      });
    }
    
    if (step.command === 'destroy' && error.message.includes('dependency')) {
      return Effect.succeed({
        type: 'manual',
        reason: 'Dependency issue in destroy operation',
        parameters: {
          suggestedActions: [
            'Check resource dependencies',
            'Consider destroying dependencies first',
            'Review Terraform state'
          ]
        }
      });
    }
    
    // Conservative default
    return Effect.succeed({
      type: 'manual',
      reason: 'Unknown error type, manual intervention recommended'
    });
  }

  // ============================================================================
  // Recovery Utilities
  // ============================================================================

  createEmergencyCheckpoint(
    workflowName: string,
    stepIndex: number,
    stepName: string,
    completedSteps: string[],
    failedSteps: string[],
    state: Record<string, unknown>
  ): Effect.Effect<string, StateError> {
    const checkpoint: WorkflowCheckpoint = {
      id: `emergency_${uuidv4()}`,
      workflowName,
      stepIndex,
      stepName,
      timestamp: new Date(),
      state,
      completedSteps,
      failedSteps
    };
    
    return this.saveCheckpoint(checkpoint);
  }

  async validateRecoveryStrategy(
    strategy: ErrorRecoveryStrategy,
    context: WorkflowErrorContext
  ): Promise<boolean> {
    switch (strategy.type) {
      case 'retry':
        // Check if retry attempts are not exceeded
        return context.attemptNumber < 5;
        
      case 'skip':
        // Only allow skipping non-critical steps
        return !context.step.name.includes('deploy') && !context.step.name.includes('destroy');
        
      case 'rollback':
        // Always valid
        return true;
        
      case 'manual':
        // Always valid
        return true;
        
      case 'abort':
        // Always valid
        return true;
        
      default:
        return false;
    }
  }
}
