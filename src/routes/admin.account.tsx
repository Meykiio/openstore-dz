import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PasswordForm } from "@/components/admin/password-form";
import { isDemoShop } from "@/components/storefront/demo-banner";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/admin/account")({
  component: AccountPage,
});

/**
 * Admin > My account: the signed-in admin's own password. Owner and staff alike,
 * because each has their own account. Not on the public demo, whose staff
 * password is published on purpose (docs/DEMO.md): a visitor changing it would
 * lock everyone else out.
 */
function AccountPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold">{t("account.title")}</h1>
        {user?.email && (
          <p className="text-sm text-on-surface-muted" dir="auto">
            {t("account.signedInAs", { email: user.email })}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-[14px] border border-outline bg-surface p-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-semibold">{t("account.passwordTitle")}</h2>
          <p className="text-sm text-on-surface-muted">{t("account.passwordHelp")}</p>
        </div>
        {isDemoShop ? (
          <p className="text-sm text-on-surface-muted">{t("account.demo")}</p>
        ) : (
          <PasswordForm askCurrent onDone={() => toast.success(t("account.changed"))} />
        )}
      </section>
    </div>
  );
}
