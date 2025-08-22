# Tempeh CLI

A modern CLI wrapper around CDKTF with improved workflows and state management.

## Building the Executable

This CLI can be bundled into a standalone executable that includes all dependencies.

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Build Commands

From the CLI package directory:
```bash
# Install dependencies
pnpm install

# Build the full executable (bundled)
pnpm run build:executable

# Build the simple executable (external dependencies)
pnpm run build:simple

# Build both and create distribution package
pnpm run distribute
```

From the workspace root:
```bash
# Build the CLI executable
pnpm run cli:build

# Create distribution package
pnpm run cli:distribute
```

### Build Output

Two types of executables are created:

#### Full Executable (`dist/tempeh`)
- **Size**: ~27MB
- **Dependencies**: Self-contained, includes all dependencies
- **Use case**: Standalone distribution
- **Limitations**: May have issues with native modules

#### Simple Executable (`dist/tempeh-simple`)
- **Size**: ~1.7MB
- **Dependencies**: Requires CDKTF dependencies to be installed separately
- **Use case**: Development environments, CI/CD pipelines
- **Requirements**: Run `npm install cdktf @cdktf/cli-core` in your project

```bash
# Run the full executable
./dist/tempeh --help

# Run the simple executable (requires dependencies)
npm install cdktf @cdktf/cli-core
./dist/tempeh-simple --help

# Copy to PATH
cp dist/tempeh /usr/local/bin/tempeh
# or
cp dist/tempeh-simple /usr/local/bin/tempeh
```

### Development

For development with watch mode:
```bash
# Watch mode for TypeScript compilation
pnpm run dev

# Watch mode for executable bundling
pnpm run bundle:watch
```

### Build Process

The build process consists of two steps:

1. **TypeScript Compilation**: Compiles TypeScript to JavaScript
2. **esbuild Bundling**: Bundles all dependencies into a single executable file

The esbuild configuration:
- Bundles all dependencies except Node.js built-ins
- Targets Node.js 18+
- Creates a CommonJS bundle
- Adds a proper shebang (`#!/usr/bin/env node`)
- Makes the output file executable

### Distribution

The distribution script creates a complete release package with both executable types:

```bash
# Create distribution package
pnpm run distribute
```

This creates a `release/` directory containing:
- `tempeh-{version}-full` - Full executable (~27MB)
- `tempeh-{version}-simple` - Simple executable (~1.7MB)
- `README.md` - Installation and usage instructions
- `install.sh` - Automated installation script

#### Installation Options

**Option 1: Full Executable (Recommended for end users)**
```bash
./release/install.sh
```

**Option 2: Simple Executable (Recommended for development)**
```bash
./release/install.sh simple
```

#### Alternative Distribution Methods

For true standalone distribution (no Node.js required), consider using tools like:
- [pkg](https://github.com/vercel/pkg) - Bundles Node.js apps into standalone executables
- [nexe](https://github.com/nexe/nexe) - Another Node.js bundler

## Usage

```bash
# Initialize a new project
tempeh init

# Scan for existing CDKTF projects
tempeh scan

# List available resources
tempeh list

# Deploy infrastructure
tempeh deploy

# Plan changes
tempeh plan

# Destroy infrastructure
tempeh destroy

# Manage state
tempeh state

# Backup state
tempeh backup

# Restore state
tempeh restore
```

## Configuration

The CLI supports configuration via:
- Command line options
- Configuration files
- Environment variables

See the main documentation for detailed configuration options.
