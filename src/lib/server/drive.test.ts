import { afterEach, describe, expect, it, vi } from "vitest";
import { driveFileId, fetchDriveImage, isGoogleHost, MAX_DRIVE_BYTES, sniffImage } from "./drive";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]);
const HTML = new TextEncoder().encode("<!DOCTYPE html><html>sign in</html>");

afterEach(() => vi.unstubAllGlobals());

describe("driveFileId", () => {
  it("reads the usual share links", () => {
    expect(
      driveFileId("https://drive.google.com/file/d/1AbCdEfGhIjK_lm-no/view?usp=sharing")?.id,
    ).toBe("1AbCdEfGhIjK_lm-no");
    expect(driveFileId("https://drive.google.com/open?id=1AbCdEfGhIjKlm")?.id).toBe(
      "1AbCdEfGhIjKlm",
    );
    expect(
      driveFileId("https://drive.google.com/file/d/1AbCdEfGhIjKlm/view?resourcekey=0-xyz")
        ?.resourceKey,
    ).toBe("0-xyz");
  });
  it("refuses anything that is not Google Drive", () => {
    expect(driveFileId("https://evil.example/file/d/1AbCdEfGhIjKlm/view")).toBeNull();
    expect(driveFileId("http://drive.google.com/file/d/1AbCdEfGhIjKlm/view")).toBeNull();
    expect(driveFileId("https://drive.google.com.evil.example/file/d/1AbCdEfGhIjKlm")).toBeNull();
    expect(driveFileId("not a url")).toBeNull();
  });
});

describe("isGoogleHost", () => {
  it("accepts Google hosts only", () => {
    expect(isGoogleHost("drive.usercontent.google.com")).toBe(true);
    expect(isGoogleHost("doc-0s-1c-docs.googleusercontent.com")).toBe(true);
    expect(isGoogleHost("google.com.evil.example")).toBe(false);
    expect(isGoogleHost("evilgoogle.com")).toBe(false);
    expect(isGoogleHost("169.254.169.254")).toBe(false);
  });
});

describe("sniffImage", () => {
  it("knows JPEG, PNG and WebP by their first bytes", () => {
    expect(sniffImage(JPEG)).toBe("image/jpeg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe("image/png");
    expect(sniffImage(new TextEncoder().encode("RIFF1234WEBPVP8 "))).toBe("image/webp");
    expect(sniffImage(HTML)).toBeNull();
  });
});

const LINK = "https://drive.google.com/file/d/1AbCdEfGhIjKlm/view";

function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const r of responses) fetchMock.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchDriveImage", () => {
  it("streams a public JPEG", async () => {
    const fetchMock = stubFetch(new Response(JPEG, { status: 200 }));
    const res = await fetchDriveImage(LINK);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(JPEG);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "drive.usercontent.google.com/download?id=1AbCdEfGhIjKlm",
    );
  });
  it("follows a redirect inside Google", async () => {
    stubFetch(
      new Response(null, {
        status: 302,
        headers: { location: "https://doc-1.googleusercontent.com/x" },
      }),
      new Response(JPEG, { status: 200 }),
    );
    expect((await fetchDriveImage(LINK)).status).toBe(200);
  });
  it("refuses a redirect out of Google", async () => {
    stubFetch(
      new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } }),
    );
    await expect(fetchDriveImage(LINK)).rejects.toThrow("outside Google");
  });
  it("refuses a sign-in page (file not shared)", async () => {
    stubFetch(new Response(HTML, { status: 200 }));
    await expect(fetchDriveImage(LINK)).rejects.toThrow("not shared publicly");
  });
  it("refuses a file announced over 15 MB", async () => {
    stubFetch(
      new Response(JPEG, {
        status: 200,
        headers: { "content-length": String(MAX_DRIVE_BYTES + 1) },
      }),
    );
    await expect(fetchDriveImage(LINK)).rejects.toThrow("15 MB");
  });
});
