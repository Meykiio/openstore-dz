import {
  bearerAuthChallengeResponse,
  getOAuthProtectedResourceMetadataUrl,
  originValidationResponse,
  verifyBearerToken,
} from "@modelcontextprotocol/server";
import { issuerUrl, verifyAccessToken } from "./auth";
import { mcpHandler } from "./server";

/**
 * The HTTP edge of /mcp, kept apart from the route file so it can be tested
 * with a plain `Request`.
 *
 * Order matters: Origin first (a browser on another site must never reach the
 * tools), then the bearer token (no token or a bad one answers 401 with the
 * `WWW-Authenticate` header that tells Claude where to sign in), then the MCP
 * handler itself.
 */

/** The public address of this MCP server, from the request itself. */
function resourceUrl(request: Request): URL {
  return new URL("/mcp", new URL(request.url).origin);
}

export async function handleMcp(request: Request): Promise<Response> {
  const own = new URL(request.url).hostname;
  const rejected = originValidationResponse(request, [own]);
  if (rejected) return rejected;

  const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(resourceUrl(request));
  try {
    const authInfo = await verifyBearerToken(request.headers.get("authorization"), {
      verifier: { verifyAccessToken },
      resourceMetadataUrl,
    });
    return await mcpHandler.fetch(request, { authInfo });
  } catch (error) {
    return bearerAuthChallengeResponse(error, { resourceMetadataUrl });
  }
}

/**
 * RFC 9728 Protected Resource Metadata: tells Claude which authorization server
 * signs in to this resource. Claude uses only the first entry, so there is one.
 */
export function protectedResourceMetadata(request: Request): Response {
  const body = {
    resource: resourceUrl(request).href,
    authorization_servers: [issuerUrl()],
    bearer_methods_supported: ["header"],
    resource_name: "OpenStore shop",
  };
  return Response.json(body, {
    headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=300" },
  });
}
