// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Flat ESLint config shared across every app and package in the monorepo.
 * Guardrail intent (ARCHITECTURE §10.6): no business logic / no secrets in the
 * browser — keep the client thin and typed.
 */
export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Money must be integer tiyin — floats are a footgun for currency.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name='parseFloat']",
          message: 'Money is integer tiyin (UZS). Do not parseFloat currency values.',
        },
      ],
    },
  },
);
