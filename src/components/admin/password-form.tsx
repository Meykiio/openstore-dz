import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { explainPasswordError, MIN_PASSWORD, passwordProblem, setPassword } from "@/lib/account";
import { useI18n } from "@/lib/i18n-context";

/**
 * New password, twice, and optionally the current one. Used by My account
 * (signed in, current password asked) and by the reset page (no current one:
 * the emailed link is the proof).
 */
export function PasswordForm({ askCurrent, onDone }: { askCurrent: boolean; onDone: () => void }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = passwordProblem(next, confirm);
    if (problem) return setError(t(problem, { min: MIN_PASSWORD }));
    setBusy(true);
    setError(null);
    const failure = await setPassword(next, askCurrent ? current : undefined);
    setBusy(false);
    if (failure) {
      const key = explainPasswordError(failure);
      return setError(key ? t(key, { min: MIN_PASSWORD }) : failure.message);
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    onDone();
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
      {askCurrent && (
        <Field label={t("account.current")} required>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
            required
            disabled={busy}
          />
        </Field>
      )}
      <Field label={t("account.new")} hint={t("account.newHint", { min: MIN_PASSWORD })} required>
        <Input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          dir="ltr"
          required
          minLength={MIN_PASSWORD}
          disabled={busy}
        />
      </Field>
      <Field label={t("setup.confirm")} required>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          dir="ltr"
          required
          minLength={MIN_PASSWORD}
          disabled={busy}
        />
      </Field>
      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="self-start">
        <KeyRound size={16} aria-hidden="true" />
        {busy ? t("common.saving") : t("account.save")}
      </Button>
    </form>
  );
}
