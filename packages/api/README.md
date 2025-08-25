# @tempeh/api

## Overview

The `@tempeh/api` package provides shared interfaces and service contracts for the Tempeh CLI engine. It defines the core abstractions that enable different components to communicate and interact with the CDKTF engine in a consistent manner.

## Intent

This package serves as the foundation for the Tempeh architecture by:

- **Defining Service Contracts**: Establishing clear interfaces for engine operations, state management, and service interactions
- **Enabling Loose Coupling**: Allowing components to depend on abstractions rather than concrete implementations
- **Supporting Extensibility**: Providing interfaces that can be implemented by different providers or extensions
- **Ensuring Consistency**: Maintaining uniform APIs across the entire Tempeh ecosystem

## Architecture

### Core Interfaces

#### BaseEngine
The fundamental engine interface that defines the basic operations any Tempeh engine must support:
- `initialize()` - Set up the engine with required resources
- `validate()` - Validate current state and configuration
- `getStatus()` - Retrieve engine health and status information

#### StateManager
Interface for managing Terraform state operations:
- `loadState()` - Load current state from storage
- `saveState()` - Persist state to storage
- `createBackup()` - Create state backup
- `restoreBackup()` - Restore from backup

#### CdktfEngine
Extended interface for CDKTF-specific operations:
- `deploy()` - Deploy infrastructure changes
- `destroy()` - Destroy infrastructure
- `plan()` - Generate deployment plan
- `diff()` - Show differences between states
- `synth()` - Synthesize CDKTF code
- `validate()` - Validate configuration
- `list()` - List available stacks

### Service Interfaces

The package also defines interfaces for various services:
- **Engine Services**: Core engine operations and lifecycle management
- **State Services**: State persistence, backup, and restoration
- **Validation Services**: Configuration and state validation
- **Security Services**: Security scanning and audit capabilities

## Usage

```typescript
import type { BaseEngine, StateManager, CdktfEngine } from '@tempeh/api';

// Implement engine interfaces
class MyEngine implements BaseEngine, CdktfEngine {
  // Implementation details...
}

// Use interfaces for dependency injection
class TempehCLI {
  constructor(private engine: BaseEngine, private stateManager: StateManager) {}
}
```

## Dependencies

- `@tempeh/types` - Shared type definitions

## Design Principles

1. **Interface Segregation**: Each interface has a single, well-defined responsibility
2. **Effect-based**: All operations return Effect types for proper error handling
3. **Immutable**: Interfaces define read-only contracts
4. **Extensible**: Designed to support future enhancements and plugins
