const esbuild = require('esbuild');
const { join } = require('node:path');

const buildOptions = {
  entryPoints: [join(__dirname, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: join(__dirname, 'dist/tempeh'),
  format: 'cjs',
  external: [
    // External dependencies that should not be bundled
    'commander',
    'chalk',
    'ora',
    'inquirer',
    'effect',
    // Internal workspace packages
    '@tempeh/api',
    '@tempeh/types',
    '@tempeh/utils',
    '@tempeh/state',
    '@tempeh/core',
    '@tempeh/provider',
    '@tempeh/workflow',
    '@tempeh/project'
  ],
  sourcemap: true,
  minify: false,
};

// Build the executable
esbuild.build(buildOptions).then(() => {
  console.log('✅ CLI executable built successfully');
}).catch((error) => {
  console.error('❌ Failed to build CLI executable:', error);
  process.exit(1);
});
