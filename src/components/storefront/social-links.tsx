import type { StoreSettings } from "@/lib/queries";

/**
 * Social links.
 *
 * Rendered as named text rather than icons: Lucide has no TikTok mark, and putting
 * a generic glyph next to "TikTok" would be inventing a brand logo. The names are
 * unambiguous in all three languages.
 *
 * Renders nothing when the owner has entered none, so a shop that has never opened
 * the settings page shows no empty column.
 */
export function SocialLinks({ settings }: { settings: StoreSettings | null | undefined }) {
  const links = [
    { href: settings?.instagram_url, label: "Instagram" },
    { href: settings?.facebook_url, label: "Facebook" },
    { href: settings?.tiktok_url, label: "TikTok" },
  ].filter((link): link is { href: string; label: string } => Boolean(link.href));

  if (links.length === 0) return null;

  return (
    <span className="flex flex-wrap items-center gap-x-4">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-sm text-on-surface-muted hover:text-primary"
        >
          {link.label}
        </a>
      ))}
    </span>
  );
}
