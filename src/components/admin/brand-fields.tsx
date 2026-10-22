import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { uploadProductImage } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * Logo and colour, the two things that make a shop look like the owner's.
 * Both optional: a shop with neither shows its name in the default theme.
 */
export function LogoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const { url, error } = await uploadProductImage(file, "brand");
    setBusy(false);
    if (error || !url) toast.error(error ?? t("common.somethingWrong"));
    else onChange(url);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
        {t("admin.brand.logo")}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-14 w-28 place-items-center overflow-hidden rounded-[10px] border border-dashed border-outline-hi bg-surface-mid">
          {value ? (
            <img src={value} alt="" className="max-h-12 max-w-24 object-contain" />
          ) : (
            <ImagePlus size={20} className="text-on-surface-muted" aria-hidden="true" />
          )}
        </span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void upload(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus size={15} aria-hidden="true" />
          )}
          {value ? t("admin.brand.replace") : t("admin.brand.upload")}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X size={15} aria-hidden="true" />
            {t("common.delete")}
          </Button>
        )}
      </div>
      <p className="text-xs text-on-surface-muted">{t("admin.brand.logoHint")}</p>
    </div>
  );
}

// Colours that read well as buttons on both light and dark backgrounds.
const PRESETS = ["#c2410c", "#be123c", "#7c3aed", "#1d4ed8", "#0f766e", "#15803d", "#111111"];

export function ColorField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
        {t("admin.brand.color")}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
            className={cn("swatch", value === color && "active")}
          >
            <span style={{ background: color }} />
          </button>
        ))}
        <input
          type="color"
          value={value ?? "#c2410c"}
          onChange={(event) => onChange(event.target.value)}
          aria-label={t("admin.brand.custom")}
          className="size-9 cursor-pointer rounded-full border border-outline bg-transparent"
        />
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            {t("admin.brand.default")}
          </Button>
        )}
      </div>
    </div>
  );
}
