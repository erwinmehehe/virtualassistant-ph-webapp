import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Keep the existing Supabase any-annotation backlog visible but nonblocking.
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      // Next 16 adds React Compiler advisory rules across legacy screens.
      // Keep all findings visible as warnings while migrating existing code;
      // the core Rules of Hooks, dependency checks and security gates remain enabled.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/static-components": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "artifacts/**", "supabase/**", "next-env.d.ts"]),
]);

export default config;
