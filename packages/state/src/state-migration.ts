import * as Effect from 'effect/Effect';
import { logger } from '@tempeh/utils';
import type { StateInfo } from '@tempeh/types';

export interface MigrationResult {
  success: boolean;
  migratedState?: StateInfo;
  warnings: string[];
  errors: string[];
}

export interface MigrationRule {
  name: string;
  description: string;
  version: string;
  apply: (state: StateInfo) => StateInfo;
  validate: (state: StateInfo) => boolean;
}

export class StateMigrationManager {
  private migrations: MigrationRule[] = [];

  constructor() {
    this.registerDefaultMigrations();
  }

  registerMigration(migration: MigrationRule): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  migrateState(state: StateInfo, targetVersion?: string): Effect.Effect<MigrationResult, Error> {
    return Effect.gen(this, function* (_) {
      const result: MigrationResult = {
        success: false,
        warnings: [],
        errors: []
      };

      const currentVersion = state.version;
      const target = targetVersion || this.getLatestVersion();
      
      yield* _(logger.info(`Migrating state from version ${currentVersion} to ${target}`));
      
      if (currentVersion === target) {
        result.success = true;
        result.migratedState = state;
        return result;
      }

      let migratedState = { ...state };
      const applicableMigrations = this.getApplicableMigrations(currentVersion, target);

      for (const migration of applicableMigrations) {
        try {
          yield* _(logger.debug(`Applying migration: ${migration.name}`));
          
          if (!migration.validate(migratedState)) {
            result.warnings.push(`Migration ${migration.name} validation failed, but continuing`);
          }
          
          migratedState = migration.apply(migratedState);
          result.warnings.push(`Applied migration: ${migration.name}`);
        } catch (error) {
          const errorMsg = `Failed to apply migration ${migration.name}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          yield* _(logger.error(errorMsg));
        }
      }

      if (result.errors.length === 0) {
        migratedState.version = target;
        result.success = true;
        result.migratedState = migratedState;
        yield* _(logger.info('State migration completed successfully'));
      } else {
        yield* _(logger.error('State migration failed due to errors'));
      }

      return result;
    });
  }

  private getApplicableMigrations(fromVersion: string, toVersion: string): MigrationRule[] {
    return this.migrations.filter(migration => {
      const migrationVersion = migration.version;
      return migrationVersion > fromVersion && migrationVersion <= toVersion;
    });
  }

  private getLatestVersion(): string {
    if (this.migrations.length === 0) {
      return '1.0.0';
    }
    return this.migrations[this.migrations.length - 1]?.version || '1.0.0';
  }

  private registerDefaultMigrations(): void {
    // Example migration: Add missing fields to state
    this.registerMigration({
      name: 'add-missing-fields',
      description: 'Add missing fields to state structure',
      version: '1.1.0',
      apply: (state: StateInfo) => {
        // Add any missing fields with defaults
        return {
          ...state,
          outputs: state.outputs || {},
          resources: state.resources || []
        };
      },
      validate: (_state: StateInfo) => {
        return true; // Always valid
      }
    });
  }

  validateState(state: StateInfo): Effect.Effect<{ isValid: boolean; issues: string[] }, Error> {
    const issues: string[] = [];
    
    try {
      // Basic validation
      if (!state.version) {
        issues.push('Missing state version');
      }
      if (!state.terraformVersion) {
        issues.push('Missing terraform version');
      }
      if (!Array.isArray(state.resources)) {
        issues.push('Resources must be an array');
      }
      if (typeof state.outputs !== 'object') {
        issues.push('Outputs must be an object');
      }
      
      return Effect.succeed({ isValid: issues.length === 0, issues });
    } catch {
      return Effect.succeed({ isValid: false, issues: ['State validation failed'] });
    }
  }
}
