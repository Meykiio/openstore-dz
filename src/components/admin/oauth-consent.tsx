import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { allowAssistant } from "@/lib/admin-ai";
import { getSupabase } from "@/lib/supabase/client";

type Details = { clientId: string; clientName: string; redirectHost: string };
type Phase = "loading" | "ready" | "redirecting" | "error";

/** The host the assistant will be sent back to, shown so the owner can check it. */
function hostOf(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri;
  }
}

/**
 * Approve or deny an assistant (Claude) asking to manage the shop.
 *
 * Owner only. A staff account sees a refusal and can only deny. The server
 * repeats the owner check on every /mcp call, so a staff member who approved
 * through the API directly would still be refused there.
 */
export function ConsentScreen({ authorizationId }: { authorizationId: string | null }) {
  const { t } = useI18n();
  const { user, role, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isOwner = role === "owner";

  useEffect(() => {
    if (loading || !user || !authorizationId || !isOwner) return;
    let cancelled = false;
    void getSupabase()
      .auth.oauth.getAuthorizationDetails(authorizationId)
      .then(({ data, error: failure }) => {
        if (cancelled) return;
        if (failure || !data) {
          setError(failure?.message ?? t("ai.consent.error"));
          setPhase("error");
        } else if ("redirect_url" in data) {
          // Already approved earlier: Supabase hands back the code directly.
          setPhase("redirecting");
          window.location.assign(data.redirect_url);
        } else {
          setDetails({
            clientId: data.client.id,
            clientName: data.client.name || t("ai.consent.unnamed"),
            redirectHost: hostOf(data.redirect_uri),
          });
          setPhase("ready");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user, authorizationId, isOwner, t]);

  const decide = async (approve: boolean) => {
    if (!authorizationId) return;
    setPhase("redirecting");
    const oauth = getSupabase().auth.oauth;
    const { data, error: failure } = approve
      ? await oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
      : await oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });
    if (failure) {
      setError(failure.message);
      setPhase("error");
      return;
    }
    // Approving also puts the assistant on the shop's own allowed list, which the
    // database checks on every request. If that fails (database not updated yet),
    // the owner can still allow it later in Admin > AI assistant.
    if (approve && details)
      await allowAssistant(details.clientId, details.clientName).catch(() => undefined);
    window.location.assign(data.redirect_url);
  };

  const next = authorizationId
    ? `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`
    : null;

  let body: React.ReactNode;
  if (!authorizationId) {
    body = <p className="text-sm text-error">{t("ai.consent.missing")}</p>;
  } else if (loading) {
    body = <p className="text-sm text-on-surface-muted">{t("common.loading")}</p>;
  } else if (!user) {
    body = (
      <>
        <p className="text-sm text-on-surface-muted">{t("ai.consent.signInFirst")}</p>
        <Button asChild size="lg">
          <Link to="/login" search={{ next: next ?? undefined }}>
            {t("admin.login.submit")}
          </Link>
        </Button>
      </>
    );
  } else if (!isOwner) {
    body = (
      <>
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {t("ai.consent.ownerOnly")}
        </p>
        <Button variant="outline" size="lg" onClick={() => void decide(false)}>
          {t("ai.consent.deny")}
        </Button>
      </>
    );
  } else if (phase === "error") {
    body = (
      <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
        {error ?? t("ai.consent.error")}
      </p>
    );
  } else if (phase === "ready" && details) {
    body = (
      <>
        <p className="text-sm">{t("ai.consent.body", { name: details.clientName })}</p>
        <p className="text-xs text-on-surface-muted" dir="ltr">
          {t("ai.consent.returnsTo", { host: details.redirectHost })}
        </p>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={() => void decide(true)}>
            {t("ai.consent.approve")}
          </Button>
          <Button variant="outline" size="lg" onClick={() => void decide(false)}>
            {t("ai.consent.deny")}
          </Button>
        </div>
      </>
    );
  } else {
    body = <p className="text-sm text-on-surface-muted">{t("common.loading")}</p>;
  }

  return <ConsentFrame>{body}</ConsentFrame>;
}

/** The page around the consent card: shop name on top, one centred card. */
function ConsentFrame({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-16">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Store size={20} className="text-primary" aria-hidden="true" />
        {t("app.name")}
      </Link>
      <section className="flex w-full max-w-sm flex-col gap-4 rounded-[16px] border border-outline bg-surface p-6">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Bot size={18} className="text-primary" aria-hidden="true" />
          {t("ai.consent.title")}
        </h1>
        {children}
      </section>
    </main>
  );
}
