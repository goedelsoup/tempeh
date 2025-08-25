import * as Effect from 'effect/Effect';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { writeJsonFile, readJsonFile } from '@tempeh/utils';
import { logger } from '@tempeh/utils';
import type { StateInfo } from '@tempeh/types';
import type { BackupInfo } from './backup';

export interface StateBackupManagerOptions {
  backupDir: string;
  maxBackups?: number;
}

export class StateBackupManager {
  private backupDir: string;
  private maxBackups: number;

  constructor(options: StateBackupManagerOptions) {
    this.backupDir = options.backupDir;
    this.maxBackups = options.maxBackups || 10;
  }

  createBackup(state: StateInfo, name?: string): Effect.Effect<string, Error> {
    return Effect.gen(this, function* () {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = name || `state-backup-${timestamp}`;
      const backupFile: string = `${this.backupDir}/${backupName}.json`;

      yield* logger.debug(`Creating backup: ${backupFile}`);
      yield* writeJsonFile(backupFile, state);

      return backupFile;
    });
  }

  listBackups(): Effect.Effect<BackupInfo[], Error> {
    return Effect.gen(this, function* () {
      yield* logger.debug(`Listing backups from ${this.backupDir}`);
      
      const files = yield* Effect.promise(() => readdir(this.backupDir));
      const backupFiles = files.filter(file => file.endsWith('.json'));
      const backups: BackupInfo[] = [];

      for (const file of backupFiles) {
        try {
          const filePath = join(this.backupDir, file);
          const stats = yield* Effect.promise(() => stat(filePath));
          const state = yield* readJsonFile<StateInfo>(filePath);
          
          if (state?.version && state?.terraformVersion) {
            const stateInfo = state as StateInfo;
            backups.push({
              filename: file,
              path: filePath,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              stateVersion: stateInfo.version,
              terraformVersion: stateInfo.terraformVersion
            });
          }
        } catch {
          yield* logger.warn(`Failed to read backup file: ${file}`);
        }
      }
      
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  restoreBackup(backupFile: string): Effect.Effect<StateInfo, Error> {
    return Effect.gen(this, function* (_) {
      yield* logger.debug(`Restoring backup: ${backupFile}`);
      return yield* readJsonFile<StateInfo>(backupFile);
    });
  }

  deleteBackup(backupFile: string): Effect.Effect<void, Error> {
    return Effect.gen(this, function* () {
      yield* logger.debug(`Deleting backup: ${backupFile}`);
      yield* Effect.promise(() => unlink(backupFile));
    });
  }

  rotateBackups(keepCount?: number): Effect.Effect<number, Error> {
    return Effect.gen(this, function* () {
      const maxBackups = keepCount || this.maxBackups;
      const backups = yield* this.listBackups();
      
      if (backups.length > maxBackups) {
        const toDelete = backups.slice(maxBackups);
        
        for (const backup of toDelete) {
          yield* this.deleteBackup(backup.path);
          yield* logger.debug(`Rotated backup: ${backup.filename}`);
        }
        
        return toDelete.length;
      }
      
      return 0;
    });
  }

  createBackupFromFile(stateFile: string, name?: string): Effect.Effect<string, Error> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(readJsonFile<StateInfo>(stateFile));
      return yield* _(this.createBackup(state, name));
    });
  }

  getBackupStats(): Effect.Effect<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | undefined;
    newestBackup: Date | undefined;
  }, Error> {
    return Effect.gen(this, function* (_) {
      const backups = yield* _(this.listBackups());
      
      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          oldestBackup: undefined,
          newestBackup: undefined
        };
      }
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const oldestBackup = backups[backups.length - 1]?.createdAt;
      const newestBackup = backups[0]?.createdAt;
      
      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup,
        newestBackup
      };
    });
  }
}
