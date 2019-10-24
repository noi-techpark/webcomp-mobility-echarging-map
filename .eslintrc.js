module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier', 'react-hooks'],
  extends: ['plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  ecmaFeatures: {
    jsx: true
  },
  rules: {
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/no-explicit-any': ['error'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/prop-types': false,
    '@typescript-eslint/no-empty-interface': [
      'error',
      {
        allowSingleExtends: true
      }
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    react: {
      version: 'detect' // Automatically detect the version of React to use
    }
  }
};
