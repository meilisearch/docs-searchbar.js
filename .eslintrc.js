/* Using eslint-config-algolia */
/* eslint-disable import/no-commonjs */
module.exports = {
  extends: ['algolia', 'algolia/jest'],
  rules: {
    'no-console': 0,
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
