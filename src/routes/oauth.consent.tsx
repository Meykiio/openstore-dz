import { createFileRoute } from "@tanstack/react-router";
import { ConsentScreen } from "@/components/admin/oauth-consent";

/**
 * /oauth/consent?authorization_id=...
 *
 * Supabase Auth's OAuth server sends the owner here when Claude asks to
 * connect. It is the "authorization path" set in the Supabase dashboard
 * (Authentication > OAuth Server).
 */
export const Route = createFileRoute("/oauth/consent")({
  validateSearch: (search: Record<string, unknown>): { authorization_id?: string } => {
    const id = search.authorization_id;
    return typeof id === "string" && id.length > 0 && id.length < 200
      ? { authorization_id: id }
      : {};
  },
  head: () => ({
    meta: [{ title: "Connect an assistant" }, { name: "robots", content: "noindex" }],
  }),
  component: ConsentRoute,
});

function ConsentRoute() {
  const { authorization_id } = Route.useSearch();
  return <ConsentScreen authorizationId={authorization_id ?? null} />;
}
