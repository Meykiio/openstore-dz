import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/feedback";
import {
  ContactStep,
  DeliveryStep,
  LegalStep,
  ShopStep,
  type SetupDraft,
} from "@/components/admin/setup-steps";
import { saveStoreSettings } from "@/lib/admin";
import { useDeliveryZones } from "@/lib/delivery";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings, type StoreSettings } from "@/lib/queries";
import { isPlaceholder, isValidDzPhone, saveAllZones } from "@/lib/setup-status";

export const Route = createFileRoute("/admin/welcome")({
  component: WelcomePage,
});

const STEPS = [
  "admin.setup.shop",
  "admin.setup.contact",
  "admin.setup.delivery",
  "admin.setup.legal",
] as const;

function WelcomePage() {
  const settings = useStoreSettings();
  const zones = useDeliveryZones();
  if (settings.isPending || zones.isPending) return <LoadingState />;
  return <Wizard settings={settings.data ?? null} zoneCount={zones.data?.length ?? 0} />;
}

/** Demo values start blank, so an owner cannot click through and keep them. */
function initialDraft(s: StoreSettings | null, zoneCount: number): SetupDraft {
  const real = (value: string | null | undefined) => (isPlaceholder(value) ? "" : (value ?? ""));
  const name = s?.name ?? "";
  return {
    name: ["openstore dz", "my shop"].includes(name.trim().toLowerCase()) ? "" : name,
    tagline: s?.tagline ?? "",
    logo_url: s?.logo_url ?? null,
    brand_color: s?.brand_color ?? null,
    phone: real(s?.phone),
    whatsapp: real(s?.whatsapp),
    email: s?.email ?? "",
    address: s?.address ?? "",
    north: String(s?.delivery_fee_flat ?? 600),
    south: "1200",
    pickupNorth: "",
    pickupSouth: "",
    freeAbove: String(s?.free_shipping_threshold ?? 0),
    applyZones: zoneCount === 0,
    legal_name: s?.legal_name ?? "",
    nif: real(s?.nif),
    rc_number: real(s?.rc_number),
  };
}

/**
 * First-run setup.
 *
 * The page a new owner lands on straight after claiming the shop, and the one
 * the dashboard sends them back to while anything buyers see is still a demo
 * value. Each step saves on Continue, so closing the tab halfway loses nothing.
 */
function Wizard({ settings, zoneCount }: { settings: StoreSettings | null; zoneCount: number }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => initialDraft(settings, zoneCount));
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const set = <K extends keyof SetupDraft>(key: K, value: SetupDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = useMutation({
    mutationFn: (current: number) => saveStep(current, draft),
    onSuccess: (_, current) => {
      void queryClient.invalidateQueries({ queryKey: ["store_settings"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery_zones"] });
      if (current === STEPS.length - 1) void navigate({ to: "/admin" });
      else setStep(current + 1);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const next = () => {
    if (step === 1 && !isValidDzPhone(draft.phone)) {
      setPhoneError(t("admin.setup.phoneInvalid"));
      return;
    }
    setPhoneError(null);
    save.mutate(step);
  };
  const last = step === STEPS.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <p className="font-mono text-xs text-on-surface-muted">
          {t("admin.setup.step", { n: step + 1, total: STEPS.length })}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">{t("admin.setup.title")}</h1>
        {step === 0 && (
          <p className="mt-1 text-sm text-on-surface-muted">{t("admin.setup.intro")}</p>
        )}
        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {STEPS.map((key, index) => (
            <span
              key={key}
              className={
                index <= step
                  ? "h-1.5 rounded-full bg-primary"
                  : "h-1.5 rounded-full bg-surface-high"
              }
            />
          ))}
        </div>
      </div>

      <form
        className="flex flex-col gap-4 rounded-[16px] border border-outline bg-surface p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          next();
        }}
      >
        <h2 className="font-display text-lg font-semibold">{t(STEPS[step])}</h2>
        {step === 0 && <ShopStep draft={draft} set={set} />}
        {step === 1 && <ContactStep draft={draft} set={set} phoneError={phoneError} />}
        {step === 2 && <DeliveryStep draft={draft} set={set} zoneCount={zoneCount} />}
        {step === 3 && <LegalStep draft={draft} set={set} />}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
              {t("common.back")}
            </Button>
          )}
          <span className="ms-auto flex gap-2">
            {last && (
              <Button type="button" variant="ghost" onClick={() => void navigate({ to: "/admin" })}>
                {t("admin.setup.skip")}
              </Button>
            )}
            <Button
              type="submit"
              disabled={save.isPending || (step === 0 && draft.name.trim().length < 2)}
            >
              {last ? t("admin.setup.finish") : t("admin.setup.next")}
            </Button>
          </span>
        </div>
      </form>
    </div>
  );
}

/** Each step saves on Continue, so closing the tab halfway loses nothing. */
async function saveStep(current: number, draft: SetupDraft): Promise<void> {
  const nullable = (value: string) => value.trim() || null;
  if (current === 0) {
    await saveStoreSettings({
      name: draft.name.trim(),
      tagline: nullable(draft.tagline),
      logo_url: draft.logo_url,
      brand_color: draft.brand_color,
    });
  } else if (current === 1) {
    await saveStoreSettings({
      phone: draft.phone.trim(),
      whatsapp: draft.whatsapp.trim() || draft.phone.trim(),
      email: nullable(draft.email),
      address: nullable(draft.address),
    });
  } else if (current === 2) {
    const north = Math.max(0, Number(draft.north) || 0);
    const south = Math.max(0, Number(draft.south) || north);
    await saveStoreSettings({
      delivery_fee_flat: north,
      free_shipping_threshold: Math.max(0, Number(draft.freeAbove) || 0),
    });
    // Empty pickup prices mean pickup is not offered, not that it is free.
    const optional = (value: string) =>
      value.trim() === "" ? null : Math.max(0, Number(value) || 0);
    if (draft.applyZones) {
      await saveAllZones(north, south, {
        north: optional(draft.pickupNorth),
        south: optional(draft.pickupSouth),
      });
    }
  } else {
    await saveStoreSettings({
      legal_name: nullable(draft.legal_name),
      nif: nullable(draft.nif),
      rc_number: nullable(draft.rc_number),
    });
  }
}
