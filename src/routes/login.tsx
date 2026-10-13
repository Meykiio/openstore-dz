import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "دخول الإدارة" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

/**
 * Admin sign-in.
 *
 * Signing in is not the same as being an admin. After a successful password
 * sign-in this checks `admin_users` directly, and if there is no row it signs the
 * session straight back out. Leaving a valid customer session open on the admin
 * screen would be worse than a failed login: the next request would look
 * authenticated and only fail deep inside a policy.
 */
function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in as an admin: nothing to do here.
  useEffect(() => {
    if (!loading && isAdmin) void navigate({ to: "/admin" });
  }, [loading, isAdmin, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = getSupabase();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setBusy(false);
      setError(signInError?.message ?? t("common.somethingWrong"));
      return;
    }

    const { data: roleRow } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!roleRow) {
      await supabase.auth.signOut();
      setBusy(false);
      setError(t("admin.login.notAdmin"));
      return;
    }

    setBusy(false);
    void navigate({ to: "/admin" });
  };

  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-16">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Store size={20} className="text-primary" aria-hidden="true" />
        {t("app.name")}
      </Link>

      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-[16px] border border-outline bg-surface p-6"
      >
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
            <LockKeyhole size={18} className="text-primary" aria-hidden="true" />
            {t("admin.login.title")}
          </h1>
          <p className="text-sm text-on-surface-muted">{t("admin.login.body")}</p>
        </div>

        <Field label={t("admin.login.email")} required>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            dir="ltr"
            required
            disabled={busy}
          />
        </Field>

        <Field label={t("admin.login.password")} required>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
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

        {user && !isAdmin && !error && (
          <p className="text-sm text-on-surface-muted">{t("admin.login.notAdmin")}</p>
        )}

        <Button type="submit" size="lg" disabled={busy}>
          {busy ? t("common.loading") : t("admin.login.submit")}
        </Button>
      </form>
    </main>
  );
}
