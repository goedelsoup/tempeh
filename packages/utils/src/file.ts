import * as Effect from 'effect/Effect';
import { readFileSync, writeFileSync, existsSync, mkdirSync, type PathLike } from 'node:fs';
import { dirname } from 'node:path';
import { StateError } from '@tempeh/types';

// ============================================================================
// File System Implementation
// ============================================================================

export class FileSystem {
  readFile(path: PathLike) {
    return Effect.try({
      try: () => readFileSync(path, 'utf-8'),
      catch: (error) => new StateError({
        operation: 'readFile',
        message: `Failed to read file: ${path}`,
        cause: error,
      }),
    });
  }

  writeFile(path: PathLike, content: string) {
    return Effect.try({
      try: () => {
        const dir = typeof path === "string"
          ? dirname(path) : path.toString();
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(path, content, 'utf-8');
      },
      catch: (error) => new StateError({
        operation: 'writeFile',
        message: `Failed to write file: ${path}`,
        cause: error,
      }),
    });
  }

  exists(path: PathLike) {
    return Effect.sync(() => existsSync(path));
  }

  mkdir(path: PathLike, options?: { recursive?: boolean }) {
    return Effect.try({
      try: () => mkdirSync(path, { recursive: options?.recursive ?? false }),
      catch: (error) => new StateError({
        operation: 'mkdir',
        message: `Failed to create directory: ${path}`,
        cause: error,
      }),
    });
  }
}

// ============================================================================
// File System Factory
// ============================================================================

export const makeFileSystem = (): FileSystem => {
  return new FileSystem();
};

// ============================================================================
// Global File System Instance
// ============================================================================

export const fileSystem = makeFileSystem();

// ============================================================================
// File System Effects
// ============================================================================

export const readFile = (path: PathLike) => {
  return fileSystem.readFile(path);
};

export const writeFile = (path: PathLike, content: string) => {
  return fileSystem.writeFile(path, content);
};

export const exists = (path: PathLike) => {
  return fileSystem.exists(path);
};

export const mkdir = (path: PathLike, options?: { recursive?: boolean }) => {
  return fileSystem.mkdir(path, options);
};

// ============================================================================
// Utility Functions
// ============================================================================

export const ensureDirectory = (dirPath: PathLike) => {
  return Effect.gen(function* (_) {
    const dirExists = yield* _(exists(dirPath));
    if (!dirExists) {
      yield* _(mkdir(dirPath, { recursive: true }));
    }
  });
};

export const readJsonFile = <T>(path: PathLike) => {
  return Effect.gen(function* (_) {
    const content = yield* _(readFile(path));
    return JSON.parse(content) as T;
  });
};

export const writeJsonFile = <T>(path: PathLike, data: T) => {
  return Effect.gen(function* (_) {
    const content = JSON.stringify(data, null, 2);
    yield* _(writeFile(path, content));
  });
};
