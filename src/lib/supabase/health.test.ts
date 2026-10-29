import { describe, expect, it } from "vitest";
import { isEmptyDatabaseError } from "./health";

describe("isEmptyDatabaseError", () => {
  it("recognises a project where schema.sql was never run", () => {
    // The exact errors a fresh Supabase project returns, from a real deploy.
    expect(
      isEmptyDatabaseError({
        code: "PGRST205",
        message: "Could not find the table 'public.store_settings' in the schema cache",
      }),
    ).toBe(true);
    expect(isEmptyDatabaseError({ code: "PGRST202", message: "Could not find the function" })).toBe(
      true,
    );
    // The catalogue only keeps the message, not the code.
    expect(
      isEmptyDatabaseError({
        message:
          "Could not find the function public.catalogue_page(p_category_slug) in the schema cache",
      }),
    ).toBe(true);
  });

  it("leaves other failures to the normal error screen", () => {
    expect(isEmptyDatabaseError(null)).toBe(false);
    expect(isEmptyDatabaseError({ code: "PGRST301", message: "JWT expired" })).toBe(false);
    expect(isEmptyDatabaseError({ message: "Failed to fetch" })).toBe(false);
  });
});
