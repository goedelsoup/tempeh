import { Command } from 'commander';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { StateManager } from '@tempeh/state';
import { TempehError } from '@tempeh/types';
import type { StateInfo } from '@tempeh/types';
import { WorkflowEngine, type CdktfWorkflow } from '@tempeh/workflow';
import { readFileSync, existsSync } from 'node:fs';
import { runEffectResult, runEffect } from '../utils';

// Lazy-load the TempehEngine to avoid CDKTF initialization on import
const loadTempehEngine = async () => {
  const { TempehEngine } = await import('@tempeh/core');
  return TempehEngine;
};

export function createWorkflowCommand(): Command {
  const command = new Command('workflow')
    .description('Manage CDKTF workflows')
    .option('-w, --working-dir <path>', 'Working directory', process.cwd())
    .option('-v, --verbose', 'Enable verbose output');

  command
    .command('run')
    .description('Execute a workflow')
    .option('-f, --file <path>', 'Workflow file path', 'tempeh-workflow.json')
    .option('--dry-run', 'Show what would be executed without making changes')
    .option('--continue-on-error', 'Continue execution even if steps fail')
    .option('--rollback-on-error', 'Execute rollback steps if workflow fails')
    .option('--timeout <ms>', 'Workflow timeout in milliseconds')
    .option('--parallel', 'Enable parallel execution of independent steps')
    .option('--max-concurrency <num>', 'Maximum number of steps to run in parallel', '4')
    .option('--save-checkpoints', 'Save checkpoints before critical steps')
    .option('--checkpoint-dir <path>', 'Directory to save checkpoints', '.tempeh/checkpoints')
    .option('--resume-from-checkpoint <id>', 'Resume workflow from a specific checkpoint')
    .option('--allow-manual-intervention', 'Allow manual intervention on errors')
    .option('--max-manual-interventions <num>', 'Maximum number of manual interventions', '3')
    .action(async (options) => {
      try {
        const workflowFile = options.file;
        
        if (!existsSync(workflowFile)) {
          throw new TempehError({
            code: 'WORKFLOW_FILE_NOT_FOUND',
            message: `Workflow file not found: ${workflowFile}`,
            suggestions: [
              'Check if the workflow file exists',
              'Use --file to specify a different workflow file',
              'Create a workflow file using "tempeh workflow create"'
            ]
          });
        }

        // Load workflow configuration
        const workflowContent = readFileSync(workflowFile, 'utf-8');
        const workflow: CdktfWorkflow = JSON.parse(workflowContent);

        // Initialize engines
        const stateManager = new StateManager(Effect.runSync(Ref.make({ 
          version: '4.0',
          terraformVersion: '1.0.0',
          serial: 1,
          lineage: 'default',
          resources: [], 
          outputs: {} 
        } as StateInfo)), {});
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(options.workingDir);
        const maxConcurrency = options.maxConcurrency ? Number.parseInt(options.maxConcurrency, 10) : 4;
        const workflowEngine = new WorkflowEngine(tempehEngine, stateManager, options.checkpointDir, maxConcurrency);

        // Validate workflow
        const validation = await runEffect(workflowEngine.validateWorkflow(workflow));
        const validationData = validation;
        if (!validationData.isValid) {
          console.error('❌ Workflow validation failed:');
          const issues = validationData.issues as string[];
          for (const issue of issues) {
            console.error(`   • ${issue}`);
          }
          process.exit(1);
        }

        // Execute workflow
        const result = await runEffectResult(workflowEngine.executeWorkflow(workflow as unknown as Record<string, unknown>, {
          dryRun: options.dryRun,
          timeout: options.timeout ? Number.parseInt(options.timeout, 10) : 30000,
          parallel: options.parallel,
          maxConcurrency: maxConcurrency,
          continueOnError: options.continueOnError,
          rollbackOnError: options.rollbackOnError,
          saveCheckpoints: options.saveCheckpoints,
          checkpointDir: options.checkpointDir,
          resumeFromCheckpoint: options.resumeFromCheckpoint,
          allowManualIntervention: options.allowManualIntervention,
          maxManualInterventions: options.maxManualInterventions ? Number.parseInt(options.maxManualInterventions, 10) : 3
        }));

        // Display results
        const resultData = result as Record<string, unknown>;
        console.log('\n📊 Workflow Execution Results:');
        console.log('='.repeat(40));
        console.log(`✅ Success: ${resultData.success}`);
        console.log(`⏱️  Duration: ${resultData.duration}ms`);

        const completedSteps = resultData.completedSteps as unknown[];
        const failedSteps = resultData.failedSteps as unknown[];
        const errors = resultData.errors as unknown[];

        console.log(`✅ Completed: ${completedSteps.length} steps`);
        console.log(`❌ Failed: ${failedSteps.length} steps`);

        if (completedSteps.length > 0) {
          console.log('\n✅ Completed Steps:');
          for (const step of completedSteps) {
            console.log(`   • ${step}`);
          }
        }

        if (failedSteps.length > 0) {
          console.log('\n❌ Failed Steps:');
          for (const step of failedSteps) {
            console.log(`   • ${step}`);
          }
        }

        if (errors.length > 0) {
          console.log('\n🚨 Errors:');
          for (const error of errors) {
            console.log(`   • ${error}`);
          }
        }

        if (resultData.rollbackPerformed) {
          console.log('\n🔄 Rollback was performed');
        }

        const checkpointsSaved = resultData.checkpointsSaved as unknown[];
        if (checkpointsSaved && checkpointsSaved.length > 0) {
          console.log(`\n💾 Checkpoints saved: ${checkpointsSaved.length}`);
        }

        if (resultData.resumedFromCheckpoint) {
          console.log(`\n🔄 Resumed from checkpoint: ${resultData.resumedFromCheckpoint}`);
        }

        const parallelStats = resultData.parallelExecutionStats as Record<string, unknown>;
        if (parallelStats) {
          console.log('\n🚀 Parallel Execution Statistics:');
          console.log(`   📊 Total Steps: ${parallelStats.totalSteps}`);
          console.log(`   ⚡ Parallel Steps: ${parallelStats.parallelSteps}`);
          console.log(`   🔄 Max Concurrent: ${parallelStats.maxConcurrentSteps}`);
          const avgConcurrency = parallelStats.averageConcurrency as number;
          console.log(`   📈 Avg Concurrency: ${avgConcurrency.toFixed(2)}`);
          
          const parallelGroups = parallelStats.parallelGroups as unknown[];
          if (parallelGroups.length > 0) {
            console.log('\n   📋 Execution Groups:');
            for (const group of parallelGroups) {
              const groupData = group as Record<string, unknown>;
              const groupName = groupData.groupName || 'Default';
              console.log(`      • ${groupName}: ${groupData.stepCount} steps, ${groupData.duration}ms, ${groupData.success ? '✅' : '❌'}`);
            }
          }
        }

        if (!resultData.success) {
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
    .command('validate')
    .description('Validate a workflow file')
    .option('-f, --file <path>', 'Workflow file path', 'tempeh-workflow.json')
    .action(async (options) => {
      try {
        const workflowFile = options.file;
        
        if (!existsSync(workflowFile)) {
          throw new TempehError({
            code: 'WORKFLOW_FILE_NOT_FOUND',
            message: `Workflow file not found: ${workflowFile}`,
            suggestions: [
              'Check if the workflow file exists',
              'Use --file to specify a different workflow file'
            ]
          });
        }

        // Load workflow configuration
        const workflowContent = readFileSync(workflowFile, 'utf-8');
        const workflow: CdktfWorkflow = JSON.parse(workflowContent);

        // Initialize engines for validation
        const stateManager = new StateManager(Effect.runSync(Ref.make({ 
          version: '4.0',
          terraformVersion: '1.0.0',
          serial: 1,
          lineage: 'default',
          resources: [], 
          outputs: {} 
        } as StateInfo)), {});
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(options.workingDir);
        const workflowEngine = new WorkflowEngine(tempehEngine, stateManager);

        // Validate workflow
        const validation = await runEffect(workflowEngine.validateWorkflow(workflow));
        const validationData = validation;
        
        if (validationData.isValid) {
          console.log('✅ Workflow validation passed!');
          console.log(`\n📋 Workflow: ${workflow.name}`);
          console.log(`📝 Description: ${workflow.description}`);
          console.log(`🔢 Steps: ${workflow.steps.length}`);
          
          if (workflow.preHooks) {
            console.log(`🔗 Pre-hooks: ${workflow.preHooks.length}`);
          }
          
          if (workflow.postHooks) {
            console.log(`🔗 Post-hooks: ${workflow.postHooks.length}`);
          }
          
          if (workflow.rollbackSteps) {
            console.log(`🔄 Rollback steps: ${workflow.rollbackSteps.length}`);
          }
        } else {
          console.error('❌ Workflow validation failed:');
          const issues = validationData.issues as string[];
          for (const issue of issues) {
            console.error(`   • ${issue}`);
          }
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
    .description('Create a sample workflow file')
    .option('-f, --file <path>', 'Output file path', 'tempeh-workflow.json')
    .option('-n, --name <name>', 'Workflow name', 'sample-workflow')
    .action(async (options) => {
      try {
        const sampleWorkflow: CdktfWorkflow = {
          name: options.name,
          description: 'A sample CDKTF workflow with pre-hooks, main steps, and rollback',
          required: true,
          preHooks: [
            {
              name: 'backup-state',
              description: 'Create a backup of the current state',
              command: 'backup-state'
            }
          ],
          steps: [
            {
              name: 'synthesize',
              description: 'Synthesize the CDKTF application',
              command: 'synth',
              cdktfOptions: {
                stack: 'default'
              }
            },
            {
              name: 'plan-deployment',
              description: 'Create a deployment plan',
              command: 'plan',
              cdktfOptions: {
                stack: 'default',
                refresh: true
              },
              retry: {
                maxAttempts: 3,
                delayMs: 1000,
                backoffMultiplier: 2
              }
            },
            {
              name: 'deploy',
              description: 'Deploy the infrastructure',
              command: 'deploy',
              cdktfOptions: {
                stack: 'default',
                autoApprove: true
              },
              condition: {
                type: 'file-exists',
                value: 'cdktf.out'
              }
            }
          ],
          postHooks: [
            {
              name: 'verify-deployment',
              description: 'Verify the deployment was successful',
              command: 'wait',
              args: ['5000'] // Wait 5 seconds
            }
          ],
          rollbackSteps: [
            {
              name: 'destroy-on-rollback',
              description: 'Destroy infrastructure on rollback',
              command: 'destroy',
              cdktfOptions: {
                stack: 'default',
                autoApprove: true
              }
            },
            {
              name: 'restore-state',
              description: 'Restore state from backup',
              command: 'restore-state',
              args: ['backup-file-path']
            }
          ]
        };

        // Write workflow file
        const { writeFileSync } = await import('node:fs');
        writeFileSync(options.file, JSON.stringify(sampleWorkflow, null, 2));

        console.log(`✅ Sample workflow created: ${options.file}`);
        console.log('\n📋 Workflow includes:');
        console.log('   • Pre-hooks for state backup');
        console.log('   • Main deployment steps with retry logic');
        console.log('   • Post-hooks for verification');
        console.log('   • Rollback steps for error recovery');
        console.log('\n💡 Edit the workflow file to customize it for your needs');
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
    .command('analyze')
    .description('Analyze a workflow for parallel execution potential')
    .option('-f, --file <path>', 'Workflow file path', 'tempeh-workflow.json')
    .action(async (options) => {
      try {
        const workflowFile = options.file;
        
        if (!existsSync(workflowFile)) {
          throw new TempehError({
            code: 'WORKFLOW_FILE_NOT_FOUND',
            message: `Workflow file not found: ${workflowFile}`,
            suggestions: [
              'Check if the workflow file exists',
              'Use --file to specify a different workflow file'
            ]
          });
        }

        // Load workflow configuration
        const workflowContent = readFileSync(workflowFile, 'utf-8');
        const workflow: CdktfWorkflow = JSON.parse(workflowContent);

        // Initialize engines for analysis
        const stateManager = new StateManager(Effect.runSync(Ref.make({ 
          version: '4.0',
          terraformVersion: '1.0.0',
          serial: 1,
          lineage: 'default',
          resources: [], 
          outputs: {} 
        } as StateInfo)), {});
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(options.workingDir);
        const workflowEngine = new WorkflowEngine(tempehEngine, stateManager);

        // Analyze workflow for parallelization
        const analysis = await runEffectResult(workflowEngine.analyzeWorkflowParallelization(workflow as unknown as Record<string, unknown>));
        const analysisData = analysis as Record<string, unknown>;
        
        console.log('\n🔍 Workflow Parallelization Analysis:');
        console.log('='.repeat(50));
        console.log(`📋 Workflow: ${workflow.name}`);
        console.log(`🔢 Total Steps: ${workflow.steps.length}`);
        console.log(`🚀 Can Run in Parallel: ${analysisData.canRunInParallel ? '✅ Yes' : '❌ No'}`);

        const issues = analysisData.issues as string[];
        if (issues.length > 0) {
          console.log('\n⚠️ Issues preventing parallel execution:');
          for (const issue of issues) {
            console.log(`   • ${issue}`);
          }
        }

        const suggestedGroups = analysisData.suggestedGroups as Map<string, string[]>;
        if (suggestedGroups && suggestedGroups.size > 0) {
          console.log('\n💡 Suggested Parallel Groups:');
          for (const [group, steps] of suggestedGroups) {
            console.log(`   🔗 ${group}:`);
            for (const step of steps) {
              console.log(`      • ${step}`);
            }
          }
        }

        const recommendations = analysisData.recommendations as string[];
        if (recommendations && recommendations.length > 0) {
          console.log('\n📝 Recommendations:');
          for (const recommendation of recommendations) {
            console.log(`   • ${recommendation}`);
          }
        }

        // Show dependency information
        const dependentSteps = workflow.steps.filter(step => step.dependsOn && step.dependsOn.length > 0);
        if (dependentSteps.length > 0) {
          console.log('\n🔗 Dependencies:');
          for (const step of dependentSteps) {
            console.log(`   ${step.name} depends on: ${step.dependsOn?.join(', ')}`);
          }
        }

        // Show parallel groups if any
        const groupedSteps = workflow.steps.filter(step => step.parallelGroup);
        if (groupedSteps.length > 0) {
          console.log('\n🔄 Current Parallel Groups:');
          const groups = new Map<string, string[]>();
          for (const step of groupedSteps) {
            if (!groups.has(step.parallelGroup!)) {
              groups.set(step.parallelGroup!, []);
            }
            groups.get(step.parallelGroup!)!.push(step.name);
          }
          for (const [group, steps] of groups) {
            console.log(`   ${group}: ${steps.join(', ')}`);
          }
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
    .command('rollback')
    .description('Execute rollback for a workflow')
    .option('-f, --file <path>', 'Workflow file path', 'tempeh-workflow.json')
    .option('-r, --reason <reason>', 'Reason for rollback', 'Manual rollback')
    .option('--strategy <strategy>', 'Rollback strategy (automatic, progressive, selective)', 'automatic')
    .option('--dry-run', 'Show what would be rolled back without making changes')
    .action(async (options) => {
      try {
        const workflowFile = options.file;
        
        if (!existsSync(workflowFile)) {
          throw new TempehError({
            code: 'WORKFLOW_FILE_NOT_FOUND',
            message: `Workflow file not found: ${workflowFile}`,
            suggestions: [
              'Check if the workflow file exists',
              'Use --file to specify a different workflow file'
            ]
          });
        }

        // Load workflow configuration
        const workflowContent = readFileSync(workflowFile, 'utf-8');
        const workflow: CdktfWorkflow = JSON.parse(workflowContent);

        // Initialize engines
        const stateManager = new StateManager(Effect.runSync(Ref.make({ 
          version: '4.0',
          terraformVersion: '1.0.0',
          serial: 1,
          lineage: 'default',
          resources: [], 
          outputs: {} 
        } as StateInfo)), {});
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(options.workingDir);
        const workflowEngine = new WorkflowEngine(tempehEngine, stateManager);

        if (options.dryRun) {
          console.log('DRY RUN MODE - No rollback will be executed');
          console.log(`Would execute rollback for workflow: ${workflow.name}`);
          console.log(`Rollback reason: ${options.reason}`);
          console.log(`Rollback strategy: ${options.strategy}`);
          return;
        }

        // Execute rollback
        const rollbackResult = await runEffectResult(
          workflowEngine.executeManualRollback(workflow as unknown as Record<string, unknown>, options.reason)
        );

        // Display results
        const rollbackData = rollbackResult as Record<string, unknown>;
        console.log('\n🔄 Rollback Execution Results:');
        console.log('='.repeat(40));
        console.log(`✅ Success: ${rollbackData.success}`);
        console.log(`⏱️ Duration: ${rollbackData.duration}ms`);

        const rollbackSteps = rollbackData.rollbackSteps as unknown[];
        const failedRollbackSteps = rollbackData.failedRollbackSteps as unknown[];
        const errors = rollbackData.errors as unknown[];
        const warnings = rollbackData.warnings as unknown[];

        console.log(`📊 Rollback Steps: ${rollbackSteps.length}`);
        console.log(`❌ Failed Steps: ${failedRollbackSteps.length}`);

        if (rollbackSteps.length > 0) {
          console.log('\n✅ Completed Rollback Steps:');
          for (const step of rollbackSteps) {
            console.log(`   • ${step}`);
          }
        }

        if (failedRollbackSteps.length > 0) {
          console.log('\n❌ Failed Rollback Steps:');
          for (const step of failedRollbackSteps) {
            console.log(`   • ${step}`);
          }
        }

        if (errors.length > 0) {
          console.log('\n🚨 Rollback Errors:');
          for (const error of errors) {
            console.log(`   • ${error}`);
          }
        }

        if (warnings.length > 0) {
          console.log('\n⚠️ Rollback Warnings:');
          for (const warning of warnings) {
            console.log(`   • ${warning}`);
          }
        }

        if (!rollbackData.success) {
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
    .command('rollback-history')
    .description('View rollback history')
    .option('-f, --file <path>', 'Workflow file path', 'tempeh-workflow.json')
    .option('-w, --workflow <name>', 'Filter by workflow name')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        // Initialize engines
        const stateManager = new StateManager(Effect.runSync(Ref.make({ 
          version: '4.0',
          terraformVersion: '1.0.0',
          serial: 1,
          lineage: 'default',
          resources: [], 
          outputs: {} 
        } as StateInfo)), {});
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(options.workingDir);
        const workflowEngine = new WorkflowEngine(tempehEngine, stateManager);

        // Get rollback history
        const history = await runEffectResult(
          workflowEngine.getRollbackHistory(options.workflow)
        );

        if (options.json) {
          console.log(JSON.stringify(history, null, 2));
        } else {
          const report = await runEffectResult(
            workflowEngine.generateRollbackReport(options.workflow)
          );
          console.log(report);
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
    .command('optimize')
    .description('Optimize a workflow for parallel execution')
    .option('-f, --file <path>', 'Input workflow file path', 'tempeh-workflow.json')
    .option('-o, --output <path>', 'Output workflow file path (defaults to input file with -optimized suffix)')
    .action(async (options) => {
      try {
        const workflowFile = options.file;
        
        if (!existsSync(workflowFile)) {
          throw new TempehError({
            code: 'WORKFLOW_FILE_NOT_FOUND',
            message: `Workflow file not found: ${workflowFile}`,
            suggestions: [
              'Check if the workflow file exists',
              'Use --file to specify a different workflow file'
            ]
          });
        }

        // Load workflow configuration
        const workflowContent = readFileSync(workflowFile, 'utf-8');
        const workflow: CdktfWorkflow = JSON.parse(workflowContent);

        // Initialize engines for optimization
        const stateManager = new StateManager(Effect.runSync(Ref.make({ 
          version: '4.0',
          terraformVersion: '1.0.0',
          serial: 1,
          lineage: 'default',
          resources: [], 
          outputs: {} 
        } as StateInfo)), {});
        const TempehEngineClass = await loadTempehEngine();
        const tempehEngine = new TempehEngineClass(options.workingDir);
        const workflowEngine = new WorkflowEngine(tempehEngine, stateManager);

        // Optimize workflow
        const optimizedWorkflow = await runEffectResult(workflowEngine.optimizeWorkflowForParallelExecution(workflow as unknown as Record<string, unknown>));
        const optimizedData = optimizedWorkflow as Record<string, unknown>;
        
        // Determine output file
        const outputFile = options.output || workflowFile.replace(/\.json$/, '-optimized.json');
        
        // Write optimized workflow
        const { writeFileSync } = await import('node:fs');
        writeFileSync(outputFile, JSON.stringify(optimizedData, null, 2));

        console.log(`✅ Workflow optimized for parallel execution: ${outputFile}`);
        
        // Show what was optimized
        const originalGroups = workflow.steps.filter(s => s.parallelGroup).length;
        const optimizedSteps = optimizedData.steps as Array<{ parallelGroup?: string; timeout?: number; name: string }>;
        const optimizedGroups = optimizedSteps.filter(s => s.parallelGroup).length;
        const originalTimeouts = workflow.steps.filter(s => s.timeout).length;
        const optimizedTimeouts = optimizedSteps.filter(s => s.timeout).length;

        console.log('\n📊 Optimization Results:');
        console.log(`   🔗 Parallel Groups: ${originalGroups} → ${optimizedGroups}`);
        console.log(`   ⏱️ Timeouts Added: ${originalTimeouts} → ${optimizedTimeouts}`);

        if (optimizedGroups > originalGroups) {
          console.log('\n✨ Improvements:');
          const newGroups = new Map<string, string[]>();
          for (const step of optimizedSteps) {
            if (step.parallelGroup && !workflow.steps.find(s => s.name === step.name)?.parallelGroup) {
              if (!newGroups.has(step.parallelGroup)) {
                newGroups.set(step.parallelGroup, []);
              }
              newGroups.get(step.parallelGroup)!.push(step.name);
            }
          }
          for (const [group, steps] of newGroups) {
            console.log(`   + Added ${group}: ${steps.join(', ')}`);
          }
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

  return command;
}
