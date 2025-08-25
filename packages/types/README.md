# @tempeh/types

## Overview

The `@tempeh/types` package provides shared TypeScript type definitions and interfaces used throughout the Tempeh CLI ecosystem. It serves as the central repository for all type definitions, ensuring consistency and type safety across all packages.

## Intent

This package serves as the type foundation for the Tempeh system by:

- **Type Safety**: Providing comprehensive TypeScript types for all Tempeh operations
- **Consistency**: Ensuring uniform type definitions across all packages
- **Documentation**: Serving as living documentation for data structures and interfaces
- **Interoperability**: Enabling type-safe communication between different Tempeh components
- **Developer Experience**: Providing excellent IntelliSense and compile-time error detection

## Architecture

### Core Type Categories

#### CLI Types (`cli.ts`)
Types related to command-line interface operations:
- Command definitions and options
- CLI configuration structures
- Command execution results
- Interactive prompt types

#### Configuration Types (`config.ts`)
Types for configuration management:
- Project configuration schemas
- Environment-specific settings
- Plugin configuration structures
- Validation rule definitions

#### Error Types (`error.ts`)
Comprehensive error type definitions:
- `TempehError` - Base error class with structured error information
- Error codes and categories
- Error context and metadata
- Error recovery strategies

#### Plugin Types (`plugin.ts`)
Types for the plugin system:
- Plugin interfaces and contracts
- Plugin lifecycle management
- Plugin capabilities and permissions
- Plugin validation and security

#### Security Types (`security.ts`)
Security-related type definitions:
- Security scan results
- Vulnerability assessments
- Security policy definitions
- Audit trail structures

#### Service Types (`services.ts`)
Types for service layer operations:
- Service interfaces and contracts
- Service discovery and registration
- Service health and status
- Service communication protocols

#### State Types (`state.ts`)
Types for state management:
- State structures and schemas
- State migration definitions
- State validation rules
- State backup and restore types

### CDKTF Integration Types

The package includes specific types for CDKTF integration:

```typescript
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
```

### Utility Types

The package provides useful utility types:

- `DeepPartial<T>` - Makes all properties of T optional recursively
- `Optional<T, K>` - Makes specific keys K optional in type T
- `RequiredFields<T, K>` - Makes specific keys K required in type T

## Usage

```typescript
import type { 
  TempehError, 
  CdktfConfig, 
  Plugin,
  DeepPartial 
} from '@tempeh/types';

// Use types for type safety
const config: CdktfConfig = {
  language: 'typescript',
  app: 'main.ts',
  output: 'cdktf.out',
  codeMakerOutput: 'generated',
  projectId: 'my-project',
  sendCrashReports: false
};

// Use utility types
type PartialConfig = DeepPartial<CdktfConfig>;
```

## Dependencies

This package has minimal dependencies to avoid circular dependencies:
- No runtime dependencies
- Only development dependencies for TypeScript compilation

## Design Principles

1. **Comprehensive Coverage**: All data structures used in Tempeh have corresponding types
2. **Strict Typing**: Types are as specific as possible to catch errors at compile time
3. **Documentation**: All types include JSDoc comments for clarity
4. **Extensibility**: Types are designed to be easily extended for future features
5. **Consistency**: Naming conventions and patterns are consistent throughout

## Type Safety Benefits

- **Compile-time Error Detection**: Catch type mismatches before runtime
- **IntelliSense Support**: Excellent IDE autocomplete and documentation
- **Refactoring Safety**: Confident refactoring with type checking
- **API Documentation**: Types serve as living API documentation
- **Team Collaboration**: Shared understanding of data structures
