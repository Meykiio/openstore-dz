/**
 * Fetch one image from a Google Drive share link, for the photo upload page.
 *
 * Only Google's own hosts are ever contacted, whatever the link or a redirect
 * says, so this cannot be pointed at another server (no SSRF). The bytes must
 * start like a JPEG, PNG or WebP file and stay under 15 MB. The file must be
 * shared "Anyone with the link": an unauthenticated request sees nothing else.
 *
 * The response is streamed, which Vercel exempts from its 4.5 MB body limit.
 * The browser then crops and re-encodes it like any upload (src/lib/image.ts).
 */

export const MAX_DRIVE_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 5;

/** The file id in the share link forms Drive uses. */
export function driveFileId(link: string): { id: string; resourceKey: string | null } | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !/^(drive|docs)\.google\.com$/.test(url.hostname)) return null;
  const fromPath = /\/file\/d\/([\w-]{10,})/.exec(url.pathname)?.[1];
  const id = fromPath ?? url.searchParams.get("id");
  if (!id || !/^[\w-]{10,}$/.test(id)) return null;
  return { id, resourceKey: url.searchParams.get("resourcekey") };
}

/** Google hosts a redirect may lead to. Anything else is refused. */
export function isGoogleHost(hostname: string): boolean {
  return /(^|\.)google\.com$/.test(hostname) || /(^|\.)googleusercontent\.com$/.test(hostname);
}

/** The image type the first bytes announce, or null. */
export function sniffImage(head: Uint8Array): string | null {
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47)
    return "image/png";
  const text = String.fromCharCode(...head.slice(0, 12));
  if (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

export class DriveError extends Error {}

async function follow(start: string): Promise<Response> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(url, { redirect: "manual" });
    const next = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !next) return response;
    const target = new URL(next, url);
    if (target.protocol !== "https:" || !isGoogleHost(target.hostname)) {
      throw new DriveError("Drive redirected outside Google.");
    }
    url = target.href;
  }
  throw new DriveError("Too many redirects.");
}

/** Download the file and return it as a size-capped, type-checked stream. */
export async function fetchDriveImage(link: string): Promise<Response> {
  const file = driveFileId(link);
  if (!file) throw new DriveError("Not a Google Drive file link.");
  const download = new URL("https://drive.usercontent.google.com/download");
  download.searchParams.set("id", file.id);
  download.searchParams.set("export", "download");
  download.searchParams.set("confirm", "t");
  if (file.resourceKey) download.searchParams.set("resourcekey", file.resourceKey);

  const response = await follow(download.href);
  if (!response.ok || !response.body) throw new DriveError(`Drive answered ${response.status}.`);
  if (Number(response.headers.get("content-length") ?? 0) > MAX_DRIVE_BYTES) {
    throw new DriveError("The file is larger than 15 MB.");
  }

  const reader = response.body.getReader();
  const first = await reader.read();
  const head = first.value ?? new Uint8Array();
  const type = sniffImage(head);
  if (!type) {
    await reader.cancel();
    throw new DriveError(
      "The file is not a JPEG, PNG or WebP image, or it is not shared publicly.",
    );
  }

  let total = head.byteLength;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (head.byteLength) controller.enqueue(head);
      if (first.done) controller.close();
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) return controller.close();
      total += value.byteLength;
      if (total > MAX_DRIVE_BYTES) {
        await reader.cancel();
        return controller.error(new DriveError("The file is larger than 15 MB."));
      }
      controller.enqueue(value);
    },
    cancel: () => reader.cancel(),
  });
  return new Response(stream, { headers: { "content-type": type, "cache-control": "no-store" } });
}
