import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { Field, Select, Switch } from "@/components/ui/form";
import {
  disconnectTelegram,
  isMissingTelegram,
  sendTelegramTest,
  setTelegramEnabled,
  setTelegramLang,
  TELEGRAM_KEY,
  TELEGRAM_LANGS,
  type TelegramLang,
  useTelegramStatus,
} from "@/lib/admin-telegram";
import { useI18n } from "@/lib/i18n-context";
import { TelegramConnect } from "./telegram-connect";

/** Telegram: a message for every new order. Connect, switch, test, disconnect. */
export function TelegramCard() {
  const { t } = useI18n();
  const { data, error, isPending, refetch } = useTelegramStatus();

  if (isPending) return <LoadingState />;
  if (error) {
    return isMissingTelegram(error.message) ? (
      <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
        {t("ai.int.dbMissing")}
      </p>
    ) : (
      <ErrorState message={error.message} onRetry={() => void refetch()} />
    );
  }
  if (!data.connected) return <TelegramConnect />;
  return <Connected bot={data.bot_username} enabled={data.enabled} lang={data.lang} />;
}

const LANG_NAMES: Record<TelegramLang, string> = { ar: "العربية", fr: "Français", en: "English" };

function Connected({ bot, enabled, lang }: { bot: string; enabled: boolean; lang: TelegramLang }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [arming, setArming] = useState(false);

  useEffect(() => {
    if (!arming) return;
    const timer = window.setTimeout(() => setArming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [arming]);

  const mutation = useMutation({
    mutationFn: async (action: "on" | "off" | "test" | "disconnect" | TelegramLang) => {
      if (TELEGRAM_LANGS.includes(action as TelegramLang)) {
        await setTelegramLang(action as TelegramLang);
        return "lang";
      }
      if (action === "test") return (await sendTelegramTest()) ? "test" : "off-test";
      if (action === "disconnect") await disconnectTelegram();
      else await setTelegramEnabled(action === "on");
      return action;
    },
    onSuccess: (done) => {
      if (done === "test") toast.success(t("tg.testSent"));
      else if (done === "off-test") toast.error(t("tg.testOff"));
      else toast.success(t("ai.int.saved"));
      void queryClient.invalidateQueries({ queryKey: TELEGRAM_KEY });
    },
    onError: (failure: Error) => toast.error(failure.message),
  });
  const busy = mutation.isPending;

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-outline bg-surface p-4">
      <p className="text-sm">
        {t("tg.connected")}{" "}
        <a
          href={`https://t.me/${bot}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary"
          dir="ltr"
        >
          @{bot}
        </a>
      </p>
      <Switch
        label={t("tg.enabled")}
        checked={enabled}
        disabled={busy}
        onChange={(event) => mutation.mutate(event.target.checked ? "on" : "off")}
      />
      <Field label={t("tg.lang")}>
        <Select
          value={lang}
          disabled={busy}
          onChange={(event) => mutation.mutate(event.target.value as TelegramLang)}
        >
          {TELEGRAM_LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy || !enabled}
          onClick={() => mutation.mutate("test")}
        >
          <Send size={14} aria-hidden="true" />
          {t("tg.test")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-error"
          disabled={busy}
          onClick={() => (arming ? mutation.mutate("disconnect") : setArming(true))}
        >
          <Unplug size={14} aria-hidden="true" />
          {arming ? t("ai.int.revokeConfirm") : t("ai.int.revoke")}
        </Button>
      </div>
      <p className="text-xs text-on-surface-muted">{t("tg.privacy")}</p>
    </div>
  );
}
