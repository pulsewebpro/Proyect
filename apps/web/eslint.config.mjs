import eslintConfig from '@amable/config/eslint';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...eslintConfig,
  {
    ignores: [
      'eslint.config.mjs',
      'postcss.config.mjs',
      'next-env.d.ts',
      '.next/**',
      'node_modules/**',
    ],
  },
];
