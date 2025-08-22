import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import type { StateInfo, StateResource, StateInstance } from '@tempeh/types';

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

// ============================================================================
// State Validator Class
// ============================================================================

export class StateValidator {
  constructor(private state: Ref.Ref<StateInfo>) {}

  setState(state: StateInfo) {
    return Ref.set(this.state, state);
  }

  validate(): Effect.Effect<ValidationResult> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      const issues: ValidationIssue[] = [];

      if (!state) {
        issues.push({
          level: 'error',
          code: 'NO_STATE',
          message: 'No state loaded for validation'
        });
        return this.createValidationResult(issues);
      }

      // Validate state structure
      yield* _(this.validateStateStructure(state, issues));
      
      // Validate resources
      yield* _(this.validateResources(state, issues));
      
      // Validate outputs
      yield* _(this.validateOutputs(state, issues));
      
      // Validate dependencies
      yield* _(this.validateDependencies(state, issues));
      
      // Validate consistency
      yield* _(this.validateConsistency(state, issues));

      return this.createValidationResult(issues);
    });
  }

  private validateStateStructure(state: StateInfo, issues: ValidationIssue[]): Effect.Effect<void> {
    return Effect.sync(() => {
      // Check required fields
      if (!state.version) {
        issues.push({
          level: 'error',
          code: 'MISSING_VERSION',
          message: 'State file missing version field',
          suggestion: 'This may indicate a corrupted or invalid state file'
        });
      }

      if (!state.terraformVersion) {
        issues.push({
          level: 'warning',
          code: 'MISSING_TERRAFORM_VERSION',
          message: 'State file missing terraform version',
          suggestion: 'Consider running terraform init to update state format'
        });
      }

      if (!state.lineage) {
        issues.push({
          level: 'warning',
          code: 'MISSING_LINEAGE',
          message: 'State file missing lineage field',
          suggestion: 'This may indicate state file corruption'
        });
      }

      if (typeof state.serial !== 'number') {
        issues.push({
          level: 'error',
          code: 'INVALID_SERIAL',
          message: 'State file has invalid serial number',
          suggestion: 'Serial should be a number indicating state version'
        });
      }

      // Validate data types
      if (!Array.isArray(state.resources)) {
        issues.push({
          level: 'error',
          code: 'INVALID_RESOURCES',
          message: 'Resources field is not an array',
          suggestion: 'State file structure is corrupted'
        });
      }

      if (typeof state.outputs !== 'object' || state.outputs === null) {
        issues.push({
          level: 'error',
          code: 'INVALID_OUTPUTS',
          message: 'Outputs field is not an object',
          suggestion: 'State file structure is corrupted'
        });
      }
    });
  }

  private validateResources(state: StateInfo, issues: ValidationIssue[]): Effect.Effect<void> {
    return Effect.gen(this, function* (_) {
      if (!Array.isArray(state.resources)) {
        return;
      }

      const resourceMap = new Map<string, StateResource>();
      const moduleResources = new Map<string, StateResource[]>();

      for (let i = 0; i < state.resources.length; i++) {
        const resource = state.resources[i];
        if (!resource) continue;
        
        const resourceKey = `${resource.type}.${resource.name}`;

        // Check for duplicate resources
        if (resourceMap.has(resourceKey)) {
          issues.push({
            level: 'error',
            code: 'DUPLICATE_RESOURCE',
            message: `Duplicate resource found: ${resourceKey}`,
            resource: resourceKey,
            suggestion: 'Remove duplicate resource definitions'
          });
        } else {
          resourceMap.set(resourceKey, resource);
        }

        // Validate resource structure
        if (!resource.type || !resource.name) {
          issues.push({
            level: 'error',
            code: 'INVALID_RESOURCE',
            message: `Resource at index ${i} missing type or name`,
            suggestion: 'All resources must have type and name fields'
          });
        }

        if (!resource.provider) {
          issues.push({
            level: 'warning',
            code: 'MISSING_PROVIDER',
            message: `Resource ${resourceKey} missing provider field`,
            resource: resourceKey,
            suggestion: 'Consider specifying the provider explicitly'
          });
        }

        // Validate instances
        if (!Array.isArray(resource.instances) || resource.instances.length === 0) {
          issues.push({
            level: 'warning',
            code: 'NO_INSTANCES',
            message: `Resource ${resourceKey} has no instances`,
            resource: resourceKey,
            suggestion: 'This resource may not be created yet'
          });
        } else {
          for (const instance of resource.instances) {
            yield* _(this.validateInstance(instance, resourceKey, issues));
          }
        }

        // Track module resources
        const module = resource.module || 'root';
        if (!moduleResources.has(module)) {
          moduleResources.set(module, []);
        }
        const moduleResourceList = moduleResources.get(module);
        if (moduleResourceList) {
          moduleResourceList.push(resource);
        }
      }

      // Validate module structure
      yield* _(this.validateModules(moduleResources, issues));
    });
  }

  private validateInstance(instance: StateInstance, resourceKey: string, issues: ValidationIssue[]): Effect.Effect<void> {
    return Effect.sync(() => {
      if (typeof instance.schemaVersion !== 'number') {
        issues.push({
          level: 'error',
          code: 'INVALID_SCHEMA_VERSION',
          message: `Resource ${resourceKey} has invalid schema version`,
          resource: resourceKey,
          suggestion: 'Schema version should be a number'
        });
      }

      if (typeof instance.attributes !== 'object' || instance.attributes === null) {
        issues.push({
          level: 'error',
          code: 'INVALID_ATTRIBUTES',
          message: `Resource ${resourceKey} has invalid attributes`,
          resource: resourceKey,
          suggestion: 'Attributes should be an object'
        });
      }

      if (!Array.isArray(instance.dependencies)) {
        issues.push({
          level: 'warning',
          code: 'INVALID_DEPENDENCIES',
          message: `Resource ${resourceKey} has invalid dependencies`,
          resource: resourceKey,
          suggestion: 'Dependencies should be an array'
        });
      }
    });
  }

  private validateModules(moduleResources: Map<string, StateResource[]>, issues: ValidationIssue[]): Effect.Effect<void> {
    for (const [moduleName, resources] of moduleResources) {
      // Check for orphaned modules (modules with no resources)
      if (resources.length === 0) {
        issues.push({
          level: 'warning',
          code: 'EMPTY_MODULE',
          message: `Module '${moduleName}' has no resources`,
          module: moduleName,
          suggestion: 'Consider removing empty modules'
        });
      }

      // Check for module naming conventions
      if (moduleName !== 'root' && !moduleName.includes('.')) {
        issues.push({
          level: 'info',
          code: 'MODULE_NAMING',
          message: `Module '${moduleName}' may not follow naming conventions`,
          module: moduleName,
          suggestion: 'Consider using dot notation for nested modules'
        });
      }
    }
    return Effect.void;
  }

  private validateOutputs(state: StateInfo, issues: ValidationIssue[]): Effect.Effect<void> {
    if (!state.outputs || typeof state.outputs !== 'object') {
      return Effect.void;
    }

    for (const [outputName, outputValue] of Object.entries(state.outputs)) {
      if (outputValue === null || outputValue === undefined) {
        issues.push({
          level: 'warning',
          code: 'NULL_OUTPUT',
          message: `Output '${outputName}' has null/undefined value`,
          suggestion: 'Consider providing a default value or removing unused outputs'
        });
      }

      // Check for sensitive outputs without proper handling
      if (typeof outputValue === 'string' && outputValue.includes('password')) {
        issues.push({
          level: 'info',
          code: 'SENSITIVE_OUTPUT',
          message: `Output '${outputName}' may contain sensitive data`,
          suggestion: 'Consider marking this output as sensitive in your configuration'
        });
      }
    }
    return Effect.void;
  }

  private validateDependencies(state: StateInfo, issues: ValidationIssue[]): Effect.Effect<void> {
    return Effect.gen(this, function* (_) {
      if (!Array.isArray(state.resources)) {
        return;
      }

      const resourceMap = new Map<string, StateResource>();
      
      // Build resource map
      for (const resource of state.resources) {
        const resourceKey = `${resource.type}.${resource.name}`;
        resourceMap.set(resourceKey, resource);
      }

      // Check dependencies
      for (const resource of state.resources) {
        const resourceKey = `${resource.type}.${resource.name}`;
        
        for (const instance of resource.instances || []) {
          for (const dependency of instance.dependencies || []) {
            if (!resourceMap.has(dependency)) {
              issues.push({
                level: 'error',
                code: 'MISSING_DEPENDENCY',
                message: `Resource ${resourceKey} depends on missing resource: ${dependency}`,
                resource: resourceKey,
                suggestion: 'The dependent resource may have been deleted or renamed'
              });
            }
          }
        }
      }

      // Check for circular dependencies (basic check)
      yield* _(this.checkCircularDependencies(state, issues));
    });
  }

  private checkCircularDependencies(state: StateInfo, issues: ValidationIssue[]): Effect.Effect<void> {
    return Effect.gen(this, function* (_) {
      // This is a simplified circular dependency check
      // A full implementation would use topological sorting
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (resourceKey: string, resourceMap: Map<string, StateResource>): boolean => {
        if (recursionStack.has(resourceKey)) {
          return true;
        }

        if (visited.has(resourceKey)) {
          return false;
        }

        visited.add(resourceKey);
        recursionStack.add(resourceKey);

        const resource = resourceMap.get(resourceKey);
        if (resource) {
          for (const instance of resource.instances || []) {
            for (const dependency of instance.dependencies || []) {
              if (hasCycle(dependency, resourceMap)) {
                return true;
              }
            }
          }
        }

        recursionStack.delete(resourceKey);
        return false;
      };

      const resourceMap = new Map<string, StateResource>();
      for (const resource of state.resources) {
        const resourceKey = `${resource.type}.${resource.name}`;
        resourceMap.set(resourceKey, resource);
      }

      for (const resource of state.resources) {
        const resourceKey = `${resource.type}.${resource.name}`;
        if (hasCycle(resourceKey, resourceMap)) {
          issues.push({
            level: 'error',
            code: 'CIRCULAR_DEPENDENCY',
            message: `Circular dependency detected involving resource: ${resourceKey}`,
            resource: resourceKey,
            suggestion: 'Review and fix circular dependencies in your configuration'
          });
          break; // Only report the first cycle found
        }
      }
    });
  }

  private validateConsistency(state: StateInfo, issues: ValidationIssue[]): Effect.Effect<void> {
    return Effect.gen(this, function* (_) {
      // Check for orphaned resources (resources with no dependencies and no dependents)
      const resourceMap = new Map<string, StateResource>();
      const dependencyCount = new Map<string, number>();

      for (const resource of state.resources) {
        if (!resource) continue;
        const resourceKey = `${resource.type}.${resource.name}`;
        resourceMap.set(resourceKey, resource);
        dependencyCount.set(resourceKey, 0);
      }

      // Count dependencies
      for (const resource of state.resources) {
        if (!resource) continue;
        for (const instance of resource.instances || []) {
          for (const dependency of instance.dependencies || []) {
            const count = dependencyCount.get(dependency) || 0;
            dependencyCount.set(dependency, count + 1);
          }
        }
      }

      // Check for orphaned resources
      for (const [resourceKey, count] of dependencyCount) {
        const resource = resourceMap.get(resourceKey);
        if (resource && count === 0) {
          const hasDependencies = resource.instances?.some(instance => 
            instance.dependencies && instance.dependencies.length > 0
          );
          
          if (!hasDependencies) {
            issues.push({
              level: 'info',
              code: 'ORPHANED_RESOURCE',
              message: `Resource ${resourceKey} appears to be orphaned`,
              resource: resourceKey,
              suggestion: 'This resource has no dependencies and no other resources depend on it'
            });
          }
        }
      }

      // Check for resources in failed state
      for (const resource of state.resources) {
        const resourceKey = `${resource.type}.${resource.name}`;
        for (const instance of resource.instances || []) {
          if (instance.attributes && typeof instance.attributes === 'object') {
            const attrs = instance.attributes as Record<string, unknown>;
            if (attrs.status === 'failed' || attrs.state === 'failed') {
              issues.push({
                level: 'error',
                code: 'FAILED_RESOURCE',
                message: `Resource ${resourceKey} is in a failed state`,
                resource: resourceKey,
                suggestion: 'Review the resource configuration and try to recreate it'
              });
            }
          }
        }
      }
    });
  }

  private createValidationResult(issues: ValidationIssue[]): ValidationResult {
    const errorCount = issues.filter(issue => issue.level === 'error').length;
    const warningCount = issues.filter(issue => issue.level === 'warning').length;
    const infoCount = issues.filter(issue => issue.level === 'info').length;

    return {
      isValid: errorCount === 0,
      issues,
      summary: {
        totalResources: 0, // Will be set by caller
        totalOutputs: 0,   // Will be set by caller
        totalModules: 0,   // Will be set by caller
        errorCount,
        warningCount,
        infoCount
      }
    };
  }

  // Convenience methods for specific validation checks
  validateResourceExists(type: string, name: string): Effect.Effect<boolean> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      if (!state || !Array.isArray(state.resources)) {
        return false;
      }
      return state.resources.some(resource => 
        resource.type === type && resource.name === name
      );
    });
  }

  validateOutputExists(name: string): Effect.Effect<boolean> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      if (!state || !state.outputs) {
        return false;
      }
      return name in state.outputs;
    });
  }

  getValidationReport(): Effect.Effect<string> {
    return Effect.gen(this, function* (_) {
      const result = yield* _(this.validate());
      
      let report = 'State Validation Report\n';
      report += `${'='.repeat(50)}\n\n`;
      
      if (result.isValid) {
        report += '✅ State is valid!\n\n';
      } else {
        report += '❌ State has validation issues\n\n';
      }

      report += 'Summary:\n';
      report += `  • Errors: ${result.summary.errorCount}\n`;
      report += `  • Warnings: ${result.summary.warningCount}\n`;
      report += `  • Info: ${result.summary.infoCount}\n\n`;

      if (result.issues.length > 0) {
        report += 'Issues:\n';
        for (const issue of result.issues) {
          const icon = issue.level === 'error' ? '❌' : 
                      issue.level === 'warning' ? '⚠️' : 'ℹ️';
          report += `${icon} [${issue.code}] ${issue.message}\n`;
          if (issue.resource) {
            report += `   Resource: ${issue.resource}\n`;
          }
          if (issue.module) {
            report += `   Module: ${issue.module}\n`;
          }
          if (issue.suggestion) {
            report += `   Suggestion: ${issue.suggestion}\n`;
          }
          report += '\n';
        }
      }

      return report;
    });
  }
}
