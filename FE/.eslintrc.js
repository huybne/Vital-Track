module.exports = {
  env: {
    node: true,
    browser: true, 
    es2021: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true, 
    },
    requireConfigFile: false,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  plugins: ['react'],
  rules: {
    // Các rule của bạn
  },
};
