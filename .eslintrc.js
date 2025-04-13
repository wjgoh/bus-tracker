module.exports = {
  extends: [
    "next/core-web-vitals",
    // Keep any existing extends
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    // Keep any existing rules
  },
};
