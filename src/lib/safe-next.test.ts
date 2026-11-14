import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps the consent page and upload links", () => {
    expect(safeNext("/oauth/consent?authorization_id=abc-123")).toBe(
      "/oauth/consent?authorization_id=abc-123",
    );
    expect(safeNext("/admin/upload/11111111-2222-3333-4444-555555555555")).toBe(
      "/admin/upload/11111111-2222-3333-4444-555555555555",
    );
  });

  it("drops anything that could leave the site or go elsewhere", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example/oauth/consent?x=1",
      "/oauth/consent?next=https://evil.example",
      "/admin/settings",
      "/admin/upload/../settings",
      "javascript:alert(1)",
      undefined,
      42,
    ]) {
      expect(safeNext(bad), String(bad)).toBeUndefined();
    }
  });
});
