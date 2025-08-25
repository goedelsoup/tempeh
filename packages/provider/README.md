# @tempeh/provider

## Overview

The `@tempeh/provider` package provides comprehensive provider management capabilities for the Tempeh CLI, handling Terraform provider discovery, installation, configuration, and lifecycle management. It integrates with CDKTF's provider system to ensure proper provider handling and code generation.

## Intent

This package serves as the provider management foundation for the Tempeh system by:

- **Provider Discovery**: Automatically discover and catalog available Terraform providers
- **Provider Installation**: Manage provider installation and version management
- **Provider Configuration**: Handle provider configuration and authentication
- **Code Generation**: Integrate with CDKTF's code generation for provider bindings
- **Provider Validation**: Validate provider configurations and compatibility
- **Provider Lifecycle**: Manage provider lifecycle and updates

## Architecture

### Core Components

#### ProviderManager (`provider-manager.ts`)
The main provider management interface that orchestrates all provider operations:
- **Provider Installation**: Install and manage Terraform providers
- **Provider Configuration**: Configure provider settings and authentication
- **Provider Validation**: Validate provider configurations and compatibility
- **Provider Updates**: Manage provider updates and version migrations
- **Provider Cleanup**: Clean up unused or outdated providers

#### ProviderDiscovery (`provider-discovery.ts`)
Handles provider discovery and cataloging:
- **Provider Discovery**: Discover available providers from various sources
- **Provider Cataloging**: Catalog providers with metadata and capabilities
- **Provider Search**: Search for providers by name, type, or capabilities
- **Provider Metadata**: Extract and manage provider metadata
- **Provider Compatibility**: Check provider compatibility with CDKTF

#### Provider Types (`types.ts`)
Type definitions for provider management:
- **Provider Definitions**: Define provider structures and metadata
- **Configuration Schemas**: Define provider configuration schemas
- **Installation Options**: Define provider installation options and parameters
- **Validation Rules**: Define provider validation rules and constraints

## Usage

```typescript
import { 
  ProviderManager, 
  ProviderDiscoveryManager 
} from '@tempeh/provider';

// Initialize provider manager
const providerManager = new ProviderManager();

// Discover available providers
const discoveryManager = new ProviderDiscoveryManager();
const providers = await discoveryManager.discoverProviders();

// Install a provider
await providerManager.installProvider({
  name: 'aws',
  version: '~> 5.0',
  source: 'hashicorp/aws'
});

// Configure provider
await providerManager.configureProvider('aws', {
  region: 'us-west-2',
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Validate provider configuration
const validation = await providerManager.validateProvider('aws');

// Generate provider bindings
await providerManager.generateBindings({
  providers: ['aws', 'google'],
  outputDir: './generated',
  language: 'typescript'
});

// Update provider
await providerManager.updateProvider('aws', {
  version: '~> 5.1'
});
```

## Dependencies

- `@tempeh/api` - Engine interfaces and provider contracts
- `@tempeh/types` - Shared type definitions
- `@tempeh/utils` - Utility functions for provider operations
- `@cdktf/provider-generator` - CDKTF provider code generation
- `@cdktf/provider-schema` - CDKTF provider schema handling

## Design Principles

1. **Automation**: Automate provider discovery and installation processes
2. **Compatibility**: Ensure compatibility with CDKTF and Terraform versions
3. **Security**: Implement secure provider installation and configuration
4. **Performance**: Optimize provider operations for speed and efficiency
5. **Reliability**: Ensure reliable provider management with error recovery
6. **Extensibility**: Support for custom providers and provider sources

## Provider Management Features

### Provider Discovery

Advanced provider discovery capabilities:

- **Registry Discovery**: Discover providers from Terraform registry
- **Local Discovery**: Discover locally installed providers
- **Custom Sources**: Support for custom provider sources and registries
- **Metadata Extraction**: Extract comprehensive provider metadata
- **Compatibility Checking**: Check provider compatibility with current environment

### Provider Installation

Comprehensive provider installation:

- **Version Management**: Manage provider versions and dependencies
- **Dependency Resolution**: Resolve provider dependencies automatically
- **Installation Verification**: Verify provider installation integrity
- **Rollback Support**: Support for installation rollback on failures
- **Cleanup Operations**: Clean up failed or incomplete installations

### Provider Configuration

Flexible provider configuration:

- **Configuration Validation**: Validate provider configurations
- **Environment Integration**: Integrate with environment variables and secrets
- **Configuration Templates**: Support for configuration templates
- **Configuration Migration**: Migrate configurations between versions
- **Configuration Documentation**: Generate configuration documentation

### Code Generation

Integration with CDKTF code generation:

- **Binding Generation**: Generate provider bindings for supported languages
- **Schema Processing**: Process provider schemas for code generation
- **Type Generation**: Generate TypeScript types from provider schemas
- **Documentation Generation**: Generate provider documentation
- **Example Generation**: Generate usage examples for providers

## Provider Lifecycle

The package manages the complete provider lifecycle:

### Installation Phase
- Provider discovery and selection
- Dependency resolution and validation
- Installation execution and verification
- Post-installation configuration

### Configuration Phase
- Configuration validation and processing
- Environment integration and secret management
- Configuration persistence and backup
- Configuration testing and verification

### Usage Phase
- Provider availability and health checking
- Configuration validation and updates
- Performance monitoring and optimization
- Error handling and recovery

### Maintenance Phase
- Provider updates and version management
- Configuration migration and updates
- Cleanup of unused providers
- Performance optimization and tuning

## Security Features

The provider package includes security features:

- **Provider Verification**: Verify provider authenticity and integrity
- **Secure Installation**: Secure provider installation with checksums
- **Configuration Security**: Secure handling of sensitive configuration
- **Access Control**: Control access to provider operations
- **Audit Logging**: Comprehensive audit logging for provider operations

## Error Handling

Comprehensive error handling for provider operations:

- **Installation Errors**: Handle provider installation failures
- **Configuration Errors**: Handle configuration validation errors
- **Compatibility Errors**: Handle compatibility and version conflicts
- **Network Errors**: Handle network-related errors during discovery
- **Recovery Strategies**: Provide recovery strategies for common errors
