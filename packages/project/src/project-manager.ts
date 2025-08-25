
import type { PathLike } from 'node:fs';

import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';

import type { TempehError } from '@tempeh/types';
import { createTempehError } from '@tempeh/utils';
import type { ProjectId } from './types';

// ============================================================================
// Project Manager Implementation
// ============================================================================
type Result<T> = Effect.Effect<T, TempehError>;
type RawProjectEntry = Record<string, unknown>;
type VoidResult = Result<void>;

export class ProjectManagerImpl {
  private projects: Ref.Ref<RawProjectEntry[]>;

  constructor(
    private base: PathLike,
  ) {
    this.projects = Ref.unsafeMake([] as RawProjectEntry[]);
  }

  // ============================================================================
  // Project Management
  // ============================================================================

  listProjects(): Result<RawProjectEntry[]> {
    return this.projects.get;
  }

  getProject(id: ProjectId): Result<RawProjectEntry> {
    const program = Effect.gen(this, function* () {
      const projects = yield* this.projects.get;
      const maybeProject = this.findProjectById(projects, id);
      return maybeProject
        .pipe(Effect.mapErrorCause(this.handleNotFound(id)))
    });
    return program.pipe(Effect.flatten);
  }

  createProject(id: ProjectId, _options?: RawProjectEntry): Result<RawProjectEntry> {
    const program = Effect.gen(this, function* () {
      yield* this.getProject(id).pipe(Effect.flip)
        .pipe(Effect.mapError(e => createTempehError(
          `Entity ${e.id} already exists`,
          'DUPLICATE_PROJECT_ID',
        )));
      return { id, name: id };
    });
    return program;
  }

  deleteProject(id: ProjectId): VoidResult {
    const program = Effect.gen(this, function* () {
      yield* this.getProject(id);
      const deleteAction = yield* Ref.update(this.projects, (a) => a);
      return deleteAction;
    });
    return program;
  }

  scanProjects(): Result<RawProjectEntry> {
    return Effect.succeed({
      totalProjects: 0,
      cdktfProjects: 0,
      terraformProjects: 0,
      projects: []
    });
  }

  private findProjectById(projects: RawProjectEntry[], id: ProjectId): Option.Option<RawProjectEntry> {
    const result = projects.find(entry => entry[id]);
    return result ? Option.some(result) : Option.none();
  }

  private handleNotFound(id: ProjectId) {
    return (e: Cause.Cause<Cause.NoSuchElementException>) => createTempehError(
      `Project not found: ${id} - ${e[Cause.CauseTypeId]}`,
      'PROJECT_NOT_FOUND'
    ).pipe(Cause.fail);
  }
}
