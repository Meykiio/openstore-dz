import type { Named } from "./universe-taxonomy";

/**
 * The vocabulary of the Algeria Design universe.
 *
 * Like the series and club lists, these are names, not database rows: a hoodie
 * that says "Casbah" belongs on the Casbah shelf before anyone creates a
 * matching category. Aliases are matched against the normalised text a product
 * already carries, so nothing here invents stock or taxonomy.
 */
export const ALGERIA_THEMES: Named[] = [
  {
    key: "flag",
    ar: "العلم والراية",
    fr: "Drapeau",
    en: "Flag",
    aliases: ["flag", "drapeau", "الراية", "راية", "علم الجزائر"],
  },
  {
    key: "amazigh",
    ar: "أمازيغ",
    fr: "Amazigh",
    en: "Amazigh",
    aliases: ["amazigh", "tifinagh", "ⵣ", "امازيغ", "أمازيغ", "تيفيناغ", "قبائلي"],
  },
  {
    key: "casbah",
    ar: "القصبة",
    fr: "Casbah",
    en: "Casbah",
    aliases: ["casbah", "kasbah", "القصبة", "القصبه", "العاصمة", "algiers"],
  },
  {
    key: "sahara",
    ar: "الصحراء",
    fr: "Sahara",
    en: "Sahara",
    aliases: ["sahara", "tassili", "hoggar", "صحراء", "الصحراء", "تاسيلي", "الهقار"],
  },
  {
    key: "constantine",
    ar: "قسنطينة",
    fr: "Constantine",
    en: "Constantine",
    aliases: ["constantine", "قسنطينة", "قسنطينه", "جسور"],
  },
  {
    key: "oran",
    ar: "وهران",
    fr: "Oran",
    en: "Oran",
    aliases: ["oran", "وهران"],
  },
];
