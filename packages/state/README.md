# @tempeh/state

## Overview

The `@tempeh/state` package provides enhanced state management utilities for the Tempeh CLI, focusing on Terraform state operations, backup, migration, and validation. It offers a robust foundation for managing infrastructure state with advanced features like state inspection, backup strategies, and migration tools.

## Intent

This package serves as the state management foundation for the Tempeh system by:

- **State Persistence**: Providing reliable state storage and retrieval mechanisms
- **Backup & Recovery**: Implementing comprehensive backup and restore capabilities
- **State Migration**: Supporting state format migrations and upgrades
- **State Validation**: Ensuring state integrity and consistency
- **State Inspection**: Providing tools to analyze and understand state contents
- **Rollback Support**: Enabling safe state rollbacks for failed operations

## Architecture

### Core Components

#### StateManager (`state-manager.ts`)
The central state management interface that orchestrates all state operations:
- **State Loading**: Load state from various sources (local files, remote backends)
- **State Saving**: Persist state with proper locking and concurrency control
- **State Locking**: Implement distributed locking for collaborative environments
- **State Validation**: Validate state integrity before and after operations

#### StateInspector (`state-inspector.ts`)
Advanced state analysis and inspection capabilities:
- **Resource Analysis**: Analyze resource dependencies and relationships
- **State Diffing**: Compare different state versions and identify changes
- **Resource Discovery**: Find and categorize resources by type, tags, or other criteria
- **State Statistics**: Generate statistics and metrics about state contents

#### StateBackup (`state-backup.ts`, `backup/`)
Comprehensive backup and restore functionality:
- **Backup Strategies**: Multiple backup strategies (incremental, full, differential)
- **Backup Scheduling**: Automated backup scheduling and retention policies
- **Backup Verification**: Verify backup integrity and completeness
- **Restore Operations**: Safe restore operations with validation

#### StateMigration (`state-migration.ts`, `migration/`)
State format migration and upgrade tools:
- **Version Migration**: Migrate between different state format versions
- **Schema Updates**: Handle schema changes and data transformations
- **Migration Validation**: Validate migration results and rollback capabilities
- **Migration History**: Track migration history and dependencies

#### StateValidator (`state-validator.ts`)
State validation and integrity checking:
- **Schema Validation**: Validate state against expected schemas
- **Consistency Checks**: Ensure state consistency across resources
- **Dependency Validation**: Validate resource dependencies and references
- **Security Validation**: Check for security issues in state contents

## Usage

```typescript
import { 
  StateManager, 
  StateInspector, 
  StateBackup,
  StateMigration,
  StateValidator 
} from '@tempeh/state';

// Initialize state manager
const stateManager = new StateManager('/path/to/state');

// Load and validate state
const state = await stateManager.loadState();
const validator = new StateValidator();
const validation = await validator.validate(state);

// Create backup
const backup = new StateBackup();
const backupPath = await backup.createBackup(state, {
  strategy: 'incremental',
  compression: true
});

// Inspect state
const inspector = new StateInspector();
const resources = await inspector.findResources(state, {
  type: 'aws_instance',
  tags: { environment: 'production' }
});

// Migrate state
const migration = new StateMigration();
await migration.migrate(state, {
  targetVersion: '1.2.0',
  validateAfterMigration: true
});
```

## Dependencies

- `@tempeh/api` - Engine interfaces and state contracts
- `@tempeh/types` - Shared type definitions
- `@tempeh/utils` - Utility functions for file operations and validation

## Design Principles

1. **Reliability**: All state operations are designed to be reliable and fault-tolerant
2. **Consistency**: State operations maintain consistency even in failure scenarios
3. **Performance**: State operations are optimized for large state files
4. **Security**: State data is protected with encryption and access controls
5. **Observability**: All state operations provide detailed logging and metrics
6. **Extensibility**: State management can be extended with custom backends and strategies

## State Management Features

### Backup Strategies

The package supports multiple backup strategies:

- **Full Backup**: Complete state backup with all resources
- **Incremental Backup**: Only backup changes since last backup
- **Differential Backup**: Backup all changes since last full backup
- **Compressed Backup**: Compressed backups to save storage space
- **Encrypted Backup**: Encrypted backups for sensitive data

### Migration Capabilities

State migration supports:

- **Version Migration**: Migrate between Terraform state versions
- **Schema Migration**: Handle resource schema changes
- **Backend Migration**: Migrate between different state backends
- **Format Migration**: Convert between different state formats

### Validation Features

State validation includes:

- **Schema Validation**: Validate state against resource schemas
- **Dependency Validation**: Ensure resource dependencies are valid
- **Reference Validation**: Validate resource references and outputs
- **Security Validation**: Check for security issues in state data

## Error Handling

The state package implements comprehensive error handling:

- **Concurrency Control**: Handle concurrent state access safely
- **Rollback Mechanisms**: Automatic rollback on failed operations
- **Error Recovery**: Graceful recovery from various error conditions
- **State Corruption**: Detection and recovery from state corruption
- **Network Issues**: Handle network failures in remote state operations
