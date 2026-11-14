import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { CopyBox } from "@/components/storefront/copy-box";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { checkBotToken, linkTelegram, newLinkCode, TELEGRAM_KEY } from "@/lib/admin-telegram";
import { useI18n } from "@/lib/i18n-context";

const TOKEN = /^[0-9]+:[A-Za-z0-9_-]{20,}$/;

/**
 * Three steps: make a bot with @BotFather, paste its token, tap Start in Telegram.
 * The Start link carries a one-time code, which is how the shop finds the
 * owner's chat without asking for any number.
 */
export function TelegramConnect() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [bot, setBot] = useState<string | null>(null);
  const [code] = useState(newLinkCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = (raw?: string) =>
    raw === "not_started"
      ? t("tg.notStarted")
      : raw === "bad_token"
        ? t("tg.badToken")
        : (raw ?? "");

  const check = async () => {
    setBusy(true);
    setError(null);
    const answer = await checkBotToken(token.trim());
    setBusy(false);
    if (answer.username) setBot(answer.username);
    else setError(explain(answer.error));
  };

  const link = async () => {
    setBusy(true);
    setError(null);
    const answer = await linkTelegram(token.trim(), code, locale);
    setBusy(false);
    if (answer.error) return setError(explain(answer.error));
    toast.success(t("tg.connectedToast"));
    void queryClient.invalidateQueries({ queryKey: TELEGRAM_KEY });
  };

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm">
        <li>
          {t("tg.step1")}{" "}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
            dir="ltr"
          >
            @BotFather
          </a>
        </li>
        <li>{t("tg.step2")}</li>
      </ol>

      <Field label={t("tg.token")}>
        <Input
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
            setBot(null);
          }}
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          placeholder="123456789:AA..."
          disabled={busy}
        />
      </Field>

      {!bot ? (
        <Button size="lg" disabled={busy || !TOKEN.test(token.trim())} onClick={() => void check()}>
          <Search size={16} aria-hidden="true" />
          {t("tg.check")}
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-[10px] bg-primary/5 p-3">
          <p className="text-sm">{t("tg.step3", { bot: `@${bot}` })}</p>
          <Button asChild variant="outline" size="lg">
            <a href={`https://t.me/${bot}?start=${code}`} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden="true" />
              {t("tg.open", { bot: `@${bot}` })}
            </a>
          </Button>
          <p className="pt-1 text-xs text-on-surface-muted">{t("tg.pasteCode")}</p>
          <CopyBox value={code} />
          <Button size="lg" disabled={busy} onClick={() => void link()}>
            {t("tg.pressedStart")}
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
