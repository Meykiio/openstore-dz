import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import maxLines from "./eslint-rules/index.mjs";

export default tseslint.config(
  {
    // Build output, generated files, and vendored third-party code.
    // `docs/` holds the shipped Guepex skill, which is MIT-licensed code from
    // another author. Reformatting it would fork it away from its upstream and
    // break the sync, and the 250-line rule is ours, not theirs.
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      ".vercel",
      "node_modules",
      "coverage",
      "playwright-report",
      "test-results",
      "docs/**",
      "src/routeTree.gen.ts",
      "src/lib/supabase/types.ts",
      "eslint-rules/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "max-lines": maxLines,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Max 250 lines per hand-written source file, 120 per function. Split by
      // responsibility before reaching it, never artificially. Vendored and
      // generated files are excluded via the ignore list above.
      "max-lines/max-lines": ["error", { max: 250 }],
      "max-lines/max-lines-per-function": ["error", { max: 120 }],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // TypeScript already reports unused locals and parameters via
      // `noUnusedLocals` / `noUnusedParameters`. One source of truth.
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Supabase Edge Functions run on Deno, not Node.
    files: ["supabase/functions/**/*.ts"],
    languageOptions: { globals: { ...globals.deno } },
    rules: { "no-console": "off" },
  },
  {
    // Config files are plain Node ESM.
    files: ["*.config.{ts,js}", "scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/consistent-type-imports": "off" },
  },
  prettierRecommended,
);
