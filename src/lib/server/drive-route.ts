import { originValidationResponse } from "@modelcontextprotocol/server";
import { verifyOwnerSession, callerClient } from "./mcp/auth";
import { DriveError, fetchDriveImage } from "./drive";

/**
 * POST /api/ai-drive { code }: the upload page asks the server to fetch the
 * Google Drive file attached to a one-time upload link.
 *
 * The caller must be the owner, signed in normally in this browser (never an
 * assistant's token): an assistant cannot use this to make the server fetch.
 * The Drive link itself comes from the database row, not from the request.
 */

const json = (status: number, error: string) => Response.json({ error }, { status });

export async function handleDriveImport(request: Request): Promise<Response> {
  const rejected = originValidationResponse(request, [new URL(request.url).hostname]);
  if (rejected) return rejected;

  const token = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token || !(await verifyOwnerSession(token))) return json(401, "Owner sign-in required.");

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";
  if (!/^[0-9a-f-]{36}$/i.test(code)) return json(400, "Bad link.");

  const { data, error } = await callerClient(token).rpc("ai_upload_get", { p_code: code });
  if (error) return json(403, error.message);
  const link = data as { drive_url: string | null; used: boolean; expired: boolean } | null;
  if (!link) return json(404, "Unknown link.");
  if (link.used || link.expired) return json(410, "Link used or expired.");
  if (!link.drive_url) return json(400, "No Drive file on this link.");

  try {
    return await fetchDriveImage(link.drive_url);
  } catch (failure) {
    return json(
      502,
      failure instanceof DriveError ? failure.message : "Drive could not be reached.",
    );
  }
}
