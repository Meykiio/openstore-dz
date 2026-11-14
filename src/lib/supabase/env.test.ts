import { afterEach, describe, expect, it, vi } from "vitest";
import { readEnv } from "./env";

afterEach(() => vi.unstubAllEnvs());

describe("readEnv", () => {
  it("drops a pasted line break and a trailing slash", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://abc.supabase.co/\r\n");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", " sb_publishable_x\n");
    expect(readEnv()).toEqual({ url: "https://abc.supabase.co", key: "sb_publishable_x" });
  });

  it("still refuses a value that is only whitespace", () => {
    vi.stubEnv("VITE_SUPABASE_URL", "\r\n");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => readEnv()).toThrow("Supabase configuration");
  });
});
