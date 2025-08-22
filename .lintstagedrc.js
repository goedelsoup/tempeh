module.exports = {
  '*.{js,ts,tsx}': [
    'biome format --write',
    'biome lint',
    'vitest related --run'
  ],
  '*.{json,md,yml,yaml}': [
    'biome format --write'
  ]
};
