module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // 'prettier' disables linting rules that conflict with prettier (this is dependency eslint-config-prettier)
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
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
  plugins: ['@typescript-eslint', 'react-hooks'],
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

    // frontend exclusive rules
    'react/display-name': 'off', // Complains about functions in strings-file that returns jsx
    'react/no-find-dom-node': 'off', // We need to do this with d3
    'react/prop-types': 'off', // unnecessary with typescript
    '@typescript-eslint/no-empty-interface': 'off', // I use this sometimes in the frontend, to have some uniformity between components
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',

    // nextjs specific stuff:
    'react/react-in-jsx-scope': 'off', // not needed in nextjs
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}
