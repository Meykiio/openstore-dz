import { createFileRoute } from "@tanstack/react-router";
import { handleMcp } from "@/lib/server/mcp/http";

/**
 * The address Claude connects to: https://<shop>/mcp.
 *
 * All methods go to the same handler. Under MCP 2026-07-28 only POST does
 * anything; GET and DELETE are answered 405 by the SDK, after the token check.
 */
export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      POST: ({ request }) => handleMcp(request),
      GET: ({ request }) => handleMcp(request),
      DELETE: ({ request }) => handleMcp(request),
    },
  },
});
