# Contributing to Tempeh CLI

Thank you for your interest in contributing to Tempeh CLI! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PNPM 8.15+
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/tempeh.git
   cd tempeh
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Pre-commit Hooks**
   ```bash
   pnpm prepare
   ```

4. **Build the Project**
   ```bash
   pnpm build
   ```

5. **Run Tests**
   ```bash
   pnpm test
   ```

## 📋 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style and patterns
- Write tests for new functionality
- Update documentation as needed

### 3. Run Quality Checks

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# Tests
pnpm test
```

### 4. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new command for state inspection"
git commit -m "fix: resolve issue with backup creation"
git commit -m "docs: update README with new examples"
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

## 🏗️ Project Structure

### Packages

- **`@tempeh/types`**: Shared TypeScript type definitions
- **`@tempeh/utils`**: Common utilities (file operations, validation, etc.)
- **`@tempeh/state`**: State management functionality
- **`@tempeh/core`**: Core CDKTF wrapper and workflow engine
- **`@tempeh/cli`**: Command-line interface

### Adding New Commands

1. Create a new file in `packages/cli/src/commands/`
2. Export a registration function
3. Import and register it in `packages/cli/src/cli.ts`

Example:

```typescript
// packages/cli/src/commands/my-command.ts
import { Command } from 'commander';
import { logger } from '@tempeh/utils';

export function registerMyCommand(program: Command): void {
  program
    .command('my-command')
    .description('Description of my command')
    .option('-f, --flag', 'Optional flag')
    .action(async (options) => {
      try {
        logger.info('Executing my command...');
        // Implementation here
      } catch (error) {
        logger.error('Command failed:', error);
        process.exit(1);
      }
    });
}
```

### Adding New Utilities

1. Create functions in the appropriate package
2. Export them from the package's `index.ts`
3. Add tests in the corresponding test file

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm test --filter=@tempeh/cli

# With coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### Writing Tests

- Use Vitest for testing
- Write unit tests for all new functionality
- Include integration tests for CLI commands
- Aim for good test coverage

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/my-module';

describe('myFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });

  it('should throw error for invalid input', () => {
    expect(() => myFunction('')).toThrow('Invalid input');
  });
});
```

## 📝 Code Style

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Follow naming conventions

### Formatting

- Use Biome for formatting and linting
- Run `pnpm format` before committing
- Follow the existing code style

### Error Handling

- Use the `@tempeh/utils` error utilities
- Provide meaningful error messages
- Include suggestions for fixing issues

```typescript
import { createTempehError } from '@tempeh/utils';

throw createTempehError(
  'Failed to load configuration',
  'CONFIG_LOAD_ERROR',
  [
    'Check if the config file exists',
    'Verify the JSON format is valid'
  ],
  { configPath: '/path/to/config.json' }
);
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include examples in comments
- Document complex algorithms

### User Documentation

- Update README.md for user-facing changes
- Add examples for new commands
- Update configuration documentation

## 🔍 Code Review Process

1. **Create Pull Request**
   - Provide a clear description
   - Link related issues
   - Include screenshots for UI changes

2. **Review Checklist**
   - [ ] Code follows project style
   - [ ] Tests are included and passing
   - [ ] Documentation is updated
   - [ ] No breaking changes (or documented)

3. **Address Feedback**
   - Respond to review comments
   - Make requested changes
   - Request re-review when ready

## 🐛 Reporting Issues

### Bug Reports

Include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and logs

### Feature Requests

Include:
- Description of the feature
- Use cases and benefits
- Implementation suggestions (if any)
- Priority level

## 🎯 Contribution Areas

### High Priority

- Bug fixes
- Performance improvements
- Security enhancements
- Documentation improvements

### Medium Priority

- New commands
- Enhanced error messages
- Additional state management features
- Workflow improvements

### Low Priority

- Cosmetic improvements
- Additional examples
- Minor optimizations

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-org/tempeh/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/tempeh/discussions)
- **Email**: support@tempeh.dev

## 🙏 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame

Thank you for contributing to Tempeh CLI! 🍽️
