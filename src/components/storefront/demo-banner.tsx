import { useI18n } from "@/lib/i18n-context";

const REPO_URL = "https://github.com/Meykiio/openstore-dz";

/** True on the public reference shop only. Forks leave `VITE_DEMO_MODE` unset. */
export const isDemoShop = import.meta.env.VITE_DEMO_MODE === "true";

/**
 * The reference shop is a demonstration, not a business. Without this line a
 * visitor arriving from a video would order, and nobody would ever call or
 * ship. Every page says so, and points to where they get a shop of their own.
 */
export function DemoBanner() {
  const { t } = useI18n();
  if (!isDemoShop) return null;

  return (
    <p className="bg-on-surface px-4 py-2 text-center text-xs text-surface sm:text-sm">
      {t("demo.banner")}{" "}
      <a href={REPO_URL} className="font-semibold underline underline-offset-2">
        {t("demo.cta")}
      </a>
    </p>
  );
}
