# Tempeh - Modern CDKTF Wrapper

A modern, user-friendly wrapper around CDKTF (Cloud Development Kit for Terraform) that provides enhanced state management, workflow automation, and provider management capabilities.

## 🚀 Features

### Core CDKTF Integration
- **Deploy**: Deploy infrastructure with automatic state management
- **Destroy**: Safely destroy infrastructure with rollback capabilities
- **Plan**: Generate and parse deployment plans with detailed change analysis
- **Diff**: View infrastructure differences with enhanced output parsing
- **Synth**: Synthesize CDKTF applications with validation
- **List**: Discover and manage CDKTF stacks

### 🔄 State Management Integration
- **Automatic State Backups**: State is automatically backed up before destructive operations
- **Rollback Support**: Automatic rollback on deployment failures
- **State Inspection**: Query and analyze current infrastructure state
- **State Migration**: Migrate between different state formats
- **State Validation**: Validate state consistency and integrity

### 📦 Provider Management
- **Provider Generation**: Generate CDKTF providers with validation
- **Provider Validation**: Validate provider configurations before use
- **Provider Updates**: Update provider versions safely
- **Provider Discovery**: List available providers with version information

### ⚡ Advanced Workflows
- **Pre/Post Hooks**: Execute setup and cleanup tasks
- **Conditional Steps**: Execute steps based on file existence, state conditions, or custom logic
- **Retry Logic**: Automatic retry with exponential backoff
- **Rollback Workflows**: Define rollback procedures for error recovery
- **Parallel Execution**: Execute workflow steps in parallel
- **Dry Run Mode**: Preview workflow execution without making changes

### 🛡️ Enhanced Error Handling
- **Comprehensive Error Types**: Specific error types for different failure scenarios
- **Helpful Suggestions**: Context-aware suggestions for error resolution
- **Graceful Degradation**: Continue execution where possible
- **Detailed Logging**: Structured logging with different verbosity levels

## 📦 Installation

```bash
npm install -g @tempeh/cli
# or
pnpm add -g @tempeh/cli
```

## 🚀 Quick Start

### 1. Initialize a CDKTF Project

```bash
tempeh init
```

### 2. Generate Providers

```bash
# List available providers
tempeh provider list

# Generate providers
tempeh provider generate --providers "aws@5.0.0,google@4.0.0"

# Validate provider configuration
tempeh provider validate --providers "aws@5.0.0"
```

### 3. Create a Workflow

```bash
# Create a sample workflow
tempeh workflow create --name "production-deploy"

# Validate the workflow
tempeh workflow validate

# Execute the workflow
tempeh workflow run --dry-run
tempeh workflow run --rollback-on-error
```

### 4. Deploy Infrastructure

```bash
# Plan deployment
tempeh plan

# Deploy with state management
tempeh deploy --auto-approve

# Check state
tempeh state inspect
```

## 📋 Command Reference

### Core Commands

```bash
# Initialize project
tempeh init [options]

# Deploy infrastructure
tempeh deploy [options]

# Destroy infrastructure
tempeh destroy [options]

# Plan changes
tempeh plan [options]

# Synthesize application
tempeh synth [options]

# Show differences
tempeh diff [options]

# List stacks
tempeh list [options]
```

### State Management

```bash
# Inspect state
tempeh state inspect [options]

# Create backup
tempeh backup [options]

# Restore backup
tempeh restore <backup-file> [options]

# Scan for issues
tempeh scan [options]
```

### Provider Management

```bash
# List available providers
tempeh provider list

# Generate providers
tempeh provider generate --providers "aws@5.0.0,google@4.0.0" [options]

# Validate providers
tempeh provider validate --providers "aws@5.0.0" [options]

# Update provider versions
tempeh provider update --providers "aws@5.1.0" [options]
```

### Workflow Management

