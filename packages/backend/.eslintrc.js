module.exports = {
    parserOptions: {
        project: './tsconfig.json',
        createDefaultProgram: true,
    },
    extends: [
        './../../.eslintrc.js',
        'eslint:recommended',
        'plugin:json/recommended',
        'airbnb-base',
        'airbnb-typescript/base',
        'prettier',
    ],
    plugins: ['@typescript-eslint'],
    rules: {
        'import/prefer-default-export': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
        'no-underscore-dangle': 'off',
        'max-classes-per-file': 'off',
        'no-case-declarations': 'off',
        'no-template-curly-in-string': 'off',
        eqeqeq: 'error',
    },
    ignorePatterns: ["packages/backend/src/generated/routes.ts", "packages/backend/src/generated/swagger.json"],
};
