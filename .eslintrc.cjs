module.exports = {
  root: true,
  env: { browser: true, es6: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended', 'prettier', 'plugin:storybook/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier', '@typescript-eslint'],
  rules: {
    'no-param-reassign': ['error', { props: false }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/require-default-props': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'react/state-in-constructor': 'off',
    'react/jsx-filename-extension': [2, {
      'extensions': ['.js', '.jsx', '.ts', '.tsx']
    }],
    'react/function-component-definition': [2, {
      'namedComponents': 'arrow-function'
    }],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error'
    ],
    'no-shadow': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn'],
    'react/prop-types': 'off',
    'no-bitwise': [
      'error',
      {
        'allow': [
          '~'
        ]
      }
    ],
    "padding-line-between-statements": [
      "error",
      { "blankLine": "always", "prev": "*", "next": "return" },
      { "blankLine": "always", "prev": ["const", "let", "var"], "next": "*" },
      { "blankLine": "always", "prev": "export", "next": "export" }
    ],
    "prefer-destructuring": ["error", {
      "array": false,
      "object": true
    }]
  },
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.jsx', '.ts', '.tsx'], 'moduleDirectory': ['node_modules', '.']
      }
    }
  }
};
