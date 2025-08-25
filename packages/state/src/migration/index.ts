import type { StateInfo } from "@tempeh/types";

export interface MigrationResult {
  success: boolean;
  migratedState?: StateInfo;
  warnings: string[];
  errors: string[];
}