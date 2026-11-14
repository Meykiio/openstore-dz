import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AiActivity } from "@/components/admin/ai-activity";
import { AiAssistants } from "@/components/admin/ai-assistants";
import { AiSetupGuide } from "@/components/admin/ai-setup-guide";
import { TelegramCard } from "@/components/admin/telegram-card";
import { CopyBox } from "@/components/storefront/copy-box";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/admin/integrations")({
  component: IntegrationsPage,
});

function Section({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {help && <p className="text-sm text-on-surface-muted">{help}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Admin > Integrations: Telegram order messages, and Claude (connect once,
 * switch on or off, disconnect, see everything it did). Owner only: staff can
 * never connect either, and the database refuses them anyway.
 */
function IntegrationsPage() {
  const { t } = useI18n();
  const { role } = useAuth();
  // The address is this site's own; read after mount so the server render and
  // the browser agree.
  const [serverUrl, setServerUrl] = useState("/mcp");
  useEffect(() => setServerUrl(`${window.location.origin}/mcp`), []);

  if (role !== "owner") {
    return <p className="text-sm text-on-surface-muted">{t("ai.int.ownerOnly")}</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="font-display text-2xl font-semibold">{t("ai.int.title")}</h1>

      <Section title={t("tg.title")} help={t("tg.intro")}>
        <TelegramCard />
      </Section>

      <div className="flex flex-col gap-2 border-t border-outline pt-6">
        <h2 className="font-display text-xl font-semibold">{t("ai.int.aiTitle")}</h2>
        <p className="text-sm text-on-surface-muted">{t("ai.int.intro")}</p>
      </div>

      <Section title={t("ai.int.url")} help={t("ai.int.urlHelp")}>
        <CopyBox value={serverUrl} />
      </Section>

      <Section title={t("ai.int.connected")}>
        <AiAssistants />
      </Section>

      <Section title={t("ai.int.activity")} help={t("ai.int.activityHelp")}>
        <AiActivity />
      </Section>

      <Section title={t("ai.int.setup")}>
        <AiSetupGuide serverUrl={serverUrl} />
      </Section>
    </div>
  );
}
