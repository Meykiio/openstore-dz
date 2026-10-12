/**
 * GENERATED FILE — do not hand-edit.
 *
 * Regenerate after every schema change:
 *
 *   supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 *
 * This stub exists so the project type-checks before a database exists. Sprint
 * 2 replaces it with the real generated output from `supabase/schema.sql`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
