import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base recommended configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    // Global ignores
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.cache/**',
      '**/coverage/**',
      'drizzle/**',
    ],
  },

  {
    // TypeScript-specific config
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disable rules that are handled by TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Allow non-null assertions (we use them safely)
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Allow empty functions (common in React)
      '@typescript-eslint/no-empty-function': 'off',

      // Allow empty interfaces for React forwardRef components
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'always', // Common pattern for forwardRef with no props
        },
      ],

      // React Server Components & Next.js specific
      '@typescript-eslint/require-await': 'off', // Server components can be async without await
    },
  },

  {
    // JavaScript files
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  }
);
