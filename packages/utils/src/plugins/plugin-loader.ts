import * as Effect from 'effect/Effect';
import { logger } from '../logger';
import { TempehError } from '@tempeh/types';
import type { Plugin, PluginLoader, PluginValidationResult } from '@tempeh/types';

// ============================================================================
// Plugin Loader Implementation
// ============================================================================

export class PluginLoaderImpl implements PluginLoader {
  loadFromPath(path: string): Effect.Effect<Plugin, TempehError> {
    return Effect.gen(function* (_) {
      yield* _(logger.debug(`Loading plugin from path: ${path}`));
      
      // Check if path exists
      const fs = yield* _(Effect.promise(() => import('node:fs/promises')));
      const pathExists = yield* _(Effect.tryPromise({
        try: () => fs.access(path).then(() => true),
        catch: () => false
      }));
      
      if (!pathExists) {
        throw new TempehError({
          code: 'PLUGIN_PATH_NOT_FOUND',
          message: `Plugin path not found: ${path}`,
          suggestions: ['Check if the path is correct', 'Ensure the plugin directory exists']
        });
      }

      // Load plugin manifest
      const manifestPath = `${path}/plugin.json`;
      const manifestExists = yield* _(Effect.tryPromise({
        try: () => fs.access(manifestPath).then(() => true),
        catch: () => false
      }));
      
      if (!manifestExists) {
        throw new TempehError({
          code: 'PLUGIN_MANIFEST_NOT_FOUND',
          message: `Plugin manifest not found: ${manifestPath}`,
          suggestions: ['Ensure plugin.json exists in the plugin directory', 'Check plugin structure']
        });
      }

      // Read and parse manifest
      const manifestContent = yield* _(Effect.tryPromise({
        try: () => fs.readFile(manifestPath, 'utf-8'),
        catch: (error) => new TempehError({
          code: 'PLUGIN_MANIFEST_READ_FAILED',
          message: `Failed to read plugin manifest: ${manifestPath}`,
          context: { path: manifestPath, error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      const manifest = yield* _(Effect.try({
        try: () => JSON.parse(manifestContent),
        catch: (error) => new TempehError({
          code: 'PLUGIN_MANIFEST_PARSE_FAILED',
          message: 'Failed to parse plugin manifest JSON',
          context: { content: manifestContent, error: error instanceof Error ? error.message : String(error) }
        })
      }));

      // Validate basic manifest structure
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new TempehError({
          code: 'PLUGIN_MANIFEST_INVALID',
          message: 'Plugin manifest is missing required fields',
          suggestions: ['Ensure id, name, and version are present in plugin.json'],
          context: { manifest }
        });
      }

      // Load plugin module
      const modulePath = `${path}/index.js`;
      const moduleExists = yield* _(Effect.tryPromise({
        try: () => fs.access(modulePath).then(() => true),
        catch: () => false
      }));
      
      if (!moduleExists) {
        throw new TempehError({
          code: 'PLUGIN_MODULE_NOT_FOUND',
          message: `Plugin module not found: ${modulePath}`,
          suggestions: ['Ensure index.js exists in the plugin directory', 'Check plugin structure']
        });
      }

      // Import plugin module
      const pluginModule = yield* _(Effect.tryPromise({
        try: () => import(modulePath),
        catch: (error) => new TempehError({
          code: 'PLUGIN_MODULE_IMPORT_FAILED',
          message: `Failed to import plugin module: ${modulePath}`,
          context: { path: modulePath, error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      if (!pluginModule.default && !pluginModule.plugin) {
        throw new TempehError({
          code: 'PLUGIN_EXPORT_INVALID',
          message: 'Plugin module does not export a valid plugin',
          suggestions: ['Ensure the plugin exports a default export or named "plugin" export'],
          context: { exports: Object.keys(pluginModule) }
        });
      }

      const plugin = pluginModule.default || pluginModule.plugin;

      // Merge manifest with plugin
      const finalPlugin: Plugin = {
        ...manifest,
        ...plugin,
        id: manifest.id,
        name: manifest.name,
        version: manifest.version
      };

      yield* _(logger.debug(`Plugin loaded successfully: ${finalPlugin.name} v${finalPlugin.version}`));
      
      return finalPlugin;
    }).pipe(
      Effect.catchAll((error) => {
        if (error instanceof TempehError) {
          return Effect.fail(error);
        }
        
        return Effect.fail(new TempehError({
          code: 'PLUGIN_LOAD_FAILED',
          message: `Failed to load plugin from path: ${path}`,
          suggestions: ['Check plugin structure and dependencies', 'Verify plugin manifest format'],
          context: { path }
        }));
      })
    );
  }

  loadFromPackage(packageName: string): Effect.Effect<Plugin, TempehError> {
    return Effect.gen(function* (_) {
      yield* _(logger.debug(`Loading plugin from package: ${packageName}`));
      
      // Check if package is installed
      const packageJsonPath = require.resolve(`${packageName}/package.json`);
      const fs = yield* _(Effect.promise(() => import('node:fs/promises')));
      const packageJsonContent = yield* _(Effect.tryPromise({
        try: () => fs.readFile(packageJsonPath, 'utf-8'),
        catch: (error) => new TempehError({
          code: 'PACKAGE_JSON_READ_FAILED',
          message: `Failed to read package.json: ${packageJsonPath}`,
          context: { packageName, error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      const packageJson = yield* _(Effect.try({
        try: () => JSON.parse(packageJsonContent),
        catch: (error) => new TempehError({
          code: 'PACKAGE_JSON_PARSE_FAILED',
          message: `Failed to parse package.json: ${packageName}`,
          context: { packageName, error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      // Check if package has tempeh plugin metadata
      if (!packageJson.tempeh || !packageJson.tempeh.plugin) {
        throw new TempehError({
          code: 'PACKAGE_NOT_TEMPEH_PLUGIN',
          message: `Package is not a Tempeh plugin: ${packageName}`,
          suggestions: ['Check if the package is designed for Tempeh', 'Verify package.json tempeh configuration']
        });
      }

      // Load plugin from package
      const pluginPath = require.resolve(packageName);
      const pluginModule = yield* _(Effect.tryPromise({
        try: () => import(pluginPath),
        catch: (error) => new TempehError({
          code: 'PLUGIN_PACKAGE_IMPORT_FAILED',
          message: `Failed to import plugin package: ${packageName}`,
          context: { packageName, error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      if (!pluginModule.default && !pluginModule.plugin) {
        throw new TempehError({
          code: 'PLUGIN_EXPORT_INVALID',
          message: `Plugin package does not export a valid plugin: ${packageName}`,
          suggestions: ['Ensure the plugin exports a default export or named "plugin" export']
        });
      }

      const plugin = pluginModule.default || pluginModule.plugin;
      
      // Merge package.json metadata with plugin
      const finalPlugin: Plugin = {
        ...packageJson.tempeh.plugin,
        ...plugin,
        id: packageJson.tempeh.plugin.id || packageName,
        name: packageJson.tempeh.plugin.name || packageJson.name,
        version: packageJson.tempeh.plugin.version || packageJson.version
      };

      yield* _(logger.debug(`Plugin package loaded successfully: ${finalPlugin.name} v${finalPlugin.version}`));
      
      return finalPlugin;
    }).pipe(
      Effect.catchAll((e) => {
        if (e instanceof TempehError) {
          return Effect.fail(e);
        }
        
        return Effect.fail(new TempehError({
          code: 'PLUGIN_PACKAGE_LOAD_FAILED',
          message: `Failed to load plugin package: ${packageName}`,
          suggestions: ['Check if package is installed', 'Verify package is a valid Tempeh plugin'],
          context: { packageName }
        }));
      })
    );
  }

  loadFromUrl(url: string): Effect.Effect<Plugin, TempehError> {
    return Effect.gen(this, function* (_) {
      yield* _(logger.debug(`Loading plugin from URL: ${url}`));
      
      // Download plugin from URL
      const fs = yield* _(Effect.promise(() => import('node:fs/promises')));
      const path = yield* _(Effect.promise(() => import('node:path')));
      const os = yield* _(Effect.promise(() => import('node:os')));
      
      // Create temporary directory
      const tempDir = yield* _(Effect.tryPromise({
        try: () => fs.mkdtemp(path.join(os.tmpdir(), 'tempeh-plugin-')),
        catch: (error) => new TempehError({
          code: 'TEMP_DIR_CREATION_FAILED',
          message: 'Failed to create temporary directory for plugin download',
          context: { error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      // Download and extract plugin
      const pluginArchive = yield* _(this.downloadFile(url));
      const pluginPath = yield* _(this.extractPlugin(pluginArchive, tempDir));
      
      // Load plugin from extracted path
      const plugin = yield* _(this.loadFromPath(pluginPath));
      
      // Clean up temporary files
      yield* _(Effect.tryPromise({
        try: () => fs.rm(tempDir, { recursive: true, force: true }),
        catch: (error) => {
          // Log warning but don't fail the operation
          console.warn(`Failed to clean up temporary directory: ${error}`);
          return undefined;
        }
      }));
      
      return plugin;
    }).pipe(
      Effect.catchAll((error) => {
        if (error instanceof TempehError) {
          return Effect.fail(error);
        }
        
        return Effect.fail(new TempehError({
          code: 'PLUGIN_URL_LOAD_FAILED',
          message: `Failed to load plugin from URL: ${url}`,
          suggestions: ['Check if URL is accessible', 'Verify plugin archive format'],
          context: { url }
        }));
      })
    );
  }

  validatePlugin(plugin: Plugin): Effect.Effect<PluginValidationResult, TempehError> {
    return Effect.try({
      try: () => {
        const errors: Array<{ code: string; message: string; field?: string; suggestion?: string }> = [];
        const warnings: Array<{ code: string; message: string; field?: string; suggestion?: string }> = [];
        const info: Array<{ code: string; message: string; field?: string }> = [];

        // Validate required fields
        if (!plugin.id) {
          errors.push({
            code: 'MISSING_ID',
            message: 'Plugin ID is required',
            field: 'id',
            suggestion: 'Add a unique identifier for the plugin'
          });
        }

        if (!plugin.name) {
          errors.push({
            code: 'MISSING_NAME',
            message: 'Plugin name is required',
            field: 'name',
            suggestion: 'Add a descriptive name for the plugin'
          });
        }

        if (!plugin.version) {
          errors.push({
            code: 'MISSING_VERSION',
            message: 'Plugin version is required',
            field: 'version',
            suggestion: 'Add a semantic version for the plugin'
          });
        }

        if (!plugin.description) {
          errors.push({
            code: 'MISSING_DESCRIPTION',
            message: 'Plugin description is required',
            field: 'description',
            suggestion: 'Add a description explaining what the plugin does'
          });
        }

        if (!plugin.author) {
          errors.push({
            code: 'MISSING_AUTHOR',
            message: 'Plugin author is required',
            field: 'author',
            suggestion: 'Add the author or maintainer of the plugin'
          });
        }

        if (!plugin.license) {
          errors.push({
            code: 'MISSING_LICENSE',
            message: 'Plugin license is required',
            field: 'license',
            suggestion: 'Add a license for the plugin'
          });
        }

        // Validate capabilities
        if (!plugin.capabilities || plugin.capabilities.length === 0) {
          warnings.push({
            code: 'NO_CAPABILITIES',
            message: 'Plugin has no capabilities defined',
            field: 'capabilities',
            suggestion: 'Add capabilities to define what the plugin can do'
          });
        } else {
          for (const capability of plugin.capabilities) {
            if (!capability.type) {
              errors.push({
                code: 'INVALID_CAPABILITY',
                message: 'Capability type is required',
                field: 'capabilities',
                suggestion: 'Add a type for each capability'
              });
            }

            if (!capability.name) {
              errors.push({
                code: 'INVALID_CAPABILITY',
                message: 'Capability name is required',
                field: 'capabilities',
                suggestion: 'Add a name for each capability'
              });
            }
          }
        }

        // Validate version format
        if (plugin.version && !this.isValidVersion(plugin.version)) {
          warnings.push({
            code: 'INVALID_VERSION_FORMAT',
            message: 'Version format may not be semantic',
            field: 'version',
            suggestion: 'Use semantic versioning (e.g., 1.0.0)'
          });
        }

        // Validate dependencies
        if (plugin.dependencies) {
          for (const dep of plugin.dependencies) {
            if (!dep || typeof dep !== 'string') {
              errors.push({
                code: 'INVALID_DEPENDENCY',
                message: 'Dependency must be a string',
                field: 'dependencies',
                suggestion: 'Ensure all dependencies are valid strings'
              });
            }
          }
        }

        // Validate commands
        if (plugin.commands) {
          for (const command of plugin.commands) {
            if (!command.name) {
              errors.push({
                code: 'INVALID_COMMAND',
                message: 'Command name is required',
                field: 'commands',
                suggestion: 'Add a name for each command'
              });
            }

            if (!command.handler || typeof command.handler !== 'function') {
              errors.push({
                code: 'INVALID_COMMAND',
                message: 'Command handler must be a function',
                field: 'commands',
                suggestion: 'Add a handler function for each command'
              });
            }
          }
        }

        // Validate validators
        if (plugin.validators) {
          for (const validator of plugin.validators) {
            if (!validator.name) {
              errors.push({
                code: 'INVALID_VALIDATOR',
                message: 'Validator name is required',
                field: 'validators',
                suggestion: 'Add a name for each validator'
              });
            }

            if (!validator.validate || typeof validator.validate !== 'function') {
              errors.push({
                code: 'INVALID_VALIDATOR',
                message: 'Validator validate function is required',
                field: 'validators',
                suggestion: 'Add a validate function for each validator'
              });
            }
          }
        }

        // Validate rollback strategies
        if (plugin.rollbackStrategies) {
          for (const strategy of plugin.rollbackStrategies) {
            if (!strategy.name) {
              errors.push({
                code: 'INVALID_ROLLBACK_STRATEGY',
                message: 'Rollback strategy name is required',
                field: 'rollbackStrategies',
                suggestion: 'Add a name for each rollback strategy'
              });
            }

            if (!strategy.execute || typeof strategy.execute !== 'function') {
              errors.push({
                code: 'INVALID_ROLLBACK_STRATEGY',
                message: 'Rollback strategy execute function is required',
                field: 'rollbackStrategies',
                suggestion: 'Add an execute function for each rollback strategy'
              });
            }
          }
        }

        // Add info about plugin structure
        info.push({
          code: 'PLUGIN_STRUCTURE',
          message: `Plugin has ${plugin.capabilities?.length || 0} capabilities, ${plugin.commands?.length || 0} commands, ${plugin.validators?.length || 0} validators, ${plugin.rollbackStrategies?.length || 0} rollback strategies`
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
          info
        };
      },
      catch: (error) => new TempehError({
        code: 'PLUGIN_VALIDATION_FAILED',
        message: 'Failed to validate plugin',
        context: { error: error instanceof Error ? error.message : String(error) }
      })
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private downloadFile(url: string): Effect.Effect<Buffer, TempehError> {
    return Effect.tryPromise({
      try: () => new Promise<Buffer>((resolve, reject) => {
        const https = require('node:https');
        const http = require('node:http');
        
        const client = url.startsWith('https:') ? https : http;
        
        client.get(url, (res: { statusCode: number; on: (event: string, handler: (chunk: Buffer) => void) => void }) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download: ${res.statusCode}`));
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      }),
      catch: (error) => new TempehError({
        code: 'PLUGIN_DOWNLOAD_FAILED',
        message: `Failed to download plugin from URL: ${url}`,
        context: { url, error: error instanceof Error ? error.message : String(error) }
      })
    });
  }

  private extractPlugin(_archive: Buffer, tempDir: string): Effect.Effect<string, TempehError> {
    return Effect.gen(function* (_) {
      // This is a simplified implementation
      // In a real implementation, you would handle different archive formats
      const fs = yield* _(Effect.promise(() => import('node:fs/promises')));
      const path = yield* _(Effect.promise(() => import('node:path')));
      
      // For now, assume it's a JSON file or simple structure
      // In practice, you'd use a library like 'extract-zip' or 'tar'
      const pluginPath = path.join(tempDir, 'plugin');
      yield* _(Effect.tryPromise({
        try: () => fs.mkdir(pluginPath, { recursive: true }),
        catch: (error) => new TempehError({
          code: 'PLUGIN_EXTRACT_FAILED',
          message: 'Failed to create plugin directory during extraction',
          context: { tempDir, error: error instanceof Error ? error.message : String(error) }
        })
      }));
      
      return pluginPath;
    });
  }

  private isValidVersion(version: string): boolean {
    // Simple semantic version validation
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }
}
