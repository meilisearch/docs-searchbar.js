/* Using eslint-config-algolia */
/* eslint-disable import/no-commonjs */
module.exports = {
  extends: ['algolia', 'algolia/jest', 'plugin:prettier/recommended', 'plugin:cypress/recommended'],
  plugins: ['prettier'],
  rules: {
    'no-console': 0,
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'all',
      },
    ],
  },
}
