import { Command } from 'commander';
import { ProviderManager } from '@tempeh/provider';
import { TempehError } from '@tempeh/types';
import { runEffectArray, runEffectResult, runEffectVoid } from '../utils/effect-wrapper';

export function createProviderCommand(): Command {
  const command = new Command('provider')
    .description('Manage CDKTF providers')
    .option('-w, --working-dir <path>', 'Working directory', process.cwd())
    .option('-v, --verbose', 'Enable verbose output');

  command
    .command('list')
    .description('List available CDKTF providers')
    .action(async (options) => {
      try {
        const providerManager = new ProviderManager(options.workingDir);
        const providers = await runEffectArray(providerManager.listAvailableProviders());

        console.log('\n📦 Available CDKTF Providers:');
        console.log('='.repeat(50));
        
        for (const provider of providers) {
          const providerData = provider as Record<string, unknown>;
          console.log(`\n🔧 ${providerData.name || 'Unknown'}`);
          console.log(`   Version: ${providerData.version || 'Unknown'}`);
          console.log(`   Source: ${providerData.source || 'Unknown'}`);
        }

        console.log(`\n✨ Found ${providers.length} providers`);
      } catch (error) {
        if (error instanceof TempehError) {
          console.error(`❌ ${error.message}`);
          if (error.suggestions) {
            console.error('\n💡 Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`   • ${suggestion}`);
            }
          }
        } else {
          console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exit(1);
      }
    });

  command
    .command('generate')
    .description('Generate CDKTF providers')
    .option('-p, --providers <providers>', 'Comma-separated list of providers (e.g., "aws@5.0.0,google@4.0.0")')
    .option('-f, --force', 'Force regeneration of providers')
    .option('-l, --language <language>', 'Target language (typescript, python, java, csharp, go)', 'typescript')
    .action(async (options) => {
      try {
        if (!options.providers) {
          throw new TempehError({
            code: 'MISSING_PROVIDERS',
            message: 'No providers specified',
            suggestions: [
              'Use --providers to specify providers to generate',
              'Example: --providers "aws@5.0.0,google@4.0.0"'
            ]
          });
        }

        const providerManager = new ProviderManager(options.workingDir);
        
        // Parse providers string
        const providerList: Record<string, unknown>[] = options.providers.split(',').map((providerStr: string) => {
          const [source, version] = providerStr.trim().split('@');
          if (!source || !version) {
            throw new TempehError({
              code: 'INVALID_PROVIDER_FORMAT',
              message: `Invalid provider format: ${providerStr}`,
              suggestions: [
                'Use format: provider@version',
                'Example: aws@5.0.0'
              ]
            });
          }
          
          const name = source.split('/').pop() || source;
          return { name, version, source };
        });

        // Validate providers
        const validation = await runEffectResult(providerManager.validateProviders(providerList));
        const validationData = validation as Record<string, unknown>;
        
        if (!validationData.isValid) {
          console.error('❌ Provider validation failed:');
          const errors = validationData.errors as string[] || [];
          for (const error of errors) {
            console.error(`   • ${error}`);
          }
          const warnings = validationData.warnings as string[] || [];
          if (warnings.length > 0) {
            console.warn('\n⚠️  Warnings:');
            for (const warning of warnings) {
              console.warn(`   • ${warning}`);
            }
          }
          process.exit(1);
        }

        // Generate providers
        await runEffectVoid(providerManager.generateProviders({
          providers: validationData.providers as Record<string, unknown>[] || [],
          language: options.language as 'typescript' | 'python' | 'java' | 'csharp' | 'go',
          force: options.force
        }));

        console.log('✅ Provider generation completed successfully!');
      } catch (error) {
        if (error instanceof TempehError) {
          console.error(`❌ ${error.message}`);
          if (error.suggestions) {
            console.error('\n💡 Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`   • ${suggestion}`);
            }
          }
        } else {
          console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exit(1);
      }
    });

  command
    .command('validate')
    .description('Validate provider configuration')
    .option('-p, --providers <providers>', 'Comma-separated list of providers to validate')
    .action(async (options) => {
      try {
        if (!options.providers) {
          throw new TempehError({
            code: 'MISSING_PROVIDERS',
            message: 'No providers specified for validation',
            suggestions: [
              'Use --providers to specify providers to validate',
              'Example: --providers "aws@5.0.0,google@4.0.0"'
            ]
          });
        }

        const providerManager = new ProviderManager(options.workingDir);
        
        // Parse providers string
        const providerList: Record<string, unknown>[] = options.providers.split(',').map((providerStr: string) => {
          const [source, version] = providerStr.trim().split('@');
          if (!source || !version) {
            throw new TempehError({
              code: 'INVALID_PROVIDER_FORMAT',
              message: `Invalid provider format: ${providerStr}`,
              suggestions: [
                'Use format: provider@version',
                'Example: aws@5.0.0'
              ]
            });
          }
          
          const name = source.split('/').pop() || source;
          return { name, version, source };
        });

        // Validate providers
        const validation = await runEffectResult(providerManager.validateProviders(providerList));
        const validationData = validation as Record<string, unknown>;
        
        if (validationData.isValid) {
          console.log('✅ Provider validation passed!');
          const providers = validationData.providers as Record<string, unknown>[] || [];
          console.log(`\n📦 Valid providers: ${providers.length}`);
          for (const provider of providers) {
            const providerData = provider as Record<string, unknown>;
            console.log(`   • ${providerData.name}@${providerData.version} (${providerData.source})`);
          }
        } else {
          console.error('❌ Provider validation failed:');
          const errors = validationData.errors as string[] || [];
          for (const error of errors) {
            console.error(`   • ${error}`);
          }
        }

        const warnings = validationData.warnings as string[] || [];
        if (warnings.length > 0) {
          console.warn('\n⚠️  Warnings:');
          for (const warning of warnings) {
            console.warn(`   • ${warning}`);
          }
        }
      } catch (error) {
        if (error instanceof TempehError) {
          console.error(`❌ ${error.message}`);
          if (error.suggestions) {
            console.error('\n💡 Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`   • ${suggestion}`);
            }
          }
        } else {
          console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exit(1);
      }
    });

  command
    .command('update')
    .description('Update provider versions')
    .option('-p, --providers <providers>', 'Comma-separated list of providers to update')
    .action(async (options) => {
      try {
        if (!options.providers) {
          throw new TempehError({
            code: 'MISSING_PROVIDERS',
            message: 'No providers specified for update',
            suggestions: [
              'Use --providers to specify providers to update',
              'Example: --providers "aws@5.0.0,google@4.0.0"'
            ]
          });
        }

        const providerManager = new ProviderManager(options.workingDir);
        
        // Parse providers string
        const providerList: Record<string, unknown>[] = options.providers.split(',').map((providerStr: string) => {
          const [source, version] = providerStr.trim().split('@');
          if (!source || !version) {
            throw new TempehError({
              code: 'INVALID_PROVIDER_FORMAT',
              message: `Invalid provider format: ${providerStr}`,
              suggestions: [
                'Use format: provider@version',
                'Example: aws@5.0.0'
              ]
            });
          }
          
          const name = source.split('/').pop() || source;
          return { name, version, source };
        });

        // Update providers
        await runEffectVoid(providerManager.updateProviderVersions(providerList.map(p => p.name as string)));

        console.log('✅ Provider versions updated successfully!');
      } catch (error) {
        if (error instanceof TempehError) {
          console.error(`❌ ${error.message}`);
          if (error.suggestions) {
            console.error('\n💡 Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`   • ${suggestion}`);
            }
          }
        } else {
          console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exit(1);
      }
    });

  command
    .command('discover')
    .description('Discover available CDKTF providers')
    .option('-q, --query <query>', 'Search query for providers')
    .option('-c, --category <category>', 'Provider category (cloud, container, security)')
    .option('-l, --limit <limit>', 'Maximum number of providers to return', '20')
    .option('-s, --sort <sort>', 'Sort by (downloads, version, name)', 'downloads')
    .option('-o, --order <order>', 'Sort order (asc, desc)', 'desc')
    .action(async (options) => {
      try {
        const providerManager = new ProviderManager(options.workingDir);
        let result: Record<string, unknown>;

        if (options.category) {
          result = await runEffectResult(providerManager.discoverProvidersByCategory(options.category));
        } else {
          result = await runEffectResult(providerManager.discoverProviders({
            query: options.query || '',
            limit: Number.parseInt(options.limit, 10),
            sortBy: options.sort as 'downloads' | 'version' | 'name',
            sortOrder: options.order as 'asc' | 'desc'
          }));
        }

        console.log('\n🔍 Provider Discovery Results:');
        console.log('='.repeat(60));
        const resultData = result as Record<string, unknown>;
        console.log(`📊 Found ${resultData.totalCount || 0} providers (${resultData.source || 'unknown'})`);
        console.log(`⏰ Last updated: ${(resultData.timestamp as Date)?.toLocaleString() || 'unknown'}`);
        
        if (resultData.query) {
          console.log(`🔎 Query: ${resultData.query}`);
        }

        console.log('\n📦 Providers:');
        const providers = resultData.providers as Record<string, unknown>[] || [];
        for (const provider of providers) {
          const providerData = provider as Record<string, unknown>;
          console.log(`\n🔧 ${providerData.name}@${providerData.version}`);
          console.log(`   Source: ${providerData.source}`);
          if (providerData.description) {
            console.log(`   Description: ${providerData.description}`);
          }
          if (providerData.documentation) {
            console.log(`   Docs: ${providerData.documentation}`);
          }
        }
      } catch (error) {
        if (error instanceof TempehError) {
          console.error(`❌ ${error.message}`);
          if (error.suggestions) {
            console.error('\n💡 Suggestions:');
            for (const suggestion of error.suggestions) {
              console.error(`   • ${suggestion}`);
            }
          }
        } else {
          console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        process.exit(1);
      }
    });

  return command;
}