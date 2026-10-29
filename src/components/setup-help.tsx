import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The exact next step for a shop that is not ready yet, written for someone who
 * clicked "Deploy" and has never opened a terminal. Each problem gets its own
 * instructions; a deployed site never tells its owner to run `npm run dev`.
 */

const code = "rounded bg-on-surface/5 px-1 font-mono text-xs";

/** `https://<ref>.supabase.co` -> `<ref>`, falling back to the project id variable. */
function projectRef(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  try {
    const host = new URL(url ?? "").hostname;
    if (host.endsWith(".supabase.co")) return host.split(".")[0];
  } catch {
    /* not a URL: fall through */
  }
  return import.meta.env.VITE_SUPABASE_PROJECT_ID || null;
}

/** Read after mount, so the server and the first client render agree. */
function useIsLocal(): boolean {
  const [local, setLocal] = useState(false);
  useEffect(
    () => setLocal(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)),
    [],
  );
  return local;
}

/** The database exists but `supabase/schema.sql` was never run on it. */
export function EmptyDatabaseSteps() {
  const ref = projectRef();
  const editor = ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : "https://supabase.com/dashboard/projects";
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [sql, setSql] = useState<string | null>(null);

  // Loaded only when this card shows (a shop with an empty database), never for a
  // shopper. Loaded ahead of the click, because Safari only allows a copy made
  // directly inside the click, not after waiting for a download.
  useEffect(() => {
    void import("../../supabase/schema.sql?raw").then(
      (m) => setSql(m.default),
      () => setCopied("failed"),
    );
  }, []);

  const copy = () => {
    if (!sql) return setCopied("failed");
    navigator.clipboard.writeText(sql).then(
      () => setCopied("done"),
      () => setCopied("failed"),
    );
  };

  return (
    <ol className="mt-4 list-decimal space-y-3 ps-5 text-on-surface-muted">
      <li>
        <a href={editor} target="_blank" rel="noreferrer" className="text-primary underline">
          Open your Supabase SQL Editor{" "}
          <ExternalLink size={12} className="inline" aria-hidden="true" />
        </a>
      </li>
      <li className="space-y-2">
        <span>Copy the setup script:</span>
        <div>
          <Button type="button" size="sm" variant="outline" onClick={copy} disabled={!sql}>
            {copied === "done" ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
            {copied === "done" ? "Copied" : "Copy setup script"}
          </Button>
        </div>
        {copied === "failed" && (
          <p className="text-xs">
            Your browser blocked the copy. Open{" "}
            <a
              className="text-primary underline"
              href="https://github.com/Meykiio/openstore-dz/blob/main/supabase/schema.sql"
              target="_blank"
              rel="noreferrer"
            >
              schema.sql on GitHub
            </a>{" "}
            and copy it from there.
          </p>
        )}
      </li>
      <li>
        Paste it into the editor and click <b>Run</b>. It takes a few seconds and ends with
        &ldquo;Success&rdquo;.
      </li>
      <li>Come back here and refresh the page.</li>
    </ol>
  );
}

/** The keys are missing. On a deployed site they live in the host, not in `.env`. */
export function MissingKeysSteps() {
  if (useIsLocal()) {
    return (
      <ol className="mt-4 list-decimal space-y-1.5 ps-5 text-on-surface-muted">
        <li>
          Copy <code className={code}>.env.example</code> to <code className={code}>.env</code>
        </li>
        <li>Paste your Project URL and publishable key from Supabase → Project Settings → API</li>
        <li>
          Run <code className={code}>npm run dev</code> again
        </li>
      </ol>
    );
  }
  return (
    <ol className="mt-4 list-decimal space-y-1.5 ps-5 text-on-surface-muted">
      <li>In Vercel, open your project → Settings → Environment Variables</li>
      <li>
        Add <code className={code}>VITE_SUPABASE_URL</code> and{" "}
        <code className={code}>VITE_SUPABASE_PUBLISHABLE_KEY</code> from Supabase → Project Settings
        → API
      </li>
      <li>Open Deployments and click Redeploy. The keys are only read when the site is built.</li>
    </ol>
  );
}

/** Supabase answered with something else: wrong key, paused project, outage. */
export function UnreachableSteps() {
  return (
    <ol className="mt-4 list-decimal space-y-1.5 ps-5 text-on-surface-muted">
      <li>In Supabase, check the project is running (a free project pauses after a week idle)</li>
      <li>
        Compare the Project URL and publishable key in Supabase → Project Settings → API with the
        ones your site uses
      </li>
      <li>Fix any difference, redeploy, and refresh this page</li>
    </ol>
  );
}
