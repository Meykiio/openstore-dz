/**
 * The 58 wilayas of Algeria.
 *
 * The carrier matches a wilaya by exact name string, so this list is a data
 * contract, not decoration. `fr` is the name sent to Guepex and `ar` is what the
 * buyer reads. If Guepex rejects a parcel with `commune` or `wilaya` errors,
 * compare the string here against their /wilayas endpoint before changing
 * anything else — that endpoint is the authority.
 *
 * Codes follow the official 1..58 numbering, including the ten southern wilayas
 * created in 2019 (49-58).
 */

import type { Locale } from "./i18n";

export type Wilaya = { code: number; fr: string; ar: string };

const RAW: ReadonlyArray<readonly [number, string, string]> = [
  [1, "Adrar", "أدرار"],
  [2, "Chlef", "الشلف"],
  [3, "Laghouat", "الأغواط"],
  [4, "Oum El Bouaghi", "أم البواقي"],
  [5, "Batna", "باتنة"],
  [6, "Bejaia", "بجاية"],
  [7, "Biskra", "بسكرة"],
  [8, "Bechar", "بشار"],
  [9, "Blida", "البليدة"],
  [10, "Bouira", "البويرة"],
  [11, "Tamanrasset", "تمنراست"],
  [12, "Tebessa", "تبسة"],
  [13, "Tlemcen", "تلمسان"],
  [14, "Tiaret", "تيارت"],
  [15, "Tizi Ouzou", "تيزي وزو"],
  [16, "Alger", "الجزائر"],
  [17, "Djelfa", "الجلفة"],
  [18, "Jijel", "جيجل"],
  [19, "Setif", "سطيف"],
  [20, "Saida", "سعيدة"],
  [21, "Skikda", "سكيكدة"],
  [22, "Sidi Bel Abbes", "سيدي بلعباس"],
  [23, "Annaba", "عنابة"],
  [24, "Guelma", "قالمة"],
  [25, "Constantine", "قسنطينة"],
  [26, "Medea", "المدية"],
  [27, "Mostaganem", "مستغانم"],
  [28, "M'Sila", "المسيلة"],
  [29, "Mascara", "معسكر"],
  [30, "Ouargla", "ورقلة"],
  [31, "Oran", "وهران"],
  [32, "El Bayadh", "البيض"],
  [33, "Illizi", "إليزي"],
  [34, "Bordj Bou Arreridj", "برج بوعريريج"],
  [35, "Boumerdes", "بومرداس"],
  [36, "El Tarf", "الطارف"],
  [37, "Tindouf", "تندوف"],
  [38, "Tissemsilt", "تيسمسيلت"],
  [39, "El Oued", "الوادي"],
  [40, "Khenchela", "خنشلة"],
  [41, "Souk Ahras", "سوق أهراس"],
  [42, "Tipaza", "تيبازة"],
  [43, "Mila", "ميلة"],
  [44, "Ain Defla", "عين الدفلى"],
  [45, "Naama", "النعامة"],
  [46, "Ain Temouchent", "عين تموشنت"],
  [47, "Ghardaia", "غرداية"],
  [48, "Relizane", "غليزان"],
  [49, "Timimoun", "تيميمون"],
  [50, "Bordj Badji Mokhtar", "برج باجي مختار"],
  [51, "Ouled Djellal", "أولاد جلال"],
  [52, "Beni Abbes", "بني عباس"],
  [53, "In Salah", "عين صالح"],
  [54, "In Guezzam", "عين قزام"],
  [55, "Touggourt", "تقرت"],
  [56, "Djanet", "جانت"],
  [57, "El M'Ghair", "المغير"],
  [58, "El Meniaa", "المنيعة"],
];

export const WILAYAS: readonly Wilaya[] = RAW.map(([code, fr, ar]) => ({ code, fr, ar }));

const BY_NAME = new Map<string, Wilaya>();
for (const w of WILAYAS) {
  BY_NAME.set(w.fr.toLowerCase(), w);
  BY_NAME.set(w.ar, w);
  BY_NAME.set(w.fr.toLowerCase().replace(/['’\s-]/g, ""), w);
}

/**
 * Resolve a stored wilaya string back to its record. The database stores the
 * name the buyer chose, and old rows may carry either script, so both are
 * matched, case- and apostrophe-insensitively.
 */
function wilayaByName(name: string | null | undefined): Wilaya | undefined {
  if (!name) return undefined;
  const direct = BY_NAME.get(name) ?? BY_NAME.get(name.toLowerCase());
  if (direct) return direct;
  return BY_NAME.get(name.toLowerCase().replace(/['’\s-]/g, ""));
}

export function wilayaLabel(name: string | null | undefined, locale: Locale): string {
  const w = wilayaByName(name);
  if (!w) return name ?? "";
  return locale === "ar" ? w.ar : w.fr;
}
