import { createFileRoute } from "@tanstack/react-router";
import { protectedResourceMetadata } from "@/lib/server/mcp/http";

/**
 * /.well-known/oauth-protected-resource/mcp (RFC 9728, path-aware form).
 * The 401 from /mcp points here; this points Claude at Supabase Auth.
 */
export const Route = createFileRoute("/.well-known/oauth-protected-resource/mcp")({
  server: {
    handlers: {
      GET: ({ request }) => protectedResourceMetadata(request),
    },
  },
});
