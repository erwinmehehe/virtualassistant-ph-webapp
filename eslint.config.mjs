import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: [".next/**", "node_modules/**", "artifacts/**", "supabase/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // ~700 existing `any` annotations (mostly Supabase rows in recruiter pages) are
      // reported as warnings so new code is flagged without blocking on the backlog.
      "@typescript-eslint/no-explicit-any": "warn",
      // Plain apostrophes in JSX text render correctly; escaping them only adds noise.
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
];

export default config;
