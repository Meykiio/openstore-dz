import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth-card";
import { isDemoShop } from "@/components/storefront/demo-banner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { explainPasswordError, sendResetLink } from "@/lib/account";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Password" }, { name: "robots", content: "noindex" }] }),
  component: ForgotPage,
});

/**
 * Ask for a password-reset email. The answer is the same whether or not the
 * address has an account, so the page cannot be used to find admin emails.
 */
function ForgotPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const failure = await sendResetLink(email);
    setBusy(false);
    if (!failure) return setSent(true);
    const key = explainPasswordError(failure);
    setError(key ? t(key) : failure.message);
  };

  const back = (
    <Link to="/login" className="text-sm text-primary underline-offset-4 hover:underline">
      {t("account.backToLogin")}
    </Link>
  );

  if (isDemoShop) {
    return (
      <AuthCard title={t("account.forgotTitle")} help={t("account.demo")}>
        {back}
      </AuthCard>
    );
  }
  if (sent) {
    return (
      <AuthCard title={t("account.forgotTitle")} help={t("account.sent")}>
        {back}
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("account.forgotTitle")} help={t("account.forgotHelp")}>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
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
        {error && (
          <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? t("common.loading") : t("account.send")}
        </Button>
        {back}
      </form>
    </AuthCard>
  );
}
