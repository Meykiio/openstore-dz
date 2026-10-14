/**
 * Splits the locale files into storefront and admin halves.
 *
 * They passed the project's 250-line file limit, and the limit is a [HARD] rule,
 * so the split is by audience: copy a buyer reads, and copy only the shop owner
 * reads. That is a real seam, not a way to dodge the rule.
 *
 * The parser is a small state machine rather than a line filter, because
 * Prettier wraps long values onto a continuation line. A naive "does this line
 * start with a quote" filter moves the second half of a wrapped value into the
 * wrong file, which is exactly what the first attempt did.
 *
 * Run with: node scripts/split-locales.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCALES = join(HERE, "..", "src", "lib", "locales");
const LANGS = ["ar", "fr", "en"];

/** A line that begins a new entry. Continuations do not match. */
const ENTRY_START = /^\s*"([^"]+)":/;
const TERMINATOR = /^\}\s*(as const)?;?\s*$/;

/**
 * Parse a locale file into key/entry pairs. Each entry keeps its full source
 * text, including any wrapped continuation lines.
 */
function parseEntries(source) {
  const entries = [];
  let current = null;

  for (const line of source.split("\n")) {
    if (TERMINATOR.test(line)) break;

    const start = ENTRY_START.exec(line);
    if (start) {
      if (current) entries.push(current);
      current = { key: start[1], lines: [line] };
      continue;
    }
    // A continuation line belongs to the entry above it.
    if (current) current.lines.push(line);
  }
  if (current) entries.push(current);
  return entries;
}

/** Strip the trailing comma so entries can be re-joined cleanly. */
function render(entry) {
  const text = entry.lines.join("\n").replace(/,\s*$/, "");
  return text;
}

const ADMIN_PREFIX = "admin.";

for (const lang of LANGS) {
  const file = join(LOCALES, `${lang}.ts`);
  const entries = parseEntries(readFileSync(file, "utf8"));
  const storefront = entries.filter((entry) => !entry.key.startsWith(ADMIN_PREFIX));
  const admin = entries.filter((entry) => entry.key.startsWith(ADMIN_PREFIX));

  const body = (list) => list.map(render).join(",\n");

  writeFileSync(
    join(LOCALES, `${lang}.storefront.ts`),
    `/* ${lang} copy a buyer reads. Split from ${lang}.ts for the 250-line limit. */\n` +
      `export const ${lang}Storefront = {\n${body(storefront)},\n};\n`,
  );

  writeFileSync(
    join(LOCALES, `${lang}.admin.ts`),
    `/* ${lang} copy only the shop owner reads. Split from ${lang}.ts for the 250-line limit. */\n` +
      `export const ${lang}Admin = {\n${body(admin)},\n};\n`,
  );

  const index =
    lang === "ar"
      ? `import { arAdmin } from "./ar.admin";\nimport { arStorefront } from "./ar.storefront";\n\n` +
        `/**\n * Arabic, the reference locale.\n *\n` +
        ` * Its keys define \`TranslationKey\`, so a key added here and forgotten in \`fr\` or\n` +
        ` * \`en\` is a compile error rather than a missing string at runtime.\n *\n` +
        ` * Split into storefront and admin halves because a single file passed the\n` +
        ` * project's 250-line limit. The seam is the audience, which is the real one.\n */\n` +
        `export const ar = { ...arStorefront, ...arAdmin };\n`
      : `import type { TranslationKey } from "../i18n";\n` +
        `import { ${lang}Admin } from "./${lang}.admin";\n` +
        `import { ${lang}Storefront } from "./${lang}.storefront";\n\n` +
        `/** Mirrors the Arabic keys exactly; a missing key is a compile error. */\n` +
        `export const ${lang}: Record<TranslationKey, string> = ` +
        `{ ...${lang}Storefront, ...${lang}Admin };\n`;

  writeFileSync(file, index);

  console.log(
    `${lang}: ${entries.length} entries -> storefront ${storefront.length}, admin ${admin.length}`,
  );
}
