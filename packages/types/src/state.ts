// ============================================================================
// State Management Types
// ============================================================================

export interface StateInstance {
  schemaVersion: number;
  attributes: Record<string, unknown>;
  private: string;
  dependencies: string[];
}

export interface StateResource {
  module: string;
  mode: string;
  type: string;
  name: string;
  provider: string;
  instances: StateInstance[];
}

export interface StateInfo {
  version: string;
  terraformVersion: string;
  serial: number;
  lineage: string;
  outputs: Record<string, unknown>;
  resources: StateResource[];
}
