import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "إعداد المتجر" }, { name: "robots", content: "noindex" }] }),
  component: SetupPage,
});

type Phase = "checking" | "claimable" | "taken" | "awaitEmail";

/**
 * First-run admin creation.
 *
 * The only door into administration, and it shuts behind the first person
 * through it: `claim_store()` refuses once any administrator exists, so this page
 * cannot be used to take over a running shop even though it stays reachable.
 *
 * Email confirmation is handled rather than assumed. If Supabase requires it,
 * `signUp` returns a user with no session, so the claim has to wait until after
 * the owner confirms and signs in — which the login screen completes for them.
 */
function SetupPage() {
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    void getSupabase()
      .rpc("admin_exists")
      .then(
        ({ data }) => setPhase(data === true ? "taken" : "claimable"),
        () => setPhase("claimable"),
      );
  }, []);

  if (phase === "checking") return <LoadingState className="min-h-dvh" />;
  if (phase !== "claimable") return <Settled phase={phase} />;

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-16">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Store size={20} className="text-primary" aria-hidden="true" />
        OpenStore DZ
      </Link>
      <SetupForm onAwaitingEmail={() => setPhase("awaitEmail")} />
    </main>
  );
}

/** What the owner sees when there is nothing left for them to do here. */
function Settled({ phase }: { phase: Exclude<Phase, "checking" | "claimable"> }) {
  const { t } = useI18n();
  const taken = phase === "taken";
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-5 py-16 text-center">
      <ShieldCheck size={32} className="text-primary" aria-hidden="true" />
      <h1 className="font-display text-xl font-semibold">
        {taken ? t("setup.alreadyClaimed") : t("reviews.thanks")}
      </h1>
      <p className="max-w-sm text-sm text-on-surface-muted">
        {taken ? t("admin.login.body") : t("setup.confirmEmail")}
      </p>
      <Button asChild>
        <Link to="/login">{t("admin.login.submit")}</Link>
      </Button>
    </main>
  );
}

function SetupForm({ onAwaitingEmail }: { onAwaitingEmail: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t("setup.weakPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("setup.passMismatch"));
      return;
    }

    setBusy(true);
    const supabase = getSupabase();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setBusy(false);
      setError(signUpError.message);
      return;
    }

    // No session means email confirmation is on; the claim happens at sign-in.
    if (!data.session) {
      setBusy(false);
      onAwaitingEmail();
      return;
    }

    const { error: claimError } = await supabase.rpc("claim_store");
    setBusy(false);
    if (claimError) {
      setError(claimError.message);
      return;
    }
    void navigate({ to: "/admin" });
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-sm flex-col gap-5 rounded-[16px] border border-outline bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
          {t("setup.title")}
        </h1>
        <p className="text-sm text-on-surface-muted">{t("setup.body")}</p>
      </div>

      <Field label={t("admin.login.email")} required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          dir="ltr"
          required
          disabled={busy}
        />
      </Field>

      <Field label={t("setup.password")} required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          dir="ltr"
          required
          minLength={8}
          disabled={busy}
        />
      </Field>

      <Field label={t("setup.confirm")} required>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          dir="ltr"
          required
          disabled={busy}
        />
      </Field>

      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? t("common.loading") : t("setup.submit")}
      </Button>

      <Link to="/login" className="text-center text-sm text-on-surface-muted hover:text-on-surface">
        {t("setup.haveAccount")}
      </Link>
    </form>
  );
}
