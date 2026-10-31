import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCTS } from "./products.mjs";
import { colourInfo } from "./colours.mjs";
import { slugify } from "./slug.mjs";
import { requireEnv } from "./env.mjs";

/**
 * Generates the catalogue seed.
 *
 * Written as data plus SQL rather than 316 literal image rows. The literal form
 * repeated a 100 character storage URL on every row and was 125 KB; this is about
 * a sixth of that and says the same thing, because the path of an image is
 * derivable from its product, its colour and its position.
 *
 * The colour table is the join of everything: it carries the Arabic label, the hex
 * for the swatch, the storage folder, and how many images that colour has. Every
 * other statement reads from it, so a colour cannot be seeded inconsistently.
 *
 * Stock is derived from a hash rather than stored, so re-running the seed produces
 * the same shop instead of reshuffling it.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const BUCKET = "product-media";
const OUT = join(HERE, "..", "..", "supabase", "seed-catalogue.sql");

const PLACEHOLDER_SLUGS = [
  "basket-blanche",
  "caftan-brode",
  "casquette-brodee",
  "ceinture-cuir",
  "chemise-carreaux",
  "chemise-lin-ete",
  "chemise-oxford",
  "chemise-slim-blanche",
  "echarpe-hiver",
  "hoodie-basique",
  "hoodie-zippe",
  "karakou-moderne",
  "legging-sport",
  "mocassin-cuir",
  "pantalon-chino",
  "pantalon-classique",
  "pantalon-jean-slim",
  "pantalon-jogger",
  "robe-casual",
  "robe-ete-fleurie",
  "robe-soiree",
  "sac-bandouliere",
  "sandale-ete",
  "survetement-complet",
  "sweat-col-rond",
  "tshirt-demo",
  "pack-demo",
  "pack-ete",
  "pack-hiver",
  "pack-manasabat",
  "pack-sport",
  "pack-travail",
];

const CATEGORIES = [
  { slug: "tshirts", name: "تي شيرتات", name_fr: "T-shirts", sort_order: 1 },
  { slug: "polos", name: "بولو", name_fr: "Polos", sort_order: 2 },
  { slug: "shorts", name: "شورتات", name_fr: "Shorts", sort_order: 3 },
  { slug: "bags", name: "حقائب", name_fr: "Sacs", sort_order: 4 },
];

const GUIDES = {
  top: {
    name: "دليل المقاسات",
    headers: ["المقاس", "الصدر (سم)", "الطول (سم)"],
    rows: [
      ["S", "96", "68"],
      ["M", "102", "70"],
      ["L", "108", "72"],
      ["XL", "114", "74"],
      ["XXL", "120", "76"],
    ],
    note: "القياسات مأخوذة والقطعة مفرودة على سطح مستو، مع هامش خطأ 1 إلى 2 سم.",
  },
  bottom: {
    name: "دليل المقاسات",
    headers: ["المقاس", "الخصر (سم)", "الطول (سم)"],
    rows: [
      ["S", "72", "48"],
      ["M", "78", "50"],
      ["L", "84", "52"],
      ["XL", "90", "54"],
    ],
    note: "القياسات مأخوذة والقطعة مفرودة على سطح مستو، مع هامش خطأ 1 إلى 2 سم.",
  },
};

const REVIEWS = [
  {
    customer_name: "أمينة ب.",
    rating: 5,
    comment: "الخامة ممتازة والقصة مطابقة للوصف. وصلني في ثلاثة أيام.",
  },
  { customer_name: "ياسين ح.", rating: 4, comment: "جيد جداً بالنسبة للسعر. اللون مطابق للصورة." },
  { customer_name: "سارة م.", rating: 5, comment: "طلبت مقاس L وكان مناسباً تماماً. أنصح به." },
  { customer_name: "كريم ز.", rating: 5, comment: "تعامل محترم والتوصيل سريع. سأعيد الطلب." },
  {
    customer_name: "نادية ع.",
    rating: 4,
    comment: "القطعة جميلة، أخذت مقاساً أكبر قليلاً وكان أفضل.",
  },
];

function q(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * A Postgres array literal, not JSON.
 *
 * `headers` is a text[] column, and casting a JSON array string to text[] fails
 * with "malformed array literal" because Postgres wants braces. `rows` is jsonb
 * and does want JSON, so the two are formatted differently on purpose.
 */
