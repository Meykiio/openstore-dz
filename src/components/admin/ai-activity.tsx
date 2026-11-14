import { useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { isMissingTable, useAiActivity, useAssistants } from "@/lib/admin-ai";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n-context";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<string, string> = {
  read: "bg-surface-highest text-on-surface-muted",
  write: "bg-primary/10 text-primary",
  propose: "bg-brand/15 text-brand",
  destructive: "bg-error/10 text-error",
};

/** What each assistant did, newest first, filterable by assistant. */
export function AiActivity() {
  const { t, locale } = useI18n();
  const [clientId, setClientId] = useState<string | null>(null);
  const assistants = useAssistants();
  const { data, error, isPending, refetch } = useAiActivity(clientId);
  const names = new Map((assistants.data ?? []).map((a) => [a.clientId, a.name]));

  if (isPending) return <LoadingState />;
  if (error) {
    return isMissingTable(error.message) ? null : (
      <ErrorState message={error.message} onRetry={() => void refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {(assistants.data?.length ?? 0) > 1 && (
        <Select
          aria-label={t("ai.int.all")}
          value={clientId ?? ""}
          onChange={(event) => setClientId(event.target.value || null)}
        >
          <option value="">{t("ai.int.all")}</option>
          {assistants.data?.map((a) => (
            <option key={a.clientId} value={a.clientId}>
              {a.name}
            </option>
          ))}
        </Select>
      )}

      {data.length === 0 ? (
        <p className="text-sm text-on-surface-muted">{t("ai.int.activityEmpty")}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-outline rounded-[14px] border border-outline bg-surface">
          {data.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {row.ok ? (
                  <CircleCheck size={16} className="text-positive" aria-hidden="true" />
                ) : (
                  <CircleX size={16} className="text-error" aria-label={t("ai.int.refused")} />
                )}
                <code dir="ltr" className="font-medium">
                  {row.tool}
                </code>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px]", KIND_STYLE[row.kind])}>
                  {t(`ai.int.kind.${row.kind}` as TranslationKey)}
                </span>
                <span className="ms-auto text-xs text-on-surface-muted">
                  {formatDateTime(row.created_at, locale)}
                  {names.size > 1 && ` · ${names.get(row.client_id) ?? ""}`}
                </span>
              </div>
              {row.detail && (
                <p className="break-words text-xs text-on-surface-muted" dir="auto">
                  {row.detail}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
