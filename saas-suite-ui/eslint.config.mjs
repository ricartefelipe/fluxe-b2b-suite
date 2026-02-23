import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  eslintConfigPrettier,
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          checkDynamicDependenciesExceptions: [
            '@saas-suite/shared/auth',
            '@saas-suite/shared/ui',
          ],
          depConstraints: [
            { sourceTag: 'scope:admin', onlyDependOnLibsWithTags: ['scope:admin', 'scope:shared'] },
            { sourceTag: 'scope:ops', onlyDependOnLibsWithTags: ['scope:ops', 'scope:shared'] },
            { sourceTag: 'scope:shop', onlyDependOnLibsWithTags: ['scope:shop', 'scope:shared'] },
            { sourceTag: 'scope:api', onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            { sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'type:util', 'type:domain', 'type:data'] },
            { sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:data-access', 'type:util', 'type:data'] },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:util', 'type:data'] },
            { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:util', 'type:data'] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {},
  },
];
