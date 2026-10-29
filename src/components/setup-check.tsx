import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, DatabaseZap, Loader2, WifiOff } from "lucide-react";
import { supabaseConfigProblem } from "@/lib/supabase/client";
import { pingDatabase } from "@/lib/supabase/health";
import { EmptyDatabaseSteps, MissingKeysSteps, UnreachableSteps } from "@/components/setup-help";
import { cn } from "@/lib/utils";

type Status = "checking" | "ready" | "misconfigured" | "empty" | "unreachable";

/**
 * First-run health check.
 *
 * A shop owner who clicked "Deploy" and got it half-right must be told exactly
 * what is wrong and what to do next, in plain language. A white screen or a
 * console stack trace is not an acceptable answer.
 */
export function SetupCheck({ className }: { className?: string }) {
  const problem = supabaseConfigProblem();
  const [status, setStatus] = useState<Status>(problem ? "misconfigured" : "checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    if (problem) return;
    let cancelled = false;
    pingDatabase().then((result) => {
      if (cancelled) return;
      setDetail(result.detail);
      setStatus(result.state === "ok" ? "ready" : result.state);
    });
    return () => {
      cancelled = true;
    };
  }, [problem]);

  return (
    <div
      className={cn(
        "w-full max-w-xl rounded-[16px] border p-5 text-start text-sm",
        toneFor(status),
        className,
      )}
      role="status"
      aria-live="polite"
      // The instructions are English, like the Supabase and Vercel screens they
      // point to, so they read left to right even on an Arabic page.
      dir="ltr"
      lang="en"
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{HEADLINES[status]}</p>
          <p className="mt-1 break-words text-on-surface-muted">{descriptionFor(status, detail)}</p>
          {status === "misconfigured" && <MissingKeysSteps />}
          {status === "empty" && <EmptyDatabaseSteps />}
          {status === "unreachable" && <UnreachableSteps />}
        </div>
      </div>
    </div>
  );
}

const HEADLINES: Record<Status, string> = {
  checking: "Checking your database",
  ready: "Database connected",
  misconfigured: "Your shop is not connected to a database yet",
  empty: "One step left: set up your database",
  unreachable: "Could not reach the database",
};

function descriptionFor(status: Status, detail: string): string {
  if (status === "ready") return "Products, orders and reviews are stored and ready to use.";
  if (status === "checking") return "Confirming your Supabase keys can reach the database.";
  if (status === "misconfigured")
    return "The Supabase Project URL and publishable key were not set when the site was built.";
  if (status === "empty")
    return "Your Supabase project is connected but still empty. Run the setup script once to create the shop's tables.";
  return (
    detail || "Supabase refused the request. The keys may be wrong or the project may be paused."
  );
}

function toneFor(status: Status): string {
  if (status === "ready") return "border-positive/40 bg-positive/5";
  if (status === "checking") return "border-outline bg-surface";
  return "border-tertiary/40 bg-tertiary/5";
}

function StatusIcon({ status }: { status: Status }) {
  const shared = "mt-0.5 shrink-0";
  if (status === "ready")
    return <CheckCircle2 size={20} className={`${shared} text-positive`} aria-hidden="true" />;
  if (status === "misconfigured")
    return <AlertTriangle size={20} className={`${shared} text-tertiary`} aria-hidden="true" />;
  if (status === "empty")
    return <DatabaseZap size={20} className={`${shared} text-tertiary`} aria-hidden="true" />;
  if (status === "unreachable")
    return <WifiOff size={20} className={`${shared} text-tertiary`} aria-hidden="true" />;
  return (
    <Loader2
      size={20}
      className={`${shared} animate-spin text-on-surface-muted`}
      aria-hidden="true"
    />
  );
}
