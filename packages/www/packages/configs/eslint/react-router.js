/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["@remix-run/eslint-config", "@remix-run/eslint-config/node"],
  globals: {
    React: true,
    JSX: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
  ignorePatterns: ["node_modules/", "dist/"],
  overrides: [
    {
      files: ["**/*.ts?(x)"],
      rules: {
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "import/no-default-export": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            checksVoidReturn: false,
          },
        ],
      },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
      },
    },
  ],
};
