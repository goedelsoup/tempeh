# Tempeh CLI End-to-End Testing

This directory contains end-to-end tests for the Tempeh CLI using [Judo](https://github.com/judo-project/judo), a powerful testing framework for command-line applications.

## Overview

The tests are designed to verify that the Tempeh CLI works correctly in real-world scenarios, including:

- ✅ Basic CLI functionality (help, version)
- ✅ Command discovery and help text
- ✅ Project initialization
- ✅ Plan and deploy operations
- ✅ Workflow management
- ✅ Configuration management
- ✅ State management
- ✅ Integration with CDKTF projects

## Test Structure

```
testing/
├── judo.yaml                    # Judo configuration
├── run-judo-tests.sh           # Test runner script
├── README.md                   # This file
└── scenarios/                  # Test scenarios
    ├── cli-help.judo.yaml      # Basic CLI help tests
    ├── cli-init.judo.yaml      # Project initialization tests
    ├── cli-plan-deploy.judo.yaml # Plan and deploy tests
    ├── cli-workflow.judo.yaml  # Workflow command tests
    ├── cli-config.judo.yaml    # Configuration management tests
    ├── cli-state.judo.yaml     # State management tests
    └── cli-integration.judo.yaml # Integration tests with real projects
```

## Prerequisites

1. **Judo**: Install Judo testing framework
   ```bash
   # Install Judo (check https://github.com/judo-project/judo for latest instructions)
   # Example: npm install -g @judo-project/judo
   ```

2. **Built CLI**: Ensure the CLI is built
   ```bash
   pnpm build
   ```

## Running Tests

### Quick Start

Run all tests with the provided script:

```bash
cd testing
./run-judo-tests.sh
```

### Manual Testing

Run individual test scenarios:

```bash
cd testing
judo run scenarios/cli-help.judo.yaml
judo run scenarios/cli-init.judo.yaml
# ... etc
```

### Running All Scenarios

```bash
cd testing
judo run scenarios/*.judo.yaml
```

## Test Scenarios

### 1. CLI Help Tests (`cli-help.judo.yaml`)
- Tests basic CLI functionality
- Verifies help text and command discovery
- Tests version command
- Tests invalid command handling

### 2. Init Tests (`cli-init.judo.yaml`)
- Tests project initialization
- Verifies working directory handling
- Tests error conditions
- Tests verbose output

### 3. Plan & Deploy Tests (`cli-plan-deploy.judo.yaml`)
- Tests plan and deploy commands
- Verifies error handling for missing projects
- Tests various command options
- Tests JSON output format

### 4. Workflow Tests (`cli-workflow.judo.yaml`)
- Tests workflow command functionality
- Verifies workflow creation
- Tests workflow validation
- Tests workflow execution

### 5. Config Tests (`cli-config.judo.yaml`)
- Tests configuration management
- Verifies config validation
- Tests config display
- Tests error handling

### 6. State Tests (`cli-state.judo.yaml`)
- Tests state management commands
- Verifies state backup/restore
- Tests state listing and display
- Tests error conditions

### 7. Integration Tests (`cli-integration.judo.yaml`)
- Tests CLI with real CDKTF projects
- Verifies end-to-end workflows
- Tests multiple commands in sequence
- Tests with actual project files

## Configuration

The `judo.yaml` file configures the testing environment:

```yaml
setup:
  cli_path: "../cli/release/tempeh-simple"  # Path to CLI executable
  test_dir: "./test-workspace"              # Test workspace directory
  temp_dir: "./temp"                        # Temporary files directory
  
env:
  NODE_ENV: test
  TEMPEH_TEST_MODE: "true"
  TEMPEH_LOG_LEVEL: "info"
```

## Test Output

Tests produce structured output including:

- ✅ **Pass/Fail status** for each test
- 📊 **Test summary** with counts
- 🔍 **Detailed output** for debugging
- 📝 **JSON results** file (optional)

## Adding New Tests

To add new test scenarios:

1. Create a new `.judo.yaml` file in `scenarios/`
2. Follow the existing pattern:
   ```yaml
   ---
   name: Test Name
   description: Test description
   
   setup:
     - command1
     - command2
   
   run:
     test_name:
       command: "{{cli_path}} your-command"
       expectCode: 0
       outputContains:
         - "Expected output"
       outputDoesntContain:
         - "Unexpected output"
   
   teardown:
     - cleanup_command
   ```

3. Add the new test to `run-judo-tests.sh`

## Troubleshooting

### Common Issues

1. **CLI not found**: Ensure `pnpm build` has been run
2. **Permission denied**: Make sure the CLI executable has execute permissions
3. **Judo not found**: Install Judo testing framework
4. **Test failures**: Check the test output for specific error messages

### Debug Mode

Run tests with verbose output:

```bash
judo run --verbose scenarios/cli-help.judo.yaml
```

### Environment Variables

Set custom environment variables:

```bash
export TEMPEH_LOG_LEVEL=debug
./run-judo-tests.sh
```

## Contributing

When adding new CLI features:

1. ✅ Add unit tests in `cli/src/commands/__tests__/`
2. ✅ Add integration tests in `testing/scenarios/`
3. ✅ Update this README if needed
4. ✅ Ensure all tests pass before submitting

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run CLI E2E Tests
  run: |
    cd testing
    ./run-judo-tests.sh
```
