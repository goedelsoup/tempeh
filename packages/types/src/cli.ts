// ============================================================================
// CLI Command Types
// ============================================================================

export interface CommandOptions {
  verbose?: boolean;
  quiet?: boolean;
  config?: string;
}

export interface GlobalOptions extends CommandOptions {
  workingDir?: string;
  stateFile?: string;
}
