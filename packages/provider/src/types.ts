// ============================================================================
// Provider Types
// ============================================================================

export interface ProviderInfo {
  name: string;
  version: string;
  source: string;
  constraints?: string;
}

export interface ProviderGenerationOptions {
  providers: ProviderInfo[];
  outputDir?: string;
  language?: 'typescript' | 'python' | 'java' | 'csharp' | 'go';
  force?: boolean;
}

export interface ProviderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  providers: ProviderInfo[];
}

export interface ProviderConfig {
  terraformProviders: string[];
}

// ============================================================================
// Provider Validation Types
// ============================================================================

export interface ProviderValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Provider Registry Types
// ============================================================================

export interface ProviderRegistryInfo {
  name: string;
  version: string;
  source: string;
  description?: string;
  documentation?: string;
  constraints?: string;
}

export interface ProviderRegistrySearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'version' | 'downloads';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Provider Discovery Types
// ============================================================================

export interface ProviderDiscoveryResult {
  providers: ProviderRegistryInfo[];
  totalCount: number;
  query: string;
  timestamp: Date;
  source: 'registry' | 'cache' | 'fallback' | 'category';
}

export interface ProviderCompatibilityInfo {
  provider: ProviderInfo;
  cdktfCompatible: boolean;
  terraformVersion: string;
  cdktfVersion: string;
  languageSupport: string[];
  issues: string[];
  warnings: string[];
}

export interface ProviderUsageStats {
  provider: ProviderInfo;
  filePath: string;
  usageType: 'import' | 'resource' | 'data';
  lineCount: number;
}

export interface ProviderSuggestion {
  provider: ProviderInfo;
  confidence: number;
  reason: string;
  category: string;
}
