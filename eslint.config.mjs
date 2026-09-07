import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Flat config so `npm run lint` runs non-interactively — `next lint` prompted for
 * setup on every invocation, which would hang any CI job that called it.
 *
 * eslint-config-next 16 publishes flat arrays directly, so the eslintrc compat
 * layer this file used to go through is gone.
 */
const config = [
  { ignores: [".next/**", "dist/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

export default config;
