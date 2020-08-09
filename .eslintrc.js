module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // 'prettier' disables linting rules that conflict with prettier (this is dependency eslint-config-prettier)
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      generators: false,
      experimentalObjectRestSpread: true,
    },
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // modify active rules:

    // i enjoy writing like this: className={`note-row ${note.checked && 'checked'}`
    // it does produce 'false' in the class-string, but I'm okay with that. So I modify the rule like this:
    '@typescript-eslint/restrict-template-expressions': ['error', { allowBoolean: true }],

    // turn off unwanted rules:

    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/camelcase': 'off', // There are a few exceptions, like variables from the backend and stuff
    '@typescript-eslint/no-empty-interface': 'off', // I use empty interfaces sometimes in the frontend, to have some uniformity between components
    '@typescript-eslint/explicit-module-boundary-types': 'off', // This feels unnecessary and verbose
    '@typescript-eslint/no-unused-vars': 'off', // currently not working correctly

    // activate extra rules:

    eqeqeq: ['error', 'smart'],
    '@typescript-eslint/no-unnecessary-type-assertion': ['error'],
    '@typescript-eslint/no-extra-non-null-assertion': ['error'],
    '@typescript-eslint/no-unnecessary-condition': ['error'],
    '@typescript-eslint/strict-boolean-expressions': ['error'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
