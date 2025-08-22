# Development Guide

This guide provides detailed information for developers contributing to the Tempeh CLI project.

## 🏗️ Architecture Overview

Tempeh is built as a TypeScript monorepo with the following architecture:

### Package Dependencies

```
@tempeh/cli
├── @tempeh/core
│   ├── @tempeh/state
│   │   ├── @tempeh/types
│   │   └── @tempeh/utils
│   └── @tempeh/utils
└── @tempeh/utils
```

### Technology Stack

- **TypeScript**: Latest stable version with strict mode
- **Nx**: Monorepo build orchestration and caching
- **PNPM**: Fast, efficient package manager with workspaces
- **Commander.js**: CLI framework for command parsing
- **Biome**: Code formatting and linting
- **Vitest**: Fast unit testing framework
- **Husky**: Git hooks for quality gates

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PNPM 8+
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/tempeh.git
cd tempeh

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to verify setup
pnpm test
```

### Development Workflow

```bash
# Start development mode (watch for changes)
pnpm dev

# Build specific package
pnpm nx build @tempeh/cli

# Test specific package
pnpm nx test @tempeh/core

# Run CLI in development
node packages/cli/dist/cli.js --help
```

## 📁 Project Structure

```
tempeh/
├── packages/
│   ├── cli/                 # Main CLI application
│   │   ├── src/
│   │   │   ├── commands/    # CLI command implementations
│   │   │   ├── cli.ts       # Main CLI entry point
│   │   │   └── index.ts     # Package exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── core/                # Core CDKTF wrapper logic
│   │   ├── src/
│   │   │   ├── cdktf-wrapper.ts
│   │   │   ├── workflow-engine.ts
│   │   │   ├── project-manager.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── state/               # State management utilities
│   │   ├── src/
│   │   │   ├── state-manager.ts
│   │   │   ├── state-inspector.ts
│   │   │   ├── state-backup.ts
│   │   │   ├── state-migration.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/               # Shared utilities
│   │   ├── src/
│   │   │   ├── logger.ts
│   │   │   ├── config.ts
│   │   │   ├── error.ts
│   │   │   ├── file.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── types/               # Shared TypeScript types
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── nx.json                  # Nx configuration
├── package.json             # Root package configuration
├── tsconfig.base.json       # Base TypeScript configuration
├── biome.json               # Biome linting/formatting configuration
├── vitest.config.ts         # Vitest test configuration
└── README.md
```

## 🧪 Testing

### Test Structure

Each package contains its own tests:

```
packages/cli/
├── src/
│   └── commands/
│       └── __tests__/
│           ├── version.test.ts
│           ├── deploy.test.ts
│           └── ...
└── package.json
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests for specific package
pnpm nx test @tempeh/cli

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm vitest packages/cli/src/commands/version.test.ts
```

### Writing Tests

```typescript
// Example test structure
import { describe, it, expect, vi } from 'vitest';
import { registerVersionCommand } from '../version';
import { Command } from 'commander';

describe('version command', () => {
  it('should display version information', async () => {
    const program = new Command();
    registerVersionCommand(program);
    
    // Test implementation
    expect(program.commands).toHaveLength(1);
  });
});
```

## 🔧 Code Quality

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format all packages
pnpm format

# Check formatting without changes
pnpm format:check

# Type checking
pnpm type-check
```

### Pre-commit Hooks

The project uses Husky with lint-staged for pre-commit quality gates:

```bash
# Install pre-commit hooks
pnpm prepare

# Pre-commit will automatically:
# - Run linting
# - Run type checking
# - Run tests
# - Format code
```

### Biome Configuration

The project uses Biome for consistent code style:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  }
}
```

## 📦 Adding New Commands

### 1. Create Command File

Create a new file in `packages/cli/src/commands/`:

```typescript
// packages/cli/src/commands/my-command.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { logger } from '@tempeh/utils';

