import { createFileRoute } from "@tanstack/react-router";
import { AiUpload } from "@/components/admin/ai-upload";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";

/**
 * /admin/upload/<code>: the one-time photo link Claude gives the owner.
 * Inside the admin layout, so the owner signs in first if needed.
 */
export const Route = createFileRoute("/admin/upload/$code")({
  component: UploadPage,
});

function UploadPage() {
  const { t } = useI18n();
  const { role } = useAuth();
  const { code } = Route.useParams();
  return (
    <div className="flex max-w-md flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold">{t("ai.upload.title")}</h1>
      {role === "owner" ? (
        <AiUpload code={code} />
      ) : (
        <p className="text-sm text-on-surface-muted">{t("ai.int.ownerOnly")}</p>
      )}
    </div>
  );
}
