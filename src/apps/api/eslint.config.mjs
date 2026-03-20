import nestjsConfig from '@repo/eslint-config/nestjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nestjsConfig,
  {
    ignores: ['**/*.js', '**/*.cjs'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
