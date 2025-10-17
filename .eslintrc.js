/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["next/core-web-vitals", "plugin:tailwindcss/recommended", "prettier"],
  plugins: ["tailwindcss"],
  settings: {
    tailwindcss: {
      callees: ["classnames", "clsx", "cva"],
    },
  },
  rules: {
    "tailwindcss/classnames-order": "warn",
    "tailwindcss/no-custom-classname": "off",
  },
};

module.exports = config;
