import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CloudDownload, ImagePlus } from "lucide-react";
import { FramePicker } from "@/components/admin/frame-picker";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { addPhotos, fetchDriveFile, getUploadLink, type UploadLink } from "@/lib/admin-ai-upload";
import { useI18n } from "@/lib/i18n-context";

type Phase =
  | { kind: "idle" }
  | { kind: "working"; done: number; total: number }
  | { kind: "done"; count: number };

/** The page behind Claude's one-time photo link. Owner only (the database checks). */
export function AiUpload({ code }: { code: string }) {
  const { t } = useI18n();
  const link = useQuery({
    queryKey: ["ai_upload", code],
    queryFn: () => getUploadLink(code),
    retry: false,
  });

  if (link.isPending) return <LoadingState />;
  if (link.error) return <ErrorState message={link.error.message} />;
  if (!link.data) return <Notice text={t("ai.upload.missing")} />;
  if (link.data.used) return <Notice text={t("ai.upload.used")} />;
  if (link.data.expired) return <Notice text={t("ai.upload.expired")} />;
  return <Uploader code={code} link={link.data} />;
}

function Notice({ text }: { text: string }) {
  return <p className="rounded-[10px] bg-surface-highest px-3 py-2 text-sm">{text}</p>;
}

function Uploader({ code, link }: { code: string; link: UploadLink }) {
  const { t } = useI18n();
  const [focus, setFocus] = useState(0.5);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  const run = async (getFiles: () => Promise<File[]>, failure?: string) => {
    setError(null);
    try {
      const files = await getFiles();
      if (files.length === 0) return;
      setPhase({ kind: "working", done: 0, total: files.length });
      const count = await addPhotos(code, link, files, focus, (done) =>
        setPhase({ kind: "working", done, total: files.length }),
      );
      setPhase({ kind: "done", count });
    } catch (cause) {
      setPhase({ kind: "idle" });
      const detail = cause instanceof Error ? cause.message : String(cause);
      setError(failure ? `${failure} (${detail})` : detail);
    }
  };

  if (phase.kind === "done") {
    return (
      <p
        className="flex items-center gap-2 rounded-[10px] bg-positive/10 px-3 py-3 text-sm"
        role="status"
      >
        <CircleCheck size={18} className="text-positive" aria-hidden="true" />
        {t("ai.upload.done", { count: phase.count })}
      </p>
    );
  }

  const working = phase.kind === "working";
  return (
    <div className="flex flex-col gap-4">
      <p className="font-semibold">
        {t("ai.upload.for", { product: link.product_name, colour: link.color_name ?? "" })}
      </p>
      <p className="text-sm text-on-surface-muted">{t("ai.upload.keepHint")}</p>
      <FramePicker value={focus} onChange={setFocus} disabled={working} />

      <label className="btn btn-primary btn-lg cursor-pointer justify-center has-[:disabled]:opacity-50">
        <ImagePlus size={18} aria-hidden="true" />
        {t("ai.upload.pick")}
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={working}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void run(() => Promise.resolve(files));
          }}
        />
      </label>

      {link.drive_url && (
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="lg"
            disabled={working}
            onClick={() =>
              void run(async () => [await fetchDriveFile(code)], t("ai.upload.driveFailed"))
            }
          >
            <CloudDownload size={18} aria-hidden="true" />
            {t("ai.upload.drive")}
          </Button>
          <p className="text-xs text-on-surface-muted">{t("ai.upload.driveHelp")}</p>
        </div>
      )}

      {working && (
        <p className="text-sm" role="status" aria-live="polite">
          {t("ai.upload.working", { done: phase.done, total: phase.total })}
        </p>
      )}
      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
