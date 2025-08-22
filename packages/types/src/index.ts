
export * from './cli';
export * from './config';
export * from './error';
export * from './plugin';
export * from './security';
export * from './services';
export * from './state';

// ============================================================================
// CDKTF Integration Types
// ============================================================================

export type CdktfLanguage = 'typescript' | 'python' | 'java' | 'csharp' | 'go';

export interface CdktfConfig {
  language: CdktfLanguage;
  app: string;
  output: string;
  codeMakerOutput: string;
  projectId: string;
  sendCrashReports: boolean;
  terraformProviders?: string[];
  terraformModules?: string[];
}

export interface CdktfStack {
  name: string;
  config: CdktfConfig;
  workingDirectory: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
