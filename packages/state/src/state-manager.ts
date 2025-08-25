import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import { readJsonFile, writeJsonFile, ensureDirectory } from '@tempeh/utils';
import { logger } from '@tempeh/utils';
import type { StateInfo, StateResource } from '@tempeh/types';
import { StateValidator } from './state-validator';
import type { ValidationResult } from './types';

export interface StateManagerOptions {
  stateFile?: string;
  backupDir?: string;
  autoBackup?: boolean;
}

export class StateManager {
  private stateFile: string;
  private backupDir: string;
  private autoBackup: boolean;
  private validator: StateValidator;

  constructor(private state: Ref.Ref<StateInfo>, options: StateManagerOptions = {}) {
    this.stateFile = options.stateFile || 'terraform.tfstate';
    this.backupDir = options.backupDir || '.tempeh/backups';
    this.autoBackup = options.autoBackup ?? true;
    this.validator = new StateValidator(state);
  }

  loadState(): Effect.Effect<StateInfo, Error> {
    return Effect.gen(this, function* (_) {
      yield* _(logger.debug(`Loading state from ${this.stateFile}`));
      return yield* _(readJsonFile<StateInfo>(this.stateFile));
    });
  }

  saveState(state: StateInfo): Effect.Effect<void, Error> {
    return Effect.gen(this, function* (_) {
      if (this.autoBackup && this.state)
        yield* _(this.createBackup());
      yield* _(logger.debug(`Saving state to ${this.stateFile}`))
      return yield* _(writeJsonFile(this.stateFile, state))
    });
  }

  createBackup(): Effect.Effect<string, Error> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return Effect.gen(this, function* (_) {
      yield* _(ensureDirectory(this.backupDir));
      const backupFile = `${this.backupDir}/state-backup-${timestamp}.json`;
      yield* _(logger.debug(`Creating backup: ${backupFile}`));
      yield* _(writeJsonFile(backupFile, this.state));
      return backupFile;
    });
  }

  restoreBackup(backupFile: string): Effect.Effect<StateInfo, Error> {
    return Effect.gen(this, function* (_) {
      const backedUpState = yield* _(readJsonFile<StateInfo>(backupFile));
      yield* _(Ref.update(this.state, (_) => backedUpState));
      return backedUpState;
    });
  }

  getState(): Effect.Effect<StateInfo> {
    return Ref.get(this.state);
  }

  setState(state: StateInfo) {
    return Ref.update(this.state, (_) => state);
  }

  getOutputs(): Effect.Effect<Record<string, unknown>, Error> {
    return this.getState()
      .pipe(Effect.map(i => i.outputs));
  }

  getOutput(name: string): Effect.Effect<unknown, Error> {
    return Effect.gen(this, function* (_) {
      const outputs: Record<string, unknown> = yield* _(this.getOutputs());
      return outputs[name];
    })
  }

  getResources(): Effect.Effect<StateResource[]> {
    return this.getState()
      .pipe(Effect.map(i => i.resources));
  }

  getResource(type: string, name: string): Effect.Effect<StateResource, Error> {
    const resource = Effect.runSync(this.getResources())
      .find(resource => resource.type === type && resource.name === name);
    if (!resource) {
      return Effect.fail(new Error("Invalid"))
    }
    return Effect.succeed(resource);
  }

  // Alias for backward compatibility with tests
  findResource(type: string, name: string): Effect.Effect<StateResource, Error> {
    return this.getResource(type, name);
  }

  // State validation methods
  validateState(): Effect.Effect<ValidationResult> {
    return this.validator.validate();
  }

  getValidationReport(): Effect.Effect<string> {
    return this.validator.getValidationReport();
  }

  validateResourceExists(type: string, name: string): Effect.Effect<boolean> {
    return this.validator.validateResourceExists(type, name);
  }

  validateOutputExists(name: string): Effect.Effect<boolean> {
    return this.validator.validateOutputExists(name);
  }
}
