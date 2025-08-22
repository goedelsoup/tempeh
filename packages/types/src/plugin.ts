import type * as Effect from 'effect/Effect';
import type { TempehError } from './error';

// ============================================================================
// Plugin System Types
// ============================================================================

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
  dependencies?: string[];
  peerDependencies?: string[];
  capabilities: PluginCapability[];
  hooks?: PluginHooks;
  commands?: PluginCommand[];
  validators?: PluginValidator[];
  rollbackStrategies?: PluginRollbackStrategy[];
  workflowExtensions?: PluginWorkflowExtension[];
  configuration?: PluginConfiguration;
}

export interface PluginCapability {
  type: 'rollback-strategy' | 'validator' | 'command' | 'workflow-extension' | 'hook' | 'custom';
  name: string;
  description: string;
  version: string;
  configurable?: boolean;
}

export interface PluginHooks {
  preDeploy?: (context: PluginContext) => Promise<void>;
  postDeploy?: (context: PluginContext) => Promise<void>;
  preRollback?: (context: PluginContext) => Promise<void>;
  postRollback?: (context: PluginContext) => Promise<void>;
  preValidation?: (context: PluginContext) => Promise<void>;
  postValidation?: (context: PluginContext) => Promise<void>;
  onError?: (context: PluginContext, error: Error) => Promise<void>;
  onWarning?: (context: PluginContext, warning: string) => Promise<void>;
}

export interface PluginCommand {
  name: string;
  description: string;
  usage: string;
  options?: PluginCommandOption[];
  handler: (args: string[], options: Record<string, unknown>, context: PluginContext) => Promise<void>;
}

export interface PluginCommandOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  default?: unknown;
  alias?: string;
}

export interface PluginValidator {
  name: string;
  description: string;
  type: 'state' | 'configuration' | 'workflow' | 'resource' | 'custom';
  validate: (data: unknown, context: PluginContext) => Promise<PluginValidationResult>;
}

export interface PluginRollbackStrategy {
  name: string;
  description: string;
  type: 'automatic' | 'manual' | 'selective' | 'progressive' | 'custom';
  execute: (context: PluginContext, options: RollbackOptions) => Promise<RollbackResult>;
  validate?: (context: PluginContext) => Promise<PluginValidationResult>;
}

export interface PluginWorkflowExtension {
  name: string;
  description: string;
  type: 'step' | 'condition' | 'hook' | 'validator' | 'custom';
  execute: (context: PluginContext, data: unknown) => Promise<WorkflowExtensionResult>;
}

export interface PluginConfiguration {
  schema: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  validation?: (config: Record<string, unknown>) => Promise<PluginValidationResult>;
}

// ============================================================================
// Plugin Context and Results
// ============================================================================

export interface PluginContext {
  plugin: Plugin;
  workingDirectory: string;
  configuration: Record<string, unknown>;
  state?: unknown;
  workflow?: unknown;
  logger: PluginLogger;
  utils: PluginUtils;
  hooks: PluginHookManager;
}

export interface PluginLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

export interface PluginUtils {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  readJson: (path: string) => Promise<unknown>;
  writeJson: (path: string, data: unknown) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string) => Promise<void>;
  glob: (pattern: string) => Promise<string[]>;
  exec: (command: string, args?: string[]) => Promise<{ stdout: string; stderr: string; code: number }>;
}

export interface PluginHookManager {
  register: (name: string, handler: (context: PluginContext, ...args: unknown[]) => Promise<void>) => void;
  unregister: (name: string) => void;
  call: (name: string, context: PluginContext, ...args: unknown[]) => Promise<void>;
}

export interface PluginValidationResult {
  isValid: boolean;
  errors: PluginValidationError[];
  warnings: PluginValidationWarning[];
  info: PluginValidationInfo[];
}

export interface PluginValidationError {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  suggestion?: string;
}

export interface PluginValidationWarning {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  suggestion?: string;
}

