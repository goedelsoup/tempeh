# @tempeh/core

## Overview

The `@tempeh/core` package contains the core CDKTF wrapper logic and engine implementation for the Tempeh CLI. It provides the main `TempehEngine` class that orchestrates CDKTF operations and serves as the central hub for infrastructure management.

## Intent

This package serves as the heart of the Tempeh system by:

- **CDKTF Integration**: Providing a unified interface to CDKTF operations and workflows
- **Engine Orchestration**: Coordinating between different Tempeh components (state, workflow, providers)
- **Command Execution**: Implementing the core logic for CLI commands like deploy, plan, destroy
- **Error Handling**: Centralizing error management and recovery strategies
- **Resource Management**: Managing the lifecycle of CDKTF resources and configurations

## Architecture

### TempehEngine

The main engine class that implements the core CDKTF wrapper functionality:

#### Core Properties
- `workingDir` - The current working directory for CDKTF operations

#### Engine Operations
- `initialize()` - Set up the engine environment and validate prerequisites
- `getStatus()` - Retrieve engine health and operational status
- `deploy()` - Deploy infrastructure changes with rollback capabilities
- `destroy()` - Safely destroy infrastructure resources
- `plan()` - Generate and analyze deployment plans
- `diff()` - Compare current and target states
- `synth()` - Synthesize CDKTF code from TypeScript/JavaScript
- `validate()` - Validate configuration and state consistency
- `list()` - List available stacks and their status

### Integration Points

The core package integrates with other Tempeh packages:

- **State Management**: Uses `@tempeh/state` for state persistence and backup
- **Workflow Engine**: Leverages `@tempeh/workflow` for complex deployment workflows
- **Provider Management**: Integrates with `@tempeh/provider` for Terraform provider handling
- **Utilities**: Utilizes `@tempeh/utils` for common operations and validation

## Usage

```typescript
import { TempehEngine } from '@tempeh/core';

// Initialize the engine
const engine = new TempehEngine('/path/to/project');

// Perform operations
const status = await engine.getStatus();
const plan = await engine.plan({ stack: 'production' });
const result = await engine.deploy({ autoApprove: true });
```

## Dependencies

- `@cdktf/cli-core` - CDKTF CLI core functionality
- `@cdktf/commons` - CDKTF common utilities
- `@cdktf/hcl-tools` - HCL tooling support
- `@tempeh/api` - Engine interfaces and contracts
- `@tempeh/state` - State management capabilities
- `@tempeh/types` - Shared type definitions
- `@tempeh/utils` - Utility functions and helpers

## Design Principles

1. **Single Responsibility**: Each method has a clear, focused purpose
2. **Effect-based Error Handling**: All operations use Effect types for robust error management
3. **Immutable Operations**: Engine operations don't modify internal state unexpectedly
4. **Composability**: Engine methods can be composed into complex workflows
5. **Observability**: All operations provide detailed status and progress information

## Error Handling

The engine implements comprehensive error handling:
- **Validation Errors**: Configuration and state validation failures
- **CDKTF Errors**: Errors from underlying CDKTF operations
- **State Errors**: Issues with state management and persistence
- **Recovery Strategies**: Automatic rollback and recovery mechanisms
