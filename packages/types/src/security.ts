// ============================================================================
// Security Audit Types
// ============================================================================

export interface SecurityAudit {
  id: string;
  timestamp: Date;
  target: SecurityAuditTarget;
  results: SecurityAuditResult;
  metadata: SecurityAuditMetadata;
  recommendations: SecurityRecommendation[];
}

export interface SecurityAuditTarget {
  type: 'plugin' | 'workflow' | 'configuration' | 'state' | 'provider' | 'project' | 'custom';
  id: string;
  name: string;
  version?: string;
  path?: string;
  content?: unknown;
}

export interface SecurityAuditResult {
  overallScore: number;
  riskLevel: SecurityRiskLevel;
  passed: boolean;
  vulnerabilities: SecurityVulnerability[];
  compliance: ComplianceResult[];
  scanDuration: number;
  scanDetails: SecurityScanDetails;
}

export interface SecurityRiskLevel {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  color: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: SecurityVulnerabilityCategory;
  title: string;
  description: string;
  cve?: string;
  cvss?: number;
  affectedComponent: string;
  location?: string;
  evidence?: string;
  remediation: string;
  references?: string[];
  discoveredAt: Date;
  status: 'open' | 'fixed' | 'ignored' | 'false-positive';
  tags?: string[];
}

export type SecurityVulnerabilityCategory = 
  | 'code-injection'
  | 'command-injection'
  | 'path-traversal'
  | 'privilege-escalation'
  | 'data-exposure'
  | 'authentication-bypass'
  | 'authorization-bypass'
  | 'input-validation'
  | 'output-encoding'
  | 'cryptographic-weakness'
  | 'dependency-vulnerability'
  | 'configuration-misuse'
  | 'resource-exhaustion'
  | 'logging-information'
  | 'custom';

export interface ComplianceResult {
  framework: string;
  version: string;
  passed: boolean;
  score: number;
  checks: ComplianceCheck[];
  summary: string;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  remediation?: string;
  references?: string[];
}

export interface SecurityScanDetails {
  scanner: string;
  version: string;
  scanType: SecurityScanType;
  rulesApplied: string[];
  scanOptions: Record<string, unknown>;
  coverage: SecurityScanCoverage;
}

export type SecurityScanType = 
  | 'static-analysis'
  | 'dependency-scan'
  | 'configuration-audit'
  | 'runtime-analysis'
  | 'compliance-check'
  | 'custom';

export interface SecurityScanCoverage {
  filesScanned: number;
  linesScanned: number;
  dependenciesScanned: number;
  configurationsScanned: number;
  coveragePercentage: number;
}

export interface SecurityAuditMetadata {
  auditor: string;
  auditType: string;
  environment: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, unknown>;
}

export interface SecurityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: SecurityRecommendationCategory;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
  references?: string[];
  estimatedTime?: string;
  estimatedCost?: string;
}

export type SecurityRecommendationCategory = 
  | 'immediate-fix'
  | 'short-term'
  | 'long-term'
  | 'process-improvement'
  | 'training'
  | 'tooling'
  | 'custom';

// ============================================================================
// Security Scanner Types
// ============================================================================

export interface SecurityScanner {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: SecurityScannerCapability[];
  configuration: SecurityScannerConfig;
  supportedTargets: SecurityAuditTarget['type'][];
}

export interface SecurityScannerCapability {
  type: SecurityScanType;
  name: string;
  description: string;
  supportedLanguages?: string[];
  supportedFrameworks?: string[];
  customRules?: boolean;
}

export interface SecurityScannerConfig {
  enabled: boolean;
  scanTypes: SecurityScanType[];
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  maxScanDuration: number;
  customRules?: SecurityRule[];
  exclusions?: string[];
  outputFormats: SecurityOutputFormat[];
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: SecurityVulnerabilityCategory;
  enabled: boolean;
  custom?: boolean;
}

export type SecurityOutputFormat = 'json' | 'sarif' | 'html' | 'csv' | 'xml';

// ============================================================================
// Security Audit Manager Types
// ============================================================================