```bash
# Create workflow
tempeh workflow create --name "my-workflow" [options]

# Validate workflow
tempeh workflow validate --file "workflow.json" [options]

# Execute workflow
tempeh workflow run --file "workflow.json" [options]
```

## 🔧 Configuration

### Workflow Configuration

Create a `tempeh-workflow.json` file:

```json
{
  "name": "production-deploy",
  "description": "Production deployment workflow",
  "required": true,
  "preHooks": [
    {
      "name": "backup-state",
      "description": "Create state backup",
      "command": "backup-state"
    }
  ],
  "steps": [
    {
      "name": "synthesize",
      "description": "Synthesize CDKTF app",
      "command": "synth",
      "cdktfOptions": {
        "stack": "production"
      }
    },
    {
      "name": "plan",
      "description": "Create deployment plan",
      "command": "plan",
      "cdktfOptions": {
        "stack": "production",
        "refresh": true
      },
      "retry": {
        "maxAttempts": 3,
        "delayMs": 1000,
        "backoffMultiplier": 2
      }
    },
    {
      "name": "deploy",
      "description": "Deploy infrastructure",
      "command": "deploy",
      "cdktfOptions": {
        "stack": "production",
        "autoApprove": true
      },
      "condition": {
        "type": "file-exists",
        "value": "cdktf.out"
      }
    }
  ],
  "postHooks": [
    {
      "name": "verify",
      "description": "Verify deployment",
      "command": "wait",
      "args": ["5000"]
    }
  ],
  "rollbackSteps": [
    {
      "name": "destroy",
      "description": "Destroy on rollback",
      "command": "destroy",
      "cdktfOptions": {
        "stack": "production",
        "autoApprove": true
      }
    }
  ]
}
```

### Global Options

```bash
# Verbose logging
tempeh --verbose <command>

# Quiet mode
tempeh --quiet <command>

# Custom config file
tempeh --config ./tempeh.config.json <command>

# Working directory
tempeh --working-dir ./infrastructure <command>

# State file
tempeh --state-file ./terraform.tfstate <command>
```

## 🏗️ Architecture

### Core Components

- **CDKTF Engine**: Wrapper around CDKTF CLI with enhanced error handling
- **State Manager**: Manages Terraform state with backup and rollback capabilities
- **Provider Manager**: Handles CDKTF provider generation and validation
- **Workflow Engine**: Executes complex deployment workflows with conditions and retries

### Error Handling

Tempeh uses a comprehensive error handling system with specific error types:

- `TempehError`: General application errors
- `ValidationError`: Configuration validation errors
- `StateError`: State management errors
- `WrappedCDKError`: CDKTF command errors
- `WorkflowError`: Workflow execution errors

### State Management

The state management system provides:

- Automatic backups before destructive operations
- State validation and consistency checks
- Rollback capabilities on failures
- State migration between formats
- State inspection and querying

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-org/tempeh/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/tempeh/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/tempeh/discussions)

## 🔄 Changelog

### v0.1.0 - Enhanced Features Release

#### ✨ New Features
- **State Management Integration**: Automatic state backups and rollback capabilities
- **Output Parsing**: Enhanced parsing of CDKTF plan and diff outputs
- **Provider Management**: Complete provider generation and validation system
- **Advanced Workflows**: Pre/post hooks, conditional steps, retry logic, and rollback workflows

#### 🛠️ Enhanced Commands
- `tempeh provider`: Manage CDKTF providers
- `tempeh workflow`: Execute complex deployment workflows
- Enhanced `tempeh deploy` with state management
- Enhanced `tempeh plan` with output parsing
- Enhanced `tempeh diff` with captured output

#### 🔧 Technical Improvements
- Comprehensive error handling with specific error types
- Structured logging with different verbosity levels
- Workflow validation and dry-run capabilities
- Provider validation and version management
- State inspection and migration tools

#### 🐛 Bug Fixes
- Fixed state management integration issues
- Improved error message clarity
- Enhanced workflow execution reliability
- Fixed provider generation edge cases
