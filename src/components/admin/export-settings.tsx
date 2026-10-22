import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Switch } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import {
  createExportTarget,
  deleteExportTarget,
  listExportTargets,
  listRecentExports,
  setExportTargetEnabled,
  type ExportTarget,
} from "@/lib/order-export";

const TARGETS_KEY = ["order_export_targets"] as const;
const LOG_KEY = ["order_export_log"] as const;

/**
 * One destination, with its signing secret.
 *
 * The secret is shown in full and copyable, because the owner has to paste it into
 * their receiving script for the signature check to pass, and a secret they cannot
 * read is a secret they cannot use. It is readable only by an owner (the policy is
 * owner-only, not owner-and-staff) and never by a shopper: the request is made by
 * the database, not the browser.
 */
function ExportTargetRow({
  target,
  onToggle,
  onRemove,
  busy,
}: {
  target: ExportTarget;
  onToggle: (enabled: boolean) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(target.secret);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-[10px] border border-outline p-3"
      data-testid="export-target"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate font-medium" data-testid="export-target-label">
            {target.label}
          </span>
          <span dir="ltr" className="block truncate font-mono text-xs text-on-surface-muted">
            {target.url}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <Switch
            label={target.enabled ? t("admin.export.enabled") : t("admin.export.disabled")}
            checked={target.enabled}
            onChange={(event) => onToggle(event.target.checked)}
          />
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            aria-label={t("admin.export.remove")}
            className="rounded-full p-2 text-on-surface-muted hover:text-error"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-on-surface-muted">
          {t("admin.export.secret")}
        </span>
        <span className="flex items-center gap-2">
          <code
            dir="ltr"
            data-testid="export-secret"
            className="min-w-0 flex-1 truncate rounded-[8px] bg-surface-high px-2 py-1.5 font-mono text-xs"
          >
            {target.secret}
          </code>
          <button
            type="button"
            onClick={() => void copy()}
            aria-label={t("admin.export.copy")}
            className="shrink-0 rounded-full p-2 text-on-surface-muted hover:text-primary"
          >
            {copied ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
          </button>
        </span>
        <span className="text-xs text-on-surface-muted">{t("admin.export.secretHint")}</span>
      </div>
    </div>
  );
}

/**
 * Order export destinations.
 *
 * Off by default. A shop with no destinations behaves exactly as it did before,
 * and delivery happens in a database trigger rather than here, so nothing on this
 * screen is on the checkout path.
 */
export function ExportSettings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const targets = useQuery({ queryKey: TARGETS_KEY, queryFn: listExportTargets });
  const log = useQuery({ queryKey: LOG_KEY, queryFn: () => listRecentExports(8) });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: TARGETS_KEY });
    void queryClient.invalidateQueries({ queryKey: LOG_KEY });
  };

  const add = useMutation({
    mutationFn: () => createExportTarget({ label, url }),
    onSuccess: () => {
      setLabel("");
      setUrl("");
      invalidate();
      toast.success(t("admin.export.added"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; enabled: boolean }) =>
      setExportTargetEnabled(input.id, input.enabled),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteExportTarget(id),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = targets.data ?? [];
  const urlValid = /^https:\/\/.+/.test(url.trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.export.title")}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="rounded-[10px] bg-surface-mid px-4 py-3 text-xs text-on-surface-muted">
          {t("admin.export.intro")}
        </p>

        {rows.length === 0 ? (
          <p className="text-sm text-on-surface-muted">{t("admin.export.empty")}</p>
        ) : (
          rows.map((target) => (
            <ExportTargetRow
              key={target.id}
              target={target}
              busy={remove.isPending}
              onToggle={(enabled) => toggle.mutate({ id: target.id, enabled })}
              onRemove={() => remove.mutate(target.id)}
            />
          ))
        )}

        <div className="flex flex-col gap-3 border-t border-outline pt-4">
          <Field label={t("admin.export.label")}>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={80}
              placeholder={t("admin.export.labelPlaceholder")}
              data-testid="export-label-input"
            />
          </Field>
          <Field
            label={t("admin.export.url")}
            hint={
              url.trim() && !urlValid ? t("admin.export.urlInvalid") : t("admin.export.urlHint")
            }
          >
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              dir="ltr"
              type="url"
              placeholder="https://script.google.com/macros/s/…/exec"
              data-testid="export-url-input"
            />
          </Field>
          <Button
            className="self-start"
            data-testid="export-add"
            disabled={!label.trim() || !urlValid || add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus size={16} aria-hidden="true" />
            {add.isPending ? t("common.saving") : t("admin.export.add")}
          </Button>
        </div>

        {(log.data ?? []).length > 0 && (
          <div className="flex flex-col gap-1 border-t border-outline pt-4">
            <span className="text-xs font-semibold text-on-surface-muted">
              {t("admin.export.recent")}
            </span>
            <ul className="flex flex-col gap-1 text-xs">
              {(log.data ?? []).map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-on-surface-muted">{row.label}</span>
                  <span dir="ltr" className="font-mono text-on-surface-muted">
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
