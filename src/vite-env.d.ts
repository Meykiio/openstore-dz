/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SITE_URL?: string;
  /** "true" only on the public reference shop. */
  readonly VITE_DEMO_MODE?: string;
}

/** OpenStore's version from package.json, set in vite.config.ts. */
declare const __APP_VERSION__: string;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
