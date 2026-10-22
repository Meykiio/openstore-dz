import { brandCss } from "@/lib/brand";
import { useStoreSettings } from "@/lib/queries";

/** The owner's colour over the default theme. Renders nothing until one is set. */
export function BrandStyle() {
  const { data: settings } = useStoreSettings();
  const css = brandCss(settings?.brand_color);
  // brandCss only ever returns a validated hex colour inside fixed text.
  return css ? <style>{css}</style> : null;
}