export interface SecurityAuditManager {
  registerScanner: (scanner: SecurityScanner) => Promise<void>;
  unregisterScanner: (scannerId: string) => Promise<void>;
  getScanner: (scannerId: string) => SecurityScanner | undefined;
  listScanners: () => SecurityScanner[];
  
  auditTarget: (target: SecurityAuditTarget, options?: SecurityAuditOptions) => Promise<SecurityAudit>;
  auditPlugin: (pluginId: string, options?: SecurityAuditOptions) => Promise<SecurityAudit>;
  auditWorkflow: (workflowPath: string, options?: SecurityAuditOptions) => Promise<SecurityAudit>;
  auditConfiguration: (configPath: string, options?: SecurityAuditOptions) => Promise<SecurityAudit>;
  auditProject: (projectPath: string, options?: SecurityAuditOptions) => Promise<SecurityAudit>;
  
  getAuditHistory: (targetId?: string, options?: SecurityAuditHistoryOptions) => Promise<SecurityAudit[]>;
  getAuditReport: (auditId: string) => Promise<SecurityAuditReport>;
  exportAuditResults: (auditId: string, format: SecurityOutputFormat) => Promise<string>;
  
  updateVulnerabilityStatus: (auditId: string, vulnerabilityId: string, status: SecurityVulnerability['status']) => Promise<void>;
  addCustomRule: (rule: SecurityRule) => Promise<void>;
  removeCustomRule: (ruleId: string) => Promise<void>;
}

export interface SecurityAuditOptions {
  scanners?: string[];
  scanTypes?: SecurityScanType[];
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  complianceFrameworks?: string[];
  customRules?: SecurityRule[];
  exclusions?: string[];
  timeout?: number;
  parallel?: boolean;
  detailed?: boolean;
}

export interface SecurityAuditHistoryOptions {
  startDate?: Date;
  endDate?: Date;
  targetType?: SecurityAuditTarget['type'];
  riskLevel?: SecurityRiskLevel['level'];
  limit?: number;
  offset?: number;
}

export interface SecurityAuditReport {
  audit: SecurityAudit;
  summary: SecurityAuditSummary;
  details: SecurityAuditDetails;
  trends: SecurityAuditTrends;
  recommendations: SecurityRecommendation[];
}

export interface SecurityAuditSummary {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  complianceScore: number;
  overallRiskScore: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface SecurityAuditDetails {
  vulnerabilitiesByCategory: Record<SecurityVulnerabilityCategory, SecurityVulnerability[]>;
  vulnerabilitiesBySeverity: Record<SecurityVulnerability['severity'], SecurityVulnerability[]>;
  complianceResults: ComplianceResult[];
  scanCoverage: SecurityScanCoverage;
}

export interface SecurityAuditTrends {
  vulnerabilityTrend: SecurityTrendData[];
  complianceTrend: SecurityTrendData[];
  riskScoreTrend: SecurityTrendData[];
  scanDurationTrend: SecurityTrendData[];
}

export interface SecurityTrendData {
  date: Date;
  value: number;
  change: number;
  changePercentage: number;
}

// ============================================================================
// Security Compliance Types
// ============================================================================

export interface SecurityComplianceFramework {
  id: string;
  name: string;
  version: string;
  description: string;
  category: SecurityComplianceCategory;
  checks: SecurityComplianceCheck[];
  scoring: SecurityComplianceScoring;
}

export type SecurityComplianceCategory = 
  | 'infrastructure'
  | 'application'
  | 'data-protection'
  | 'access-control'
  | 'monitoring'
  | 'incident-response'
  | 'custom';

export interface SecurityComplianceCheck {
  id: string;
  name: string;
  description: string;
  category: SecurityComplianceCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  implementation: SecurityComplianceCheckImplementation;
}

export interface SecurityComplianceCheckImplementation {
  type: 'rule' | 'script' | 'api' | 'custom';
  rule?: SecurityRule;
  script?: string;
  api?: string;
  custom?: unknown;
}

export interface SecurityComplianceScoring {
  method: 'weighted' | 'simple' | 'custom';
  weights?: Record<string, number>;
  thresholds: SecurityComplianceThresholds;
}

export interface SecurityComplianceThresholds {
  pass: number;
  warning: number;
  fail: number;
}

// ============================================================================
// Security Monitoring Types
// ============================================================================

export interface SecurityMonitoring {
  startMonitoring: (target: SecurityAuditTarget, options?: SecurityMonitoringOptions) => Promise<void>;
  stopMonitoring: (targetId: string) => Promise<void>;
  getMonitoringStatus: (targetId: string) => Promise<SecurityMonitoringStatus>;
  getMonitoringEvents: (targetId: string, options?: SecurityMonitoringEventOptions) => Promise<SecurityMonitoringEvent[]>;
  
