import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

/** The centred card the sign-in, forgot and reset pages share. */
export function AuthCard({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
        <Store size={20} className="text-primary" aria-hidden="true" />
        {t("app.name")}
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-[16px] border border-outline bg-surface p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          {help && <p className="text-sm text-on-surface-muted">{help}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
