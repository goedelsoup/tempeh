# @tempeh/utils

## Overview

The `@tempeh/utils` package provides shared utility functions, helpers, and common functionality used across the Tempeh CLI ecosystem. It contains reusable code for logging, file operations, configuration management, plugin handling, and security operations.

## Intent

This package serves as the utility foundation for the Tempeh system by:

- **Code Reuse**: Providing common functionality to avoid duplication across packages
- **Consistency**: Ensuring uniform behavior for common operations like logging and file handling
- **Plugin System**: Managing plugin loading, validation, and lifecycle
- **Security**: Providing security scanning and audit capabilities
- **Configuration**: Handling configuration validation and management
- **Error Handling**: Providing standardized error handling utilities

## Architecture

### Core Utility Modules

#### Logger (`logger.ts`)
Centralized logging system with configurable levels and outputs:
- Structured logging with different log levels
- Configurable output formats (JSON, text, etc.)
- Log rotation and file management
- Performance monitoring and metrics

#### File Operations (`file.ts`)
File system utilities and helpers:
- Safe file reading and writing operations
- Path manipulation and validation
- File existence and permission checks
- Directory creation and cleanup utilities

#### Process Management (`process.ts`)
Process execution and management utilities:
- Safe subprocess execution
- Process monitoring and control
- Signal handling and cleanup
- Cross-platform process compatibility

#### Configuration (`config.ts`, `config-validator.ts`)
Configuration management and validation:
- Configuration file loading and parsing
- Schema validation and type checking
- Environment-specific configuration
- Configuration merging and inheritance

#### Plugin System (`plugin-manager.ts`, `plugin-registry.ts`, `plugin-loader.ts`)
Comprehensive plugin management:
- **PluginManager**: Core plugin lifecycle management
- **PluginRegistry**: Plugin discovery and registration
- **PluginLoader**: Dynamic plugin loading and validation

#### Security (`security-audit-manager.ts`, `security-scanners.ts`)
Security scanning and audit capabilities:
- **SecurityAuditManager**: Orchestrates security audits
- **SecurityScanners**: Various security scanning implementations
- Vulnerability detection and reporting
- Security policy enforcement

#### Validation (`validation.ts`)
General validation utilities:
- Schema validation helpers
- Type checking utilities
- Custom validation rule support
- Validation error formatting

#### Error Handling (`error.ts`)
Error management utilities:
- Error creation and formatting
- Error context and metadata
- Error recovery strategies
- Error reporting and logging

## Usage

```typescript
import { 
  Logger, 
  FileUtils, 
  PluginManager,
  SecurityAuditManager,
  ConfigValidator 
} from '@tempeh/utils';

// Initialize logger
const logger = new Logger({ level: 'info' });
logger.info('Starting Tempeh operation');

// File operations
const content = await FileUtils.readFile('/path/to/config.json');
await FileUtils.writeFile('/path/to/output.json', data);

// Plugin management
const pluginManager = new PluginManager();
await pluginManager.loadPlugin('/path/to/plugin');

// Security audit
const securityManager = new SecurityAuditManager();
const auditResult = await securityManager.runAudit(config);

// Configuration validation
const validator = new ConfigValidator();
const isValid = await validator.validate(config);
```

## Dependencies

- `@tempeh/types` - Shared type definitions for utilities

## Design Principles

1. **Single Responsibility**: Each utility module has a focused, well-defined purpose
2. **Error Safety**: All utilities handle errors gracefully and provide meaningful error messages
3. **Cross-platform**: Utilities work consistently across different operating systems
4. **Performance**: Utilities are optimized for performance and minimal overhead
5. **Extensibility**: Utilities are designed to be easily extended and customized
6. **Testing**: All utilities have comprehensive test coverage

## Plugin System Architecture

The plugin system provides a robust foundation for extending Tempeh:

### PluginManager
- **Loading**: Dynamic plugin loading from various sources
- **Validation**: Plugin integrity and security validation
- **Lifecycle**: Plugin enable/disable and cleanup
- **Discovery**: Automatic plugin discovery and registration

### PluginRegistry
- **Registration**: Central plugin registry with metadata
- **Lookup**: Fast plugin lookup by ID or capabilities
- **Dependencies**: Plugin dependency management
- **Versioning**: Plugin version compatibility checking

### PluginLoader
- **Dynamic Loading**: Runtime plugin loading and unloading
- **Security**: Plugin sandboxing and permission checking
- **Validation**: Plugin manifest and code validation
- **Error Recovery**: Graceful handling of plugin failures

## Security Features

The security utilities provide comprehensive security capabilities:

- **Vulnerability Scanning**: Automated security vulnerability detection
- **Policy Enforcement**: Security policy validation and enforcement
- **Audit Trails**: Comprehensive security audit logging
- **Compliance**: Support for various security compliance frameworks
- **Real-time Monitoring**: Continuous security monitoring and alerting
