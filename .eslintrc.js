/* Using eslint-config-algolia */
/* eslint-disable import/no-commonjs */
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'algolia',
    'algolia/jest',
    'plugin:prettier/recommended',
    'plugin:cypress/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['prettier', 'cypress', '@typescript-eslint'],
  rules: {
    'no-console': 0,
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'all',
      },
    ],
  },
}
