/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["plugin:tailwindcss/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["tailwindcss"],
  rules: {
    "tailwindcss/classnames-order": "off",
    "no-redeclare": "off",
  },
};
