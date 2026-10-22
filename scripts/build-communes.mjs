// Build public/data/communes.json from the islam-re/Algeria-wilayas dataset.
//
//   node scripts/build-communes.mjs path/to/wilaya-commune.json
//
// Source: https://github.com/islam-re/Algeria-wilayas, file
// json/wilaya-commune/wilaya-commune.json. MIT licence, (c) 2026 islam-re. It
// follows the 2026 reform (Law 26-06): 69 wilayas, 1,541 communes.
//
// The shop and its carrier still work in the 58-wilaya numbering, so the
// communes of the eleven new wilayas are folded back into the wilaya they
// were carved from. Only the checkout's suggestions depend on this; a buyer
// can always type a commune that is not listed.
import { readFileSync, writeFileSync } from "node:fs";

const PARENT = {
  59: 3, // Aflou ← Laghouat
  60: 5, // Barika ← Batna
  61: 7, // El Kantara ← Biskra
  62: 12, // Bir El Ater ← Tébessa
  63: 13, // El Aricha ← Tlemcen
  64: 14, // Ksar Chellala ← Tiaret
  65: 17, // Aïn Oussara ← Djelfa
  66: 17, // Messaad ← Djelfa
  67: 26, // Ksar El Boukhari ← Médéa
  68: 28, // Bou Saâda ← M'Sila
  69: 32, // El Abiodh Sidi Cheikh ← El Bayadh
};

const source = JSON.parse(readFileSync(process.argv[2], "utf8"));
const wilayas = {};
for (const wilaya of source) {
  const code = PARENT[wilaya.code] ?? wilaya.code;
  wilayas[code] ??= [];
  for (const commune of wilaya.communes) wilayas[code].push([commune.ascii, commune.arabic]);
}
for (const list of Object.values(wilayas)) list.sort((a, b) => a[0].localeCompare(b[0]));

const total = Object.values(wilayas).reduce((sum, list) => sum + list.length, 0);
if (Object.keys(wilayas).length !== 58 || total !== 1541) {
  throw new Error(
    `Expected 58 wilayas and 1541 communes, got ${Object.keys(wilayas).length} and ${total}`,
  );
}

writeFileSync(
  "public/data/communes.json",
  JSON.stringify({
    source: "https://github.com/islam-re/Algeria-wilayas",
    license: "MIT, (c) 2026 islam-re",
    wilayas,
  }),
);
console.log(`Wrote ${total} communes across 58 wilayas.`);
