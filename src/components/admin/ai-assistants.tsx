import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { Switch } from "@/components/ui/form";
import {
  AI_ASSISTANTS_KEY,
  allowAssistant,
  isMissingTable,
  revokeAssistant,
  setAssistantEnabled,
  useAssistants,
  type Assistant,
} from "@/lib/admin-ai";
import { formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n-context";

/** The connected assistants, each with its switch and a disconnect button. */
export function AiAssistants() {
  const { t } = useI18n();
  const { data, error, isPending, refetch } = useAssistants();

  if (isPending) return <LoadingState />;
  if (error) {
    return isMissingTable(error.message) ? (
      <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
        {t("ai.int.dbMissing")}
      </p>
    ) : (
      <ErrorState message={error.message} onRetry={() => void refetch()} />
    );
  }
  if (data.length === 0) return <p className="text-sm text-on-surface-muted">{t("ai.int.none")}</p>;

  return (
    <ul className="flex flex-col gap-3">
      {data.map((assistant) => (
        <AssistantRow key={assistant.clientId} assistant={assistant} />
      ))}
    </ul>
  );
}

function AssistantRow({ assistant }: { assistant: Assistant }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [arming, setArming] = useState(false);

  // The second tap must come soon after the first, or it disarms itself.
  useEffect(() => {
    if (!arming) return;
    const timer = window.setTimeout(() => setArming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [arming]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: AI_ASSISTANTS_KEY });
  const mutation = useMutation({
    mutationFn: async (action: "allow" | "on" | "off" | "revoke") => {
      if (action === "allow") await allowAssistant(assistant.clientId, assistant.name);
      else if (action === "revoke") await revokeAssistant(assistant.clientId, assistant.granted);
      else await setAssistantEnabled(assistant.clientId, action === "on");
      return action;
    },
    onSuccess: (action) => {
      toast.success(action === "revoke" ? t("ai.int.revoked") : t("ai.int.saved"));
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const busy = mutation.isPending;
  return (
    <li className="flex flex-col gap-3 rounded-[14px] border border-outline bg-surface p-4">
      <div className="flex items-start gap-3">
        <Bot size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="font-semibold">{assistant.name}</p>
          <p className="text-xs text-on-surface-muted">
            {assistant.grantedAt &&
              t("ai.int.connectedOn", { date: formatDateTime(assistant.grantedAt, locale) })}
            {assistant.grantedAt && " · "}
            {assistant.lastUsedAt
              ? t("ai.int.lastUsed", { date: formatDateTime(assistant.lastUsedAt, locale) })
              : t("ai.int.neverUsed")}
          </p>
          <code className="truncate text-[11px] text-on-surface-muted" dir="ltr">
            {assistant.clientId}
          </code>
        </div>
      </div>

      {!assistant.granted && (
        <p className="text-sm text-on-surface-muted">{t("ai.int.signedOut")}</p>
      )}

      {assistant.enabled === null ? (
        <div className="flex flex-col gap-2 rounded-[10px] bg-primary/5 p-3">
          <p className="text-sm">{t("ai.int.notAllowed")}</p>
          <Button size="sm" disabled={busy} onClick={() => mutation.mutate("allow")}>
            {t("ai.int.allow")}
          </Button>
        </div>
      ) : (
        <Switch
          label={t("ai.int.enabled")}
          checked={assistant.enabled}
          disabled={busy}
          onChange={(event) => mutation.mutate(event.target.checked ? "on" : "off")}
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        className="self-start text-error"
        disabled={busy}
        onClick={() => (arming ? mutation.mutate("revoke") : setArming(true))}
      >
        <Unplug size={14} aria-hidden="true" />
        {arming ? t("ai.int.revokeConfirm") : t("ai.int.revoke")}
      </Button>
    </li>
  );
}
