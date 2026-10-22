import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { SocialLinks } from "./social-links";
import { formatDzd } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

/**
 * Storefront footer.
 *
 * This is not decoration. Algerian law 18-05 (article 11) and law 18-07 require
 * a commercial site to publish the trader's identity, contact details, delivery
 * terms and return policy. The fields come from `store_settings`, and any row the
 * owner has not filled in is omitted rather than rendered as an empty label —
 * an address line reading "NIF:" with nothing after it is worse than no line.
 */
export function SiteFooter() {
  const { t, locale } = useI18n();
  const { data: settings } = useStoreSettings();

  // Owner text is shown in the buyer's language when a Latin version exists.
  // Arabic-only text is left out for French and English readers rather than
  // shown untranslated; the address falls back, since it is still an address.
  const ownText = (arabic: string | null | undefined, latin: string | null | undefined) =>
    locale === "ar" ? arabic : latin;
  const tagline = ownText(settings?.tagline, settings?.tagline_fr);
  const description = ownText(settings?.description, settings?.description_fr);
  const address = locale === "ar" ? settings?.address : (settings?.address_fr ?? settings?.address);
  const identity = [settings?.legal_name, address].filter(Boolean) as string[];
  const tax = [
    settings?.nif ? { label: "NIF", value: settings.nif } : null,
    settings?.rc_number ? { label: "RC", value: settings.rc_number } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const hasLegal = identity.length > 0 || tax.length > 0 || Boolean(settings?.phone);

  // Normalised, because an owner types the number the local way and wa.me needs
  // the international form. Null when there is no usable number, so the row is
  // omitted rather than rendered as a link that goes nowhere.
  const whatsappHref = waLink(settings?.whatsapp);

  return (
    <footer className="mt-16 border-t border-outline bg-section-alt">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="font-display text-lg font-semibold">{settings?.name ?? t("app.name")}</p>
          {tagline && <p className="text-sm text-on-surface-muted">{tagline}</p>}
          {description && <p className="max-w-sm text-sm text-on-surface-muted">{description}</p>}
        </div>

        {hasLegal && (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
              {t("admin.settings.legal")}
            </p>
            {identity.map((line) => (
              <p key={line} className="text-sm text-on-surface-muted">
                {line}
              </p>
            ))}
            {tax.map((item) => (
              <p key={item.label} className="font-mono text-xs text-on-surface-muted">
                {item.label} {item.value}
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("footer.contact")}</p>
          {settings?.phone && (
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="flex min-h-11 items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface"
            >
              <Phone size={15} aria-hidden="true" />
              <span dir="ltr" className="font-mono text-xs">
                {settings.phone}
              </span>
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              className="flex min-h-11 items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Phone size={15} aria-hidden="true" />
              <span dir="ltr" className="font-mono text-xs">
                {settings?.whatsapp}
              </span>
            </a>
          )}
          {settings?.email && (
            <a
              href={`mailto:${settings.email}`}
              className="flex min-h-11 items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface"
            >
              <Mail size={15} aria-hidden="true" />
              <span>{settings.email}</span>
            </a>
          )}
          {address && (
            <span className="flex items-center gap-2 text-sm text-on-surface-muted">
              <MapPin size={15} aria-hidden="true" />
              {address}
            </span>
          )}
          <SocialLinks settings={settings} />
        </div>
      </div>

      <div className="container-page flex flex-wrap items-center justify-between gap-3 border-t border-outline py-5 text-xs text-on-surface-muted">
        <p>
          {t("checkout.codTitle")} · {t("cart.delivery")}{" "}
          {settings ? formatDzd(settings.delivery_fee_flat, locale) : "—"} ·{" "}
          {t("admin.settings.returnsDays")} {settings?.returns_days ?? 0}
        </p>
      </div>

      {settings?.returns_note && (
        <div className="container-page pb-6">
          <p className="text-xs text-on-surface-muted">{settings.returns_note}</p>
        </div>
      )}
    </footer>
  );
}
