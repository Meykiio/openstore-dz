import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { supabaseConfigProblem } from "@/lib/supabase/client";
import { pingDatabase } from "@/lib/supabase/health";
import { cn } from "@/lib/utils";

type Status = "checking" | "ready" | "misconfigured" | "unreachable";

/**
 * First-run health check.
 *
 * A shop owner who pastes the setup prompt and gets it half-right must be told
 * exactly what is wrong, in plain language. A white screen or a console stack
 * trace is not an acceptable answer.
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
      setStatus(result.ok ? "ready" : "unreachable");
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
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={status} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{HEADLINES[status]}</p>
          <p className="mt-1 break-words text-on-surface-muted">
            {status === "misconfigured" ? problem : descriptionFor(status, detail)}
          </p>
          {status === "misconfigured" && <SetupSteps />}
          {status === "unreachable" && <SetupSteps />}
        </div>
      </div>
    </div>
  );
}

const HEADLINES: Record<Status, string> = {
  checking: "Checking your database",
  ready: "Database connected",
  misconfigured: "Database not configured yet",
  unreachable: "Could not reach the database",
};

function descriptionFor(status: Status, detail: string): string {
  if (status === "ready") return "Products, orders and reviews are stored and ready to use.";
  if (status === "checking") return "Confirming the keys in your .env file can reach Supabase.";
  return (
    detail || "Supabase refused the request. The keys may be wrong or the project may be paused."
  );
}

function toneFor(status: Status): string {
  if (status === "ready") return "border-positive/40 bg-positive/5";
  if (status === "misconfigured" || status === "unreachable")
    return "border-tertiary/40 bg-tertiary/5";
  return "border-outline bg-surface";
}

function StatusIcon({ status }: { status: Status }) {
  const shared = "mt-0.5 shrink-0";
  if (status === "ready")
    return <CheckCircle2 size={20} className={`${shared} text-positive`} aria-hidden="true" />;
  if (status === "misconfigured")
    return <AlertTriangle size={20} className={`${shared} text-tertiary`} aria-hidden="true" />;
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

function SetupSteps() {
  return (
    <ol className="mt-4 list-decimal space-y-1.5 ps-5 text-on-surface-muted">
      <li>
        Copy <code className="font-mono text-xs">.env.example</code> to{" "}
        <code className="font-mono text-xs">.env</code>
      </li>
      <li>Paste your Project URL and publishable key from Supabase → Project Settings → API</li>
      <li>
        Run <code className="font-mono text-xs">npm run dev</code> again
      </li>
    </ol>
  );
}
