import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./scripts/vitest-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "eslint-rules/**/*.test.mjs"],
    css: false,
  },
});