function pgArray(values) {
  return `{${values.map((v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;
}

function rows(list) {
  return list.map((row) => `  (${row.map(q).join(", ")})`).join(",\n");
}

/** One row per colour, carrying everything every later statement needs. */
function colourTable(manifest) {
  const out = [];
  for (const product of manifest.products) {
    for (const entry of product.colours) {
      const info = colourInfo(entry.colour);
      out.push([
        product.slug,
        entry.colour,
        entry.colour ? info.hex : null,
        slugify(entry.colour ?? "single"),
        entry.files.length,
      ]);
    }
  }
  return out;
}

function sizeTable() {
  const out = [];
  for (const product of PRODUCTS) {
    const sizes = product.sizes.length > 0 ? product.sizes : [null];
    sizes.forEach((size, index) => out.push([product.slug, size, index]));
  }
  return out;
}

function priceTable() {
  return PRODUCTS.map((p) => [p.slug, p.price, p.compareAt ?? null]);
}

function build(manifest, urlBase) {
  const base = `${urlBase}/storage/v1/object/public/${BUCKET}/catalogue/`;
  const colours = colourTable(manifest);
  const sizes = sizeTable();
  const prices = priceTable();
  const slugs = PRODUCTS.map((p) => p.slug);
  const placeholders = PLACEHOLDER_SLUGS.map(q).join(", ");
  const catalogueSlugs = slugs.map(q).join(", ");

  return `-- Generated by scripts/catalogue/build-seed.mjs. Do not edit by hand.
--
-- The shop's own photography, prepared for the web. Run
-- scripts/catalogue/upload.mjs first: the image URLs are derived from the same
-- staging tree that uploader walks, so they cannot point at an object that was
-- never uploaded.
--
-- Re-running is safe. Products are matched on slug, variants and images are
-- replaced, and the placeholder catalogue from seed-demo.sql is removed.

begin;

-- The colour table. Everything else joins to it, so a colour cannot be seeded
-- with a label in one place and a folder in another.
create temporary table catalogue_colour (
  slug text, colour text, hex text, dir text, images int
) on commit drop;

insert into catalogue_colour (slug, colour, hex, dir, images) values
${rows(colours)};

create temporary table catalogue_size (slug text, size text, ord int) on commit drop;
insert into catalogue_size (slug, size, ord) values
${rows(sizes)};

create temporary table catalogue_price (slug text, price int, compare_at int) on commit drop;
insert into catalogue_price (slug, price, compare_at) values
${rows(prices)};

-- Categories.
insert into public.categories (slug, name, name_fr, sort_order, is_active) values
${rows(CATEGORIES.map((c) => [c.slug, c.name, c.name_fr, c.sort_order, true]))}
on conflict (slug) do update set
  name = excluded.name,
  name_fr = excluded.name_fr,
  sort_order = excluded.sort_order,
  is_active = true;

-- The placeholder catalogue. Children first: the foreign keys do not cascade, so
-- deleting a product that still has variants would fail.
delete from public.order_items where variant_id in (
  select v.id from public.product_variants v
  join public.products p on p.id = v.product_id
  where p.slug in (${placeholders})
);
delete from public.variant_images where variant_id in (
  select v.id from public.product_variants v
  join public.products p on p.id = v.product_id
  where p.slug in (${placeholders})
);
delete from public.product_variants where product_id in (
  select id from public.products where slug in (${placeholders})
);
delete from public.pack_items where product_id in (
  select id from public.products where slug in (${placeholders})
);
delete from public.reviews where product_id in (
  select id from public.products where slug in (${placeholders})
);
delete from public.size_guides where product_id in (
  select id from public.products where slug in (${placeholders})
);
delete from public.products where slug in (${placeholders});

-- A category with nothing in it renders as an empty filter, so the ones the
-- placeholder catalogue owned are removed rather than left behind.
delete from public.categories c
where c.slug not in (${CATEGORIES.map((x) => q(x.slug)).join(", ")})
  and not exists (select 1 from public.products p where p.category_id = c.id);

-- Products.
insert into public.products (slug, name, name_fr, description, description_fr, kind, status)
values
${rows(PRODUCTS.map((p) => [p.slug, p.name, p.nameFr, p.desc, p.descFr, "single", "published"]))}
on conflict (slug) do update set
  name = excluded.name,
  name_fr = excluded.name_fr,
  description = excluded.description,
  description_fr = excluded.description_fr,
  status = 'published';

${PRODUCTS.map(
  (p) =>
    `update public.products set category_id = (select id from public.categories where slug = ${q(p.category)}), published_at = coalesce(published_at, now()) where slug = ${q(p.slug)};`,
).join("\n")}

-- Variants: every colour in every size. Images are shared across the sizes of one
-- colour, because the stock was photographed once per colour.
delete from public.variant_images where variant_id in (
  select v.id from public.product_variants v
  join public.products p on p.id = v.product_id
  where p.slug in (${catalogueSlugs})
);
delete from public.product_variants where product_id in (
  select id from public.products where slug in (${catalogueSlugs})
);

insert into public.product_variants (
  product_id, size, color_name, color_hex, sku, price, compare_at_price, stock, sort_order, is_active
)
select
  p.id,
  s.size,
  c.colour,
  c.hex,
  upper(c.slug) || '-' || upper(c.dir) || '-' || coalesce(upper(s.size), 'U'),
  pr.price,
  pr.compare_at,
  -- Deterministic, so the seed is reproducible. Roughly one variant in twenty is
  -- deliberately out of stock, because a shop with no sold-out items looks staged.
  case when abs(hashtext(c.slug || c.dir || coalesce(s.size, 'u'))) % 23 = 0
       then 0
       else 3 + (abs(hashtext(c.slug || c.dir || coalesce(s.size, 'u'))) % 38)
  end,
  s.ord,
  true
from catalogue_colour c
join catalogue_size s on s.slug = c.slug
join catalogue_price pr on pr.slug = c.slug
join public.products p on p.slug = c.slug;

-- Images. The path is derivable, so it is built rather than repeated.
insert into public.variant_images (variant_id, url, alt, sort_order)
select
  pv.id,
  ${q(base)} || c.slug || '/' || c.dir || '/' || lpad(n::text, 2, '0') || '.webp',
  p.name || case when c.colour is null then '' else ' - ' || c.colour end,
  n
from catalogue_colour c
join public.products p on p.slug = c.slug
join public.product_variants pv on pv.product_id = p.id and pv.color_name is not distinct from c.colour
cross join generate_series(1, c.images) as n;

-- Size guides. Tops and bottoms measure differently, so each gets the table that
-- matches what it is rather than one table with blanks in it.
delete from public.size_guides where product_id in (
  select id from public.products where slug in (${catalogueSlugs})
);

insert into public.size_guides (product_id, name, headers, rows, note, sort_order)
select p.id, g.name, g.headers::text[], g.rows::jsonb, g.note, 1
from (values
  ('top', ${q(GUIDES.top.name)}, ${q(pgArray(GUIDES.top.headers))}, ${q(JSON.stringify(GUIDES.top.rows))}, ${q(GUIDES.top.note)}),
  ('bottom', ${q(GUIDES.bottom.name)}, ${q(pgArray(GUIDES.bottom.headers))}, ${q(JSON.stringify(GUIDES.bottom.rows))}, ${q(GUIDES.bottom.note)})
) as g(kind, name, headers, rows, note)
join public.products p on p.slug in (${catalogueSlugs})
where g.kind = case when p.slug in (${
    PRODUCTS.filter((x) => x.category === "shorts" || x.category === "pants")
      .map((x) => q(x.slug))
      .join(", ") || "''"
  }) then 'bottom' else 'top' end;

-- Reviews, approved so the ratings show. One per product, varied.
delete from public.reviews where product_id in (
  select id from public.products where slug in (${catalogueSlugs})
);

${PRODUCTS.map((p, index) => {
  const r = REVIEWS[index % REVIEWS.length];
  return `insert into public.reviews (product_id, customer_name, rating, comment, is_approved)
select id, ${q(r.customer_name)}, ${r.rating}, ${q(r.comment)}, true
from public.products where slug = ${q(p.slug)};`;
}).join("\n")}

commit;
`;
}

async function main() {
  const env = await requireEnv(["VITE_SUPABASE_URL"]);
  const manifest = JSON.parse(await readFile(join(HERE, "manifest.json"), "utf8"));
  const sql = build(manifest, env.VITE_SUPABASE_URL.replace(/\/$/, ""));
  await writeFile(OUT, sql);
  console.log(`  wrote ${OUT}`);
  console.log(
    `  ${sql.split("\n").length} lines, ${(Buffer.byteLength(sql) / 1024).toFixed(0)} KB`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