export interface PluginValidationInfo {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface RollbackResult {
  success: boolean;
  steps: RollbackStep[];
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface RollbackStep {
  name: string;
  type: string;
  success: boolean;
  duration: number;
  error?: string;
}

export interface RollbackOptions {
  strategy: string;
  context: Record<string, unknown>;
  timeout?: number;
  force?: boolean;
}

export interface WorkflowExtensionResult {
  success: boolean;
  data?: unknown;
  errors: string[];
  warnings: string[];
  nextStep?: string;
  skipRemaining?: boolean;
}

// ============================================================================
// Plugin Manager Types
// ============================================================================

export interface PluginManager {
  loadPlugin: (path: string) => Effect.Effect<Plugin, TempehError>;
  unloadPlugin: (pluginId: string) => Effect.Effect<void, TempehError>;
  getPlugin: (pluginId: string) => Plugin | undefined;
  listPlugins: () => Plugin[];
  enablePlugin: (pluginId: string) => Effect.Effect<void, TempehError>;
  disablePlugin: (pluginId: string) => Effect.Effect<void, TempehError>;
  getEnabledPlugins: () => Plugin[];
  executeCommand: (pluginId: string, commandName: string, args: string[], options: Record<string, unknown>) => Effect.Effect<void, TempehError>;
  validateWithPlugins: (type: string, data: unknown) => Effect.Effect<PluginValidationResult, TempehError>;
  executeRollbackStrategy: (strategyName: string, context: PluginContext, options: RollbackOptions) => Effect.Effect<RollbackResult, TempehError>;
  executeWorkflowExtension: (extensionName: string, context: PluginContext, data: unknown) => Effect.Effect<WorkflowExtensionResult, TempehError>;
  callHooks: (hookName: string, context: PluginContext, ...args: unknown[]) => Effect.Effect<void, TempehError>;
}

export interface PluginRegistry {
  register: (plugin: Plugin) => void;
  unregister: (pluginId: string) => void;
  get: (pluginId: string) => Plugin | undefined;
  list: () => Plugin[];
  findByCapability: (capability: string) => Plugin[];
  findByKeyword: (keyword: string) => Plugin[];
}

export interface PluginLoader {
  loadFromPath: (path: string) => Effect.Effect<Plugin, TempehError>;
  loadFromPackage: (packageName: string) => Effect.Effect<Plugin, TempehError>;
  loadFromUrl: (url: string) => Effect.Effect<Plugin, TempehError>;
  validatePlugin: (plugin: Plugin) => Effect.Effect<PluginValidationResult, TempehError>;
}

export interface PluginConfigurationManager {
  getConfiguration: (pluginId: string) => Record<string, unknown>;
  setConfiguration: (pluginId: string, config: Record<string, unknown>) => Promise<void>;
  validateConfiguration: (pluginId: string, config: Record<string, unknown>) => Promise<PluginValidationResult>;
  resetConfiguration: (pluginId: string) => Promise<void>;
}

// ============================================================================
// Plugin Discovery and Installation
// ============================================================================

export interface PluginDiscovery {
  discoverLocal: (directory: string) => Promise<Plugin[]>;
  discoverGlobal: () => Promise<Plugin[]>;
  discoverFromRegistry: (registryUrl: string) => Promise<Plugin[]>;
  search: (query: string, registryUrl?: string) => Promise<PluginSearchResult[]>;
}

export interface PluginSearchResult {
  plugin: Plugin;
  score: number;
  downloads: number;
  lastUpdated: Date;
  compatibility: CompatibilityInfo;
}

export interface CompatibilityInfo {
  tempehVersion: string;
  nodeVersion: string;
  platform: string;
  compatible: boolean;
  issues: string[];
}

export interface PluginInstaller {
  install: (pluginId: string, version?: string) => Promise<void>;
  uninstall: (pluginId: string) => Promise<void>;
  update: (pluginId: string, version?: string) => Promise<void>;
  listInstalled: () => Promise<InstalledPlugin[]>;
  checkForUpdates: () => Promise<PluginUpdate[]>;
}

export interface InstalledPlugin {
  plugin: Plugin;
  installedAt: Date;
  installedBy: string;
  version: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
}

export interface PluginUpdate {
  plugin: Plugin;
  currentVersion: string;
  availableVersion: string;
  changelog: string;
  breakingChanges: boolean;
}

// ============================================================================
// Plugin Development and Testing
// ============================================================================

export interface PluginDevelopmentKit {
  createPlugin: (template: string, options: PluginTemplateOptions) => Promise<void>;
  buildPlugin: (pluginPath: string) => Promise<void>;
  testPlugin: (pluginPath: string) => Promise<TestResult>;
  packagePlugin: (pluginPath: string, outputPath: string) => Promise<void>;
  publishPlugin: (pluginPath: string, registryUrl: string) => Promise<void>;
}

export interface PluginTemplateOptions {
  name: string;
  description: string;
  author: string;
  license: string;
  capabilities: string[];
  template: string;
}

export interface TestResult {
  success: boolean;
  tests: TestCase[];
  coverage: number;
  duration: number;
  errors: string[];
}

export interface TestCase {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

// ============================================================================
// Plugin Security and Sandboxing
// ============================================================================

export interface PluginSecurityManager {
  validatePermissions: (plugin: Plugin, requestedPermissions: string[]) => Promise<PermissionValidationResult>;
  sandboxPlugin: (plugin: Plugin, context: PluginContext) => Promise<SandboxedPlugin>;
  auditPlugin: (plugin: Plugin) => Promise<PluginSecurityAuditResult>;
}

export interface PermissionValidationResult {
  allowed: boolean;
  granted: string[];
  denied: string[];
  reason?: string;
}

export interface SandboxedPlugin {
  plugin: Plugin;
  permissions: string[];
  restrictions: string[];
  execute: (method: string, ...args: unknown[]) => Promise<unknown>;
}

export interface PluginSecurityAuditResult {
  score: number;
  vulnerabilities: PluginSecurityVulnerability[];
  recommendations: string[];
  passed: boolean;
}

export interface PluginSecurityVulnerability {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  cve?: string;
  recommendation: string;
}

// ============================================================================
// Plugin Events and Observability
// ============================================================================

export interface PluginEventEmitter {
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
  emit: (event: string, data: unknown) => void;
}

export interface PluginMetrics {
  recordExecution: (pluginId: string, method: string, duration: number, success: boolean) => void;
  recordError: (pluginId: string, error: Error) => void;
  recordUsage: (pluginId: string, feature: string) => void;
  getMetrics: (pluginId?: string) => PluginMetricsData;
}

export interface PluginMetricsData {
  executions: number;
  errors: number;
  averageDuration: number;
  usage: Record<string, number>;
  lastExecuted: Date;
}

// ============================================================================
// Plugin Documentation and Help
// ============================================================================

export interface PluginDocumentation {
  generateDocs: (plugin: Plugin) => Promise<PluginDocumentationData>;
  generateHelp: (plugin: Plugin, command?: string) => Promise<string>;
  validateDocumentation: (plugin: Plugin) => Promise<DocumentationValidationResult>;
}

export interface PluginDocumentationData {
  overview: string;
  installation: string;
  configuration: string;
  commands: CommandDocumentation[];
  examples: ExampleDocumentation[];
  api: ApiDocumentation;
}

export interface CommandDocumentation {
  name: string;
  description: string;
  usage: string;
  options: OptionDocumentation[];
  examples: string[];
}

export interface OptionDocumentation {
  name: string;
  description: string;
  type: string;
  required: boolean;
  default?: unknown;
}

export interface ExampleDocumentation {
  title: string;
  description: string;
  code: string;
  output?: string;
}

export interface ApiDocumentation {
  hooks: HookDocumentation[];
  validators: ValidatorDocumentation[];
  strategies: StrategyDocumentation[];
  extensions: ExtensionDocumentation[];
}

export interface HookDocumentation {
  name: string;
  description: string;
  parameters: ParameterDocumentation[];
  returnType: string;
  example: string;
}

export interface ValidatorDocumentation {
  name: string;
  description: string;
  type: string;
  parameters: ParameterDocumentation[];
  returnType: string;
  example: string;
}

export interface StrategyDocumentation {
  name: string;
  description: string;
  type: string;
  parameters: ParameterDocumentation[];
  returnType: string;
  example: string;
}

export interface ExtensionDocumentation {
  name: string;
  description: string;
  type: string;
  parameters: ParameterDocumentation[];
  returnType: string;
  example: string;
}

export interface ParameterDocumentation {
  name: string;
  description: string;
  type: string;
  required: boolean;
  default?: unknown;
}

export interface DocumentationValidationResult {
  valid: boolean;
  issues: DocumentationIssue[];
  score: number;
}

export interface DocumentationIssue {
  type: 'missing' | 'incomplete' | 'incorrect' | 'unclear';
  field: string;
  message: string;
  suggestion?: string;
}
