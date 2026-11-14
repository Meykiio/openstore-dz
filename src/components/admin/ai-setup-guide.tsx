import { ShieldCheck } from "lucide-react";
import { CopyBox } from "@/components/storefront/copy-box";
import { useI18n } from "@/lib/i18n-context";

/** Step by step: connect Claude (web, desktop, phone) or Claude Code. */
export function AiSetupGuide({ serverUrl }: { serverUrl: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{t("ai.int.claude.title")}</h3>
        <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm">
          <li>{t("ai.int.claude.1")}</li>
          <li>{t("ai.int.claude.2")}</li>
          <li>{t("ai.int.claude.3")}</li>
          <li>{t("ai.int.claude.4")}</li>
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{t("ai.int.code.title")}</h3>
        <p className="text-sm">{t("ai.int.code.1")}</p>
        <CopyBox value={`claude mcp add --transport http shop ${serverUrl}`} />
      </div>

      <p className="flex gap-2 rounded-[10px] bg-surface-highest p-3 text-sm">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>{t("ai.int.safety")}</span>
      </p>
    </div>
  );
}
