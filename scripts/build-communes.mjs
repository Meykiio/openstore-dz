// Build public/data/communes.json from the islam-re/Algeria-wilayas dataset.
//
//   node scripts/build-communes.mjs path/to/wilaya-commune.json
//
// Source: https://github.com/islam-re/Algeria-wilayas, file
// json/wilaya-commune/wilaya-commune.json. MIT licence, (c) 2026 islam-re. It
// follows the 2026 reform (Law 26-06): 69 wilayas, 1,541 communes.
//
// The shop uses the 69-wilaya numbering too, so communes stay in their own wilaya.
import { readFileSync, writeFileSync } from "node:fs";

const source = JSON.parse(readFileSync(process.argv[2], "utf8"));
const wilayas = {};
for (const wilaya of source) {
  const code = wilaya.code;
  wilayas[code] ??= [];
  for (const commune of wilaya.communes) wilayas[code].push([commune.ascii, commune.arabic]);
}
for (const list of Object.values(wilayas)) list.sort((a, b) => a[0].localeCompare(b[0]));

const total = Object.values(wilayas).reduce((sum, list) => sum + list.length, 0);
if (Object.keys(wilayas).length !== 69 || total !== 1541) {
  throw new Error(
    `Expected 69 wilayas and 1541 communes, got ${Object.keys(wilayas).length} and ${total}`,
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
console.log(`Wrote ${total} communes across 69 wilayas.`);
