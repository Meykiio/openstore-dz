import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackStart({
      router: { entry: "router.tsx" },
    }),
    nitro({ preset: "vercel" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 8080,
  },
  build: {
    // Product imagery dominates the page. Keep the initial payload small:
    // the storefront budget is 1.5 MB total, enforced in the a11y/perf gate.
    chunkSizeWarningLimit: 700,
  },
});
