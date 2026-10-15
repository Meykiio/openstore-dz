import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Reads `.env` for the catalogue scripts.
 *
 * These scripts run outside the app, so they cannot use Vite's env handling. The
 * file is gitignored and the service key in it is never bundled, because nothing
 * here is imported by application code.
 */
const HERE = dirname(fileURLToPath(import.meta.url));

export async function requireEnv(keys) {
  const raw = await readFile(join(HERE, "..", "..", ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  const missing = keys.filter((key) => !env[key]);
  if (missing.length > 0) throw new Error(`Missing from .env: ${missing.join(", ")}`);
  return env;
}
