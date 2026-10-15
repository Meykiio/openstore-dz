/**
 * Colour palette.
 *
 * The source folders are named in French. This maps each to an Arabic label for
 * the storefront and to a hex value, because the product page renders a colour
 * swatch and a swatch without a colour is just a button.
 *
 * The hex values are picked to read correctly against the dark storefront. They
 * are the garment's colour, not the photograph's average, so they stay legible
 * when the swatch is small.
 */
export const COLOURS = {
  Noir: { ar: "أسود", hex: "#111114" },
  Blanc: { ar: "أبيض", hex: "#f4f2ee" },
  "Blanc Cassé": { ar: "أبيض مكسور", hex: "#e8e2d6" },
  Gris: { ar: "رمادي", hex: "#8b8b90" },
  "Gris Clair": { ar: "رمادي فاتح", hex: "#b4b4b8" },
  "Gris Foncé": { ar: "رمادي غامق", hex: "#565659" },
  Beige: { ar: "بيج", hex: "#d8c7a8" },
  "Beige clair": { ar: "بيج فاتح", hex: "#e3d6bd" },
  "Beige foncé": { ar: "بيج غامق", hex: "#b9a480" },
  Marron: { ar: "بني", hex: "#6b4a2f" },
  "Marron Caramel": { ar: "بني كراميل", hex: "#a56a35" },
  Vert: { ar: "أخضر", hex: "#2f6b46" },
  Verte: { ar: "أخضر", hex: "#2f6b46" },
  "Vert Cactus": { ar: "أخضر صباري", hex: "#5b7a3a" },
  "Vert Olive": { ar: "أخضر زيتوني", hex: "#6b6b3a" },
  "Vert Passport": { ar: "أخضر باسبور", hex: "#1f4d3f" },
  "Vert passport": { ar: "أخضر باسبور", hex: "#1f4d3f" },
  "Vert Bouteille": { ar: "أخضر قنينة", hex: "#1c4032" },
  "Vert Kaki": { ar: "أخضر كاكي", hex: "#6f6a45" },
  Bleu: { ar: "أزرق", hex: "#2b4a8b" },
  "Bleu Ciel": { ar: "أزرق سماوي", hex: "#7ba7d4" },
  "Bleu ciel": { ar: "أزرق سماوي", hex: "#7ba7d4" },
  "Bleu Clair": { ar: "أزرق فاتح", hex: "#93b8dd" },
  "Bleu Nuit": { ar: "أزرق ليلي", hex: "#1c2a4a" },
  "Bleu nuit": { ar: "أزرق ليلي", hex: "#1c2a4a" },
  "Bleu Aqua": { ar: "أزرق مائي", hex: "#3f9aa8" },
  "Bleu Roi Clair": { ar: "أزرق ملكي فاتح", hex: "#3d63c4" },
  "Bleu Roi Foncé": { ar: "أزرق ملكي غامق", hex: "#1f3a86" },
  "Bleu roi foncé": { ar: "أزرق ملكي غامق", hex: "#1f3a86" },
  "Bleu Vert": { ar: "أزرق مخضر", hex: "#2b6b7a" },
  "Bleu vert": { ar: "أزرق مخضر", hex: "#2b6b7a" },
  Rouge: { ar: "أحمر", hex: "#b0232b" },
  "Rouge Brique": { ar: "أحمر طوبي", hex: "#9c3b2a" },
  Bordeaux: { ar: "عنابي", hex: "#5e1f2b" },
  Orange: { ar: "برتقالي", hex: "#d2691e" },
  Saumon: { ar: "سلموني", hex: "#e08a72" },
  Rose: { ar: "وردي", hex: "#c96b8a" },
  "Rose Clair": { ar: "وردي فاتح", hex: "#e5a8b8" },
  "Rose clair": { ar: "وردي فاتح", hex: "#e5a8b8" },
  "Rose Fuchsia": { ar: "وردي فوشيا", hex: "#c2185b" },
  "Rose Fuschia": { ar: "وردي فوشيا", hex: "#c2185b" },
  Violet: { ar: "بنفسجي", hex: "#6b4c9a" },
  Lilas: { ar: "ليلكي", hex: "#a48cc4" },
  Aubergine: { ar: "باذنجاني", hex: "#5c2340" },
  Jaune: { ar: "أصفر", hex: "#d9b02c" },
  "Jaune Clair": { ar: "أصفر فاتح", hex: "#e3cb6b" },
  "Jaune Techno": { ar: "أصفر تكنو", hex: "#c8d92c" },
  "Jaune moutarde": { ar: "أصفر خردلي", hex: "#b8912b" },
};

export function colourInfo(name) {
  return COLOURS[name] ?? { ar: name, hex: "#8b8b90" };
}
