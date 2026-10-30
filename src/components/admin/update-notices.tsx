import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, DatabaseZap, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { projectRef } from "@/lib/supabase/project-ref";
import { useI18n } from "@/lib/i18n-context";
import {
  APP_VERSION,
  SCHEMA_VERSION,
  isNewer,
  latestVersionQuery,
  schemaVersionQuery,
} from "@/lib/version";

const GUIDE = {
  ar: "https://github.com/Meykiio/openstore-dz/blob/main/UPDATING.ar.md",
  fr: "https://github.com/Meykiio/openstore-dz/blob/main/UPDATING.fr.md",
  en: "https://github.com/Meykiio/openstore-dz/blob/main/UPDATING.md",
} as const;

/**
 * Two notices at the top of the dashboard. The database one comes first: code
 * that is newer than its database is the one state that breaks a shop, and the
 * fix is a paste into the SQL Editor. The other says a new version is out.
 */
export function UpdateNotices() {
  const { data: schema } = useQuery(schemaVersionQuery());
  const { data: latest } = useQuery(latestVersionQuery());
  if (schema !== undefined && schema < SCHEMA_VERSION) return <DatabaseNotice />;
  if (latest && isNewer(latest, APP_VERSION)) return <NewVersionNotice latest={latest} />;
  return null;
}

function DatabaseNotice() {
  const { t } = useI18n();
  const ref = projectRef();
  const editor = ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : "https://supabase.com/dashboard/projects";
  const [sql, setSql] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");

  // Loaded ahead of the click: Safari only allows a copy made inside the click.
  useEffect(() => {
    void import("../../../supabase/schema.sql?raw").then(
      (m) => setSql(m.default),
      () => setCopied("failed"),
    );
  }, []);

  const copy = () => {
    if (!sql || !navigator.clipboard) return setCopied("failed");
    navigator.clipboard.writeText(sql).then(
      () => setCopied("done"),
      () => setCopied("failed"),
    );
  };

  return (
    <section
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-[16px] border border-tertiary/50 bg-tertiary/10 p-5"
    >
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <DatabaseZap size={18} aria-hidden="true" />
        {t("update.dbTitle")}
      </h2>
      <p className="text-sm text-on-surface-muted">{t("update.dbBody")}</p>
      <ol className="list-decimal space-y-2 ps-5 text-sm">
        <li>
          <Button type="button" size="sm" variant="outline" onClick={copy} disabled={!sql}>
            {copied === "done" ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            {copied === "done" ? t("update.copied") : t("update.copy")}
          </Button>
          {copied === "failed" && <p className="mt-1 text-xs">{t("update.copyFailed")}</p>}
        </li>
        <li>
          <a href={editor} target="_blank" rel="noreferrer" className="text-primary underline">
            {t("update.openEditor")}{" "}
            <ExternalLink size={12} className="inline" aria-hidden="true" />
          </a>
        </li>
        <li>{t("update.runIt")}</li>
      </ol>
    </section>
  );
}

function NewVersionNotice({ latest }: { latest: string }) {
  const { t, locale } = useI18n();
  return (
    <section className="mb-6 flex flex-wrap items-center gap-3 rounded-[16px] border border-outline bg-surface p-4">
      <Sparkles size={18} className="text-primary" aria-hidden="true" />
      <p className="flex-1 text-sm">
        <b>{t("update.newTitle", { version: latest })}</b>{" "}
        <span className="text-on-surface-muted">
          {t("update.newBody", { version: APP_VERSION })}
        </span>
      </p>
      <Button asChild size="sm" variant="outline">
        <a href={GUIDE[locale] ?? GUIDE.en} target="_blank" rel="noreferrer">
          {t("update.howTo")}
        </a>
      </Button>
    </section>
  );
}
