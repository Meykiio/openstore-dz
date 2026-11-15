import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth-card";
import { PasswordForm } from "@/components/admin/password-form";
import { LoadingState } from "@/components/ui/feedback";
import { isDemoShop } from "@/components/storefront/demo-banner";
import { linkError, mayChangePassword } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Password" }, { name: "robots", content: "noindex" }] }),
  component: ResetPage,
});

/**
 * Where the reset email's link lands. Supabase puts a session in the address
 * (implicit flow) and the browser client signs in from it on load, so by the
 * time loading ends there is a user, unless the link expired or was used.
 */
function ResetPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  // Read after mount: the server render has no address hash.
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => setFailed(linkError(window.location.hash)), []);

  const again = (
    <Link to="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
      {t("account.askAgain")}
    </Link>
  );

  if (failed) {
    return (
      <AuthCard title={t("account.resetTitle")} help={t("account.linkExpired")}>
        {again}
      </AuthCard>
    );
  }
  if (loading) return <LoadingState />;
  if (!user) {
    return (
      <AuthCard title={t("account.resetTitle")} help={t("account.linkExpired")}>
        {again}
      </AuthCard>
    );
  }

  if (!mayChangePassword(isDemoShop, role)) {
    return (
      <AuthCard title={t("account.resetTitle")} help={t("account.demo")}>
        <Link to="/admin" className="text-sm text-primary underline-offset-4 hover:underline">
          {t("admin.dashboard.title")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("account.resetTitle")} help={t("account.resetHelp")}>
      <PasswordForm
        askCurrent={false}
        onDone={() => {
          toast.success(t("account.changed"));
          void navigate({ to: "/admin" });
        }}
      />
    </AuthCard>
  );
}
