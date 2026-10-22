/**
 * The owner's brand colour, applied over the default theme.
 *
 * Text on the colour is black or white, whichever reads better by WCAG relative
 * luminance, so a pale yellow brand still gets legible buttons. Invalid input
 * is ignored rather than trusted: this string ends up inside a <style> tag.
 */
const HEX = /^#[0-9a-fA-F]{6}$/;

function channel(hex: string, start: number): number {
  const c = parseInt(hex.slice(start, start + 2), 16) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function textOn(hex: string): "#111111" | "#ffffff" {
  const l = 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  // Contrast against black is (l + 0.05) / 0.05; against white 1.05 / (l + 0.05).
  return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? "#111111" : "#ffffff";
}

export function brandCss(color: string | null | undefined): string | null {
  if (!color || !HEX.test(color)) return null;
  const on = textOn(color);
  return `:root,:root[data-theme]{--primary:${color};--primary-solid:${color};--on-primary:${on};}`;
}