export function registerMyCommand(program: Command): void {
  program
    .command('my-command')
    .description('Description of my command')
    .option('-f, --flag', 'Optional flag')
    .argument('[arg]', 'Optional argument')
    .action(async (arg, options) => {
      try {
        logger.info('Executing my command...');
        
        // Command implementation
        console.log(chalk.green('Command executed successfully!'));
        
      } catch (error) {
        logger.error('Command failed:', error);
        process.exit(1);
      }
    });
}
```

### 2. Export Command

Add export to `packages/cli/src/commands/index.ts`:

```typescript
export * from './my-command';
```

### 3. Register Command

Import and register in `packages/cli/src/cli.ts`:

```typescript
import { registerMyCommand } from './commands/my-command';

// ... existing code ...

// Register commands
registerMyCommand(program);
```

### 4. Add Tests

Create test file in `packages/cli/src/commands/__tests__/`:

```typescript
// packages/cli/src/commands/__tests__/my-command.test.ts
import { describe, it, expect, vi } from 'vitest';
import { registerMyCommand } from '../my-command';
import { Command } from 'commander';

describe('my-command', () => {
  it('should register command correctly', () => {
    const program = new Command();
    registerMyCommand(program);
    
    const command = program.commands.find(cmd => cmd.name() === 'my-command');
    expect(command).toBeDefined();
  });
});
```

## 🔄 Adding New Packages

### 1. Create Package Structure

```bash
mkdir packages/my-package
cd packages/my-package
```

### 2. Initialize Package

```bash
pnpm init
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"],
  "references": [
    { "path": "../types" },
    { "path": "../utils" }
  ]
}
```

### 4. Configure Package.json

```json
{
  "name": "@tempeh/my-package",
  "version": "0.1.0",
  "description": "Description of my package",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist node_modules tsconfig.tsbuildinfo"
  },
  "dependencies": {
    "@tempeh/types": "workspace:*",
    "@tempeh/utils": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@biomejs/biome": "^1.5.0",
    "tslib": "^2.6.0"
  }
}
```

### 5. Create Source Files

```typescript
// packages/my-package/src/index.ts
export * from './my-module';
```

```typescript
// packages/my-package/src/my-module.ts
export class MyModule {
  constructor() {
    // Implementation
  }
}
```

### 6. Update Nx Configuration

Add to `nx.json` if needed for custom build targets.

## 🚀 Building and Publishing

### Local Development

```bash
# Build all packages
pnpm build

# Build specific package
pnpm nx build @tempeh/cli

# Run CLI locally
node packages/cli/dist/cli.js --help
```

### Publishing

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Publish packages (when ready)
pnpm publish --access public
```

## 🐛 Debugging

### Debugging CLI Commands

```bash
# Run with Node.js debugger
node --inspect-brk packages/cli/dist/cli.js version

# Run with verbose logging
node packages/cli/dist/cli.js --verbose version
```

### Debugging Tests

```bash
# Run tests with debugger
node --inspect-brk node_modules/.bin/vitest packages/cli/src/commands/version.test.ts
```

### Common Issues

1. **Module Resolution**: Ensure all packages are built before running CLI
2. **Type Errors**: Run `pnpm type-check` to identify type issues
3. **Lint Errors**: Run `pnpm lint` to identify code style issues
4. **Test Failures**: Check test output for specific failure reasons

## 📚 Best Practices

### Code Style

- Use TypeScript strict mode
- Follow Biome linting rules
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Error Handling

- Use the `handleError` utility from `@tempeh/utils`
- Provide meaningful error messages
- Include context in error objects
- Log errors appropriately

### Testing

- Write tests for all new functionality
- Use descriptive test names
- Mock external dependencies
- Test both success and failure cases

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new APIs
- Update this guide for development workflow changes
- Include examples in documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the guidelines above
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes with conventional commit messages
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Message Format

Use conventional commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(cli): add new deploy command`
- `fix(core): resolve state loading issue`
- `docs(readme): update installation instructions`
- `test(utils): add tests for logger module`

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-org/tempeh/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/tempeh/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/your-org/tempeh/wiki)

---

Happy coding! 🚀
