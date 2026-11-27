import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { SocialLinks } from "./social-links";
import { formatDzd } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

/**
 * Storefront footer.
 *
 * The editorial close of the page: wordmark, the three universes, the real
 * service terms and the trader's identity. Algerian law 18-05 (article 11) and
 * law 18-07 require a commercial site to publish the trader's identity, contact
 * details, delivery terms and return policy, so every field comes from
 * `store_settings` and a row the owner has not filled in is omitted rather than
 * rendered as an empty label.
 */
export function SiteFooter() {
  const { t, locale } = useI18n();
  const { data: settings } = useStoreSettings();

  const tagline = settings?.tagline
    ? localized(locale, settings.tagline, settings.tagline_fr)
    : null;
  const description = settings?.description
    ? localized(locale, settings.description, settings.description_fr)
    : null;
  const address = locale === "ar" ? settings?.address : (settings?.address_fr ?? settings?.address);
  const identity = [settings?.legal_name, address].filter(Boolean) as string[];
  const tax = [
    settings?.nif ? { label: "NIF", value: settings.nif } : null,
    settings?.rc_number ? { label: "RC", value: settings.rc_number } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const whatsappHref = waLink(settings?.whatsapp);
  const storeName = settings?.name?.trim() || t("app.name");
  const year = new Date().getFullYear();

  return (
    <footer className="store-footer">
      <div className="container-page store-footer-grid">
        <div>
          <Link to="/" className="store-wordmark">
            <span className="mark" aria-hidden="true" />
            <span>{storeName}</span>
          </Link>
          {(tagline || description) && (
            <p className="store-footer-note">{description ?? tagline}</p>
          )}
          <p className="store-footer-note">
            {t("home.ticker.cod")} · {t("home.trust.delivery.title")}
          </p>
          <SocialLinks settings={settings} />
        </div>

        <div>
          <h3>{t("footer.shop")}</h3>
          <nav className="store-footer-links" aria-label={t("footer.shop")}>
            <Link to="/catalogue">{t("nav.shop")}</Link>
            <Link to="/anime">{t("nav.anime")}</Link>
            <Link to="/streetwear">{t("nav.streetwear")}</Link>
            <Link to="/football">{t("nav.football")}</Link>
          </nav>
        </div>

        <div>
          <h3>{t("footer.help")}</h3>
          <div className="store-footer-links">
            <Link to="/track">{t("nav.trackOrder")}</Link>
            <Link to="/search">{t("nav.search")}</Link>
            {settings?.phone && (
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                <Phone size={14} aria-hidden="true" />
                <span dir="ltr" className="ms-2 font-mono text-xs">
                  {settings.phone}
                </span>
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} rel="noopener noreferrer" target="_blank">
                <Phone size={14} aria-hidden="true" />
                <span dir="ltr" className="ms-2 font-mono text-xs">
                  {settings?.whatsapp}
                </span>
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`}>
                <Mail size={14} aria-hidden="true" />
                <span className="ms-2">{settings.email}</span>
              </a>
            )}
          </div>
        </div>

        <div>
          <h3>{t("footer.contact")}</h3>
          <div className="store-footer-links">
            {identity.map((line) => (
              <span key={line} className="items-start gap-2">
                <MapPin size={14} className="mt-1 shrink-0" aria-hidden="true" />
                {line}
              </span>
            ))}
            {tax.map((item) => (
              <span key={item.label} className="font-mono text-[11px]">
                {item.label} {item.value}
              </span>
            ))}
            <span className="text-[11px]">
              {t("home.trust.returns.title", { days: settings?.returns_days ?? 14 })}
            </span>
          </div>
        </div>
      </div>

      <div className="container-page store-footer-bottom">
        <span>
          © {year} {storeName}. {t("footer.rights")}
        </span>
        <span>
          {t("checkout.codTitle")} · {t("cart.delivery")}{" "}
          {settings ? formatDzd(settings.delivery_fee_flat, locale) : "—"}
        </span>
        <span>{t("footer.madeIn")}</span>
      </div>

      {settings?.returns_note && (
        <div className="container-page pb-6">
          <p className="text-[11px] leading-relaxed text-[var(--store-on-ink-muted)]">
            {settings.returns_note}
          </p>
        </div>
      )}
    </footer>
  );
}