  setAlertThresholds: (targetId: string, thresholds: SecurityAlertThresholds) => Promise<void>;
  getAlertHistory: (targetId: string, options?: SecurityAlertHistoryOptions) => Promise<SecurityAlert[]>;
  
  enableRealTimeScanning: (targetId: string) => Promise<void>;
  disableRealTimeScanning: (targetId: string) => Promise<void>;
}

export interface SecurityMonitoringOptions {
  scanInterval: number;
  alertThresholds: SecurityAlertThresholds;
  realTimeScanning: boolean;
  eventRetention: number;
  integrations?: SecurityMonitoringIntegration[];
}

export interface SecurityMonitoringStatus {
  targetId: string;
  active: boolean;
  lastScan: Date;
  nextScan: Date;
  realTimeScanning: boolean;
  alertCount: number;
  eventCount: number;
}

export interface SecurityMonitoringEvent {
  id: string;
  targetId: string;
  timestamp: Date;
  type: SecurityMonitoringEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, unknown>;
  actionTaken?: string;
}

export type SecurityMonitoringEventType = 
  | 'vulnerability-detected'
  | 'compliance-violation'
  | 'suspicious-activity'
  | 'configuration-change'
  | 'access-attempt'
  | 'custom';

export interface SecurityAlertThresholds {
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  complianceViolations: number;
  suspiciousActivities: number;
}

export interface SecurityAlert {
  id: string;
  targetId: string;
  timestamp: Date;
  type: SecurityAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  details: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export type SecurityAlertType = 
  | 'threshold-exceeded'
  | 'new-vulnerability'
  | 'compliance-violation'
  | 'suspicious-activity'
  | 'scan-failure'
  | 'custom';

export interface SecurityMonitoringIntegration {
  type: 'email' | 'slack' | 'webhook' | 'custom';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface SecurityMonitoringEventOptions {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: SecurityMonitoringEventType[];
  severity?: SecurityMonitoringEvent['severity'][];
  limit?: number;
  offset?: number;
}

export interface SecurityAlertHistoryOptions {
  startDate?: Date;
  endDate?: Date;
  alertTypes?: SecurityAlertType[];
  severity?: SecurityAlert['severity'][];
  acknowledged?: boolean;
  resolved?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Security Policy Types
// ============================================================================

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  rules: SecurityPolicyRule[];
  enforcement: SecurityPolicyEnforcement;
  metadata: SecurityPolicyMetadata;
}

export interface SecurityPolicyRule {
  id: string;
  name: string;
  description: string;
  condition: SecurityPolicyCondition;
  action: SecurityPolicyAction;
  priority: number;
  enabled: boolean;
}

export interface SecurityPolicyCondition {
  type: 'vulnerability' | 'compliance' | 'configuration' | 'custom';
  criteria: Record<string, unknown>;
  operator: 'and' | 'or' | 'not';
}

export interface SecurityPolicyAction {
  type: 'block' | 'warn' | 'log' | 'custom';
  parameters: Record<string, unknown>;
}

export interface SecurityPolicyEnforcement {
  mode: 'strict' | 'permissive' | 'custom';
  autoRemediation: boolean;
  manualApproval: boolean;
  escalationThreshold: number;
}

export interface SecurityPolicyMetadata {
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  tags?: string[];
  notes?: string;
}
