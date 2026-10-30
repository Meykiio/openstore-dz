import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { readFileSync } from "node:fs";

// The version, baked in at build time: the dashboard compares it with the
// latest release. Read here so package.json itself never reaches the browser.
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// https://vite.dev/config/
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
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
    // Bind to the LAN so the storefront can be opened on a phone over the same
    // Wi-Fi — the only realistic way to judge an Arabic RTL storefront, since
    // the whole design targets mobile. Dev only; the built output is unaffected.
    host: true,
    strictPort: true,
  },
  build: {
    // Product imagery dominates the page. Keep the initial payload small:
    // the storefront budget is 1.5 MB total, enforced in the a11y/perf gate.
    chunkSizeWarningLimit: 700,
  },
});
