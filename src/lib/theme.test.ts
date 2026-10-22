import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  applyTheme,
  defaultTheme,
  persistTheme,
  readStoredTheme,
  resolveTheme,
  themeBootstrapScript,
} from "./theme";

describe("theme storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(readStoredTheme()).toBeNull();
  });

  it("round-trips a stored theme", () => {
    persistTheme("dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("ignores a corrupted stored value", () => {
    window.localStorage.setItem("openstore-theme", "neon");
    expect(readStoredTheme()).toBeNull();
  });

  it("writes the attribute onto the document element", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("defaults to light, never consulting the OS preference", () => {
    // The OS saying "dark" must not change the default: light is canonical.
    const spy = vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    expect(defaultTheme()).toBe("light");
    expect(resolveTheme()).toBe("light");
    spy.mockRestore();
  });

  it("lets a stored choice override the default", () => {
    persistTheme("dark");
    expect(resolveTheme()).toBe("dark");
  });
});

describe("theme bootstrap script", () => {
  it("is a single inline statement so it can run before first paint", () => {
    expect(themeBootstrapScript).toContain("data-theme");
    expect(themeBootstrapScript).not.toContain("\n");
  });

  it("applies the stored preference when evaluated", () => {
    window.localStorage.setItem("openstore-theme", "dark");
    eval(themeBootstrapScript);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("falls back to light when nothing is stored", () => {
    window.localStorage.clear();
    eval(themeBootstrapScript);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("falls back to light when storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    eval(themeBootstrapScript);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    spy.mockRestore();
  });
});
