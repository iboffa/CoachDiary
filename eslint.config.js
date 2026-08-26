// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // Pervasive in this codebase's mock-heavy specs (untyped test doubles) —
      // an error here would block unrelated commits. Worth tightening once
      // the existing ~230 call sites are triaged, not as part of ESLint setup.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Stylistic preference; the codebase mixes constructor and inject()
      // injection today. Downgrade rather than force an unrelated refactor.
      '@angular-eslint/prefer-inject': 'warn',
      // `const { id: _id, ...rest } = x` is the established pattern for
      // stripping fields before re-saving a record — a leading underscore
      // marks it as deliberately unused.
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // ~115 pre-existing violations across custom click handlers and label
      // markup — a real accessibility gap, but a dedicated pass, not
      // something to force-fix (or silently disable) while adding lint infra.
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
    },
  },
]);
