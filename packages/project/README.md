# @tempeh/project

## Overview

The `@tempeh/project` package provides project management capabilities for the Tempeh CLI, handling project initialization, configuration, lifecycle management, and project-specific operations. It serves as the foundation for managing CDKTF projects within the Tempeh ecosystem.

## Intent

This package serves as the project management foundation for the Tempeh system by:

- **Project Initialization**: Setting up new CDKTF projects with proper structure and configuration
- **Project Configuration**: Managing project-specific settings and configurations
- **Project Lifecycle**: Handling project creation, updates, and cleanup operations
- **Project Validation**: Validating project structure and configuration integrity
- **Project Discovery**: Discovering and managing multiple projects in a workspace
- **Project Templates**: Supporting project templates and scaffolding

## Architecture

### Core Components

#### ProjectManager (`project-manager.ts`)
The main project management interface that orchestrates all project operations:
- **Project Creation**: Create new projects with proper initialization
- **Project Loading**: Load and validate existing projects
- **Project Configuration**: Manage project configuration and settings
- **Project Validation**: Validate project structure and dependencies
- **Project Discovery**: Discover projects in a workspace or directory

#### Project Types (`types.ts`)
Type definitions for project management:
- **Project Structure**: Define project directory structure and organization
- **Configuration Schemas**: Define project configuration schemas and validation rules
- **Project Metadata**: Define project metadata and versioning information
- **Template Definitions**: Define project template structures and parameters

## Usage

```typescript
import { ProjectManager } from '@tempeh/project';

// Initialize project manager
const projectManager = new ProjectManager();

// Create a new project
const project = await projectManager.createProject({
  name: 'my-infrastructure',
  template: 'typescript',
  directory: '/path/to/project',
  configuration: {
    language: 'typescript',
    app: 'main.ts',
    output: 'cdktf.out',
    codeMakerOutput: 'generated',
    projectId: 'my-project',
    sendCrashReports: false
  }
});

// Load existing project
const existingProject = await projectManager.loadProject('/path/to/existing/project');

// Validate project
const validation = await projectManager.validateProject(project);

// Discover projects in workspace
const projects = await projectManager.discoverProjects('/path/to/workspace');

// Update project configuration
await projectManager.updateProject(project, {
  configuration: {
    ...project.configuration,
    sendCrashReports: true
  }
});
```

## Dependencies

- `@tempeh/api` - Engine interfaces and project contracts
- `@tempeh/types` - Shared type definitions
- `@tempeh/utils` - Utility functions for file operations and validation

## Design Principles

1. **Simplicity**: Project management operations are simple and intuitive
2. **Consistency**: Project structure and configuration follow consistent patterns
3. **Validation**: All project operations include comprehensive validation
4. **Extensibility**: Project management can be extended with custom templates and configurations
5. **Observability**: All project operations provide detailed logging and feedback
6. **Error Handling**: Robust error handling with meaningful error messages

## Project Management Features

### Project Initialization

The package supports comprehensive project initialization:

- **Template-based Creation**: Create projects from predefined templates
- **Custom Configuration**: Support for custom project configurations
- **Dependency Setup**: Automatic setup of project dependencies
- **Structure Validation**: Validate project structure after creation
- **Configuration Generation**: Generate default configuration files

### Project Templates

Support for various project templates:

- **TypeScript Template**: TypeScript-based CDKTF projects
- **Python Template**: Python-based CDKTF projects
- **Java Template**: Java-based CDKTF projects
- **C# Template**: C#-based CDKTF projects
- **Go Template**: Go-based CDKTF projects
- **Custom Templates**: Support for custom project templates

### Project Configuration

Comprehensive configuration management:

- **Configuration Validation**: Validate project configuration against schemas
- **Environment-specific Config**: Support for environment-specific configurations
- **Configuration Inheritance**: Support for configuration inheritance and overrides
- **Configuration Migration**: Migrate configurations between versions
- **Configuration Documentation**: Generate configuration documentation

### Project Discovery

Advanced project discovery capabilities:

- **Workspace Scanning**: Scan workspaces for multiple projects
- **Project Recognition**: Recognize different project types and structures
- **Dependency Analysis**: Analyze project dependencies and relationships
- **Project Indexing**: Index projects for fast lookup and discovery
- **Project Metadata**: Extract and manage project metadata

## Project Structure

The package defines a standard project structure:

```
project-root/
├── cdktf.json          # CDKTF configuration
├── package.json        # Node.js dependencies
├── tsconfig.json       # TypeScript configuration
├── main.ts            # Main application entry point
├── generated/         # Generated provider code
├── cdktf.out/         # CDKTF output directory
├── .tempeh/           # Tempeh-specific configuration
└── README.md          # Project documentation
```

## Configuration Management

The package supports various configuration aspects:

- **CDKTF Configuration**: Manage CDKTF-specific configuration
- **Tempeh Configuration**: Manage Tempeh-specific settings
- **Environment Configuration**: Handle environment-specific settings
- **Plugin Configuration**: Manage plugin-specific configurations
- **Security Configuration**: Handle security-related settings

## Error Handling

The project package implements comprehensive error handling:

- **Validation Errors**: Handle configuration and structure validation errors
- **Template Errors**: Handle template-related errors and missing templates
- **Dependency Errors**: Handle dependency resolution and installation errors
- **Permission Errors**: Handle file system permission errors
- **Recovery Strategies**: Provide recovery strategies for common errors
