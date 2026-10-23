-- =============================================================================
-- Demo catalogue: 20 different products, 4 colours each, with sizes, size guides
-- and a few approved reviews. OPTIONAL: run it after schema.sql to fill the shop
-- with something worth looking at, or skip it and add your own products.
--
-- Photos live in public/demo/<slug>/<colour>.webp and ship with the site.
-- Idempotent: a rerun adds only what is missing and never overwrites an edit.
-- To remove the demo, delete the products in Admin; their variants, photos and
-- size guides go with them.
-- =============================================================================

create temp table demo_p as
select * from jsonb_to_recordset($j$[
 {"slug":"tshirt-regular","cat":"tshirts","ar":"تي شيرت عادي","fr":"T-shirt regular","price":2200,"grams":180,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"تي شيرت قطني بقصة عادية، يناسب كل الإطلالات.","dfr":"T-shirt en coton, coupe regular, pour tous les jours.",
  "colours":[["Noir","#151515","black"],["Blanc","#f5f5f2","white"],["Beige sable","#d8c3a0","sand-beige"],["Bleu marine","#1c2a4a","navy-blue"]]},
 {"slug":"tshirt-oversize-basic","cat":"tshirts","ar":"تي شيرت أوفرسايز","fr":"T-shirt oversize","price":2900,"was":3400,"grams":240,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"قصة واسعة بكتف نازل، قطن سميك ومريح.","dfr":"Coupe ample à épaules tombantes, coton épais et doux.",
  "colours":[["Vert olive","#6b7a4a","olive-green"],["Blanc cassé","#f1ede4","off-white"],["Bleu marine","#1c2a4a","navy-blue"],["Noir","#151515","black"]]},
 {"slug":"acid-oversized-tshirt","cat":"tshirts","ar":"تي شيرت أوفرسايز أسيد","fr":"T-shirt oversize acid wash","price":3200,"grams":260,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"تي شيرت واسع بتأثير الغسل الحمضي القديم.","dfr":"T-shirt ample à l'effet délavé acide vintage.",
  "colours":[["Noir délavé","#2f2f2f","acid-washed-black"],["Gris délavé","#6a6a6a","acid-washed-grey"],["Marron délavé","#7a5238","acid-washed-brown"],["Bleu délavé","#4f7aa3","acid-washed-blue"]]},
 {"slug":"tshirt-manches-longues","cat":"tshirts","ar":"تي شيرت كم طويل","fr":"T-shirt manches longues","price":2800,"grams":210,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"تي شيرت قطني بكم طويل، مثالي لنصف الموسم.","dfr":"T-shirt en coton à manches longues, parfait en demi-saison.",
  "colours":[["Blanc","#f5f5f2","white"],["Bordeaux","#6e1f2c","burgundy"],["Noir","#151515","black"],["Bleu marine","#1c2a4a","navy-blue"]]},
 {"slug":"debardeur-sport","cat":"tshirts","ar":"تي شيرت رياضي بدون أكمام","fr":"Débardeur sport","price":1800,"grams":120,"sizes":["S","M","L","XL"],"guide":"tops",
  "dar":"قماش خفيف يسمح بالتهوية، للرياضة والصيف.","dfr":"Tissu léger et respirant, pour le sport et l'été.",
  "colours":[["Noir","#151515","black"],["Bleu roi","#1f4fb0","royal-blue"],["Blanc","#f5f5f2","white"],["Rouge","#c0262d","red"]]},
 {"slug":"polo-demi-manches","cat":"polos","ar":"قميص بولو نص كم","fr":"Polo demi-manches","price":3200,"grams":220,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"بولو من قماش بيكيه بياقة كلاسيكية وزرّين.","dfr":"Polo en piqué, col classique et patte à deux boutons.",
  "colours":[["Bleu marine","#1c2a4a","navy-blue"],["Blanc","#f5f5f2","white"],["Bordeaux","#7a1a2a","bordeaux-red"],["Vert forêt","#1f5a3a","forest-green"]]},
 {"slug":"chemise-casual","cat":"polos","ar":"قميص كاجوال","fr":"Chemise casual","price":3900,"grams":280,"sizes":["S","M","L","XL"],"guide":"tops",
  "dar":"قميص قطني بكم طويل وأزرار، أنيق ومريح.","dfr":"Chemise en coton à manches longues, élégante et confortable.",
  "colours":[["Blanc","#f5f5f2","white"],["Bleu ciel","#9cc3e6","sky-blue"],["Noir","#151515","black"],["Vert olive","#6b7a4a","olive-green"]]},
 {"slug":"hoodie-classique","cat":"sweats","ar":"هودي كلاسيكي","fr":"Hoodie classique","price":5200,"was":6200,"grams":650,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"هودي ثقيل بجيب أمامي وقبعة بخيط شد.","dfr":"Hoodie épais avec poche kangourou et capuche à cordon.",
  "colours":[["Noir","#151515","black"],["Gris chiné","#b5b5b5","heather-grey"],["Bleu marine","#1c2a4a","navy-blue"],["Bordeaux","#7a1a2a","bordeaux-red"]]},
 {"slug":"hoodie-zip","cat":"sweats","ar":"هودي بسحّاب","fr":"Hoodie zippé","price":5800,"grams":700,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"هودي من الفليس بسحّاب معدني وجيبين جانبيين.","dfr":"Hoodie zippé en molleton, fermeture métal et poches latérales.",
  "colours":[["Bleu marine","#1c2a4a","navy-blue"],["Crème","#efe6d2","cream"],["Noir","#151515","black"],["Vert olive","#6b7a4a","olive-green"]]},
 {"slug":"sweatshirt-col-rond","cat":"sweats","ar":"سويت شيرت برقبة دائرية","fr":"Sweat col rond","price":4200,"grams":520,"sizes":["S","M","L","XL","XXL"],"guide":"tops",
  "dar":"سويت شيرت قطني بأساور مطاطية، دافئ وخفيف.","dfr":"Sweat en coton avec bords côtes, chaud et léger.",
  "colours":[["Vert forêt","#1f5a3a","forest-green"],["Gris clair","#cfcfcf","light-grey"],["Bleu marine","#1c2a4a","navy-blue"],["Bordeaux","#6e1f2c","burgundy"]]},
 {"slug":"pull-maille","cat":"sweats","ar":"بلوفر صوف خفيف","fr":"Pull en maille","price":4800,"grams":450,"sizes":["S","M","L","XL"],"guide":"tops",
  "dar":"بلوفر محبوك برقبة دائرية، ناعم ودافئ.","dfr":"Pull tricoté col rond, doux et chaud.",
  "colours":[["Crème","#efe6d2","cream"],["Bleu marine","#1c2a4a","navy-blue"],["Anthracite","#3b3b3b","charcoal"],["Camel","#b98a55","camel"]]},
 {"slug":"veste-coupe-vent","cat":"sweats","ar":"جاكيت واقٍ من الرياح","fr":"Veste coupe-vent","price":5500,"was":6500,"grams":380,"sizes":["S","M","L","XL"],"guide":"tops",
  "dar":"جاكيت خفيف بسحّاب وياقة عالية، يحميك من الريح.","dfr":"Veste légère zippée à col montant, protège du vent.",
  "colours":[["Noir","#151515","black"],["Kaki","#8a8466","khaki"],["Bleu marine","#1c2a4a","navy-blue"],["Gris","#8e9096","grey"]]},
 {"slug":"jogger-molleton","cat":"pants","ar":"بنطال جوغر","fr":"Jogging molleton","price":3900,"grams":480,"sizes":["S","M","L","XL","XXL"],"guide":"waist",
  "dar":"بنطال رياضي من المولتون بحاشية مطاطية.","dfr":"Jogging en molleton à chevilles élastiquées.",
  "colours":[["Noir","#151515","black"],["Gris chiné","#b5b5b5","heather-grey"],["Bleu marine","#1c2a4a","navy-blue"],["Vert olive","#6b7a4a","olive-green"]]},
 {"slug":"pantalon-cargo","cat":"pants","ar":"بنطال كارغو","fr":"Pantalon cargo","price":4600,"grams":560,"sizes":["38","40","42","44","46"],"guide":"pants",
  "dar":"بنطال واسع بجيوب جانبية كبيرة وقماش متين.","dfr":"Pantalon ample à grandes poches latérales, tissu résistant.",
  "colours":[["Vert olive","#6b7a4a","olive-green"],["Beige","#cdb88f","beige"],["Noir","#151515","black"],["Gris pierre","#9c9a94","stone-grey"]]},
 {"slug":"jean-slim","cat":"pants","ar":"جينز سليم","fr":"Jean slim","price":4800,"grams":650,"sizes":["38","40","42","44","46"],"guide":"pants",
  "dar":"جينز بقصة سليم وخمسة جيوب، مرن ومريح.","dfr":"Jean coupe slim cinq poches, souple et confortable.",
  "colours":[["Indigo foncé","#1f2b45","dark-indigo"],["Bleu clair délavé","#7da3c8","light-wash-blue"],["Noir","#151515","black"],["Gris délavé","#8a8f96","grey-wash"]]},
 {"slug":"short-classique","cat":"shorts","ar":"شورت كلاسيكي","fr":"Short classique","price":2300,"grams":250,"sizes":["S","M","L","XL"],"guide":"waist",
  "dar":"شورت قطني بخصر مطاطي وخيط شد.","dfr":"Short en coton, taille élastique avec cordon.",
  "colours":[["Noir","#151515","black"],["Gris chiné","#b5b5b5","heather-grey"],["Bleu marine","#1c2a4a","navy-blue"],["Vert olive","#6b7a4a","olive-green"]]},
 {"slug":"wide-short","cat":"shorts","ar":"شورت واسع","fr":"Short large","price":2800,"grams":300,"sizes":["S","M","L","XL"],"guide":"waist",
  "dar":"شورت واسع بطول الركبة وجيوب جانبية.","dfr":"Short large à hauteur du genou avec poches latérales.",
  "colours":[["Beige","#cdb88f","beige"],["Noir","#151515","black"],["Vert olive","#6b7a4a","olive-green"],["Gris pierre","#9c9a94","stone-grey"]]},
 {"slug":"sacoche-bandouliere","cat":"accessories","ar":"حقيبة كتف صغيرة","fr":"Sacoche bandoulière","price":2400,"was":2900,"grams":350,"sizes":[],"guide":null,
  "dar":"حقيبة نايلون خفيفة بسحّاب وحزام قابل للتعديل.","dfr":"Sacoche en nylon légère, zip et bandoulière réglable.",
  "colours":[["Noir","#151515","black"],["Vert olive","#6b7a4a","olive-green"],["Beige sable","#d8c3a0","sand-beige"],["Bleu marine","#1c2a4a","navy-blue"]]},
 {"slug":"casquette-classique","cat":"accessories","ar":"قبعة كاب كلاسيكية","fr":"Casquette classique","price":1400,"grams":90,"sizes":[],"guide":null,
  "dar":"كاب قطني بستة أجزاء وحافة منحنية، مقاس واحد.","dfr":"Casquette en coton six panneaux, visière courbée, taille unique.",
  "colours":[["Noir","#151515","black"],["Beige sable","#d8c3a0","sand-beige"],["Bleu marine","#1c2a4a","navy-blue"],["Vert olive","#6b7a4a","olive-green"]]},
 {"slug":"bonnet-cotele","cat":"accessories","ar":"قبعة صوفية مضلعة","fr":"Bonnet côtelé","price":1200,"grams":80,"sizes":[],"guide":null,
  "dar":"قبعة محبوكة بحافة مطوية، دافئة ومرنة.","dfr":"Bonnet tricoté à revers, chaud et extensible.",
  "colours":[["Noir","#151515","black"],["Gris chiné","#b5b5b5","heather-grey"],["Bleu marine","#1c2a4a","navy-blue"],["Jaune moutarde","#d4a017","mustard-yellow"]]}
]$j$::jsonb) as t(slug text, cat text, ar text, fr text, dar text, dfr text, price int, was int,
                   grams int, sizes text[], guide text, colours jsonb);

insert into public.categories (slug, name, name_fr, sort_order) values
  ('tshirts',     'تيشيرتات',       'T-shirts',          1),
  ('polos',       'بولو وقمصان',    'Polos & chemises',  2),
  ('sweats',      'هوديز وسترات',   'Sweats & vestes',   3),
  ('pants',       'بناطيل',         'Pantalons',         4),
  ('shorts',      'شورتات',         'Shorts',            5),
  ('accessories', 'إكسسوارات',      'Accessoires',       6)
on conflict (slug) do nothing;

-- A category tile shows one of its products.
update public.categories c set image_url = v.url
  from (values
    ('tshirts', '/demo/tshirt-regular/black.webp'),
    ('polos', '/demo/polo-demi-manches/navy-blue.webp'),
    ('sweats', '/demo/hoodie-classique/black.webp'),
    ('pants', '/demo/jean-slim/dark-indigo.webp'),
    ('shorts', '/demo/short-classique/black.webp'),
    ('accessories', '/demo/sacoche-bandouliere/black.webp')
  ) as v(slug, url)
 where c.slug = v.slug and c.image_url is null;

insert into public.products (slug, name, name_fr, description, description_fr, kind, status, category_id, published_at)
select d.slug, d.ar, d.fr, d.dar, d.dfr, 'single', 'published', c.id, now()
  from demo_p d join public.categories c on c.slug = d.cat
on conflict (slug) do nothing;

-- One variant per colour and size. Stock is spread deterministically, with a few
-- low ones so the dashboard's stock warning has something to show.
insert into public.product_variants
  (product_id, size, color_name, color_hex, sku, price, stock, weight_grams, sort_order)
select pr.id, sz.size, c.v->>0, c.v->>1,
       upper(d.slug || '-' || (c.v->>2) || '-' || coalesce(sz.size, 'U')),
       d.price,
       case when abs(hashtext(d.slug || (c.v->>2) || coalesce(sz.size, ''))) % 13 = 0 then 3
            else 6 + abs(hashtext(d.slug || (c.v->>2) || coalesce(sz.size, ''))) % 40 end,
       d.grams, (c.ord - 1)::int
  from demo_p d
  join public.products pr on pr.slug = d.slug
  cross join lateral jsonb_array_elements(d.colours) with ordinality as c(v, ord)
  cross join lateral unnest(case when cardinality(d.sizes) = 0 then array[null]::text[] else d.sizes end) as sz(size)
 where not exists (
   select 1 from public.product_variants x
    where x.product_id = pr.id and x.size is not distinct from sz.size and x.color_name = c.v->>0
 );

-- A sale price on the products that carry a "was" price.
update public.product_variants v set compare_at_price = d.was
  from demo_p d join public.products pr on pr.slug = d.slug
 where v.product_id = pr.id and d.was is not null and v.compare_at_price is null;

-- Every size of a colour shows that colour's photo.
insert into public.variant_images (variant_id, url, alt, sort_order)
select v.id,
       '/demo/' || d.slug || '/' || (select e->>2 from jsonb_array_elements(d.colours) e where e->>0 = v.color_name) || '.webp',
       d.fr || ' - ' || v.color_name, 0
  from demo_p d
  join public.products pr on pr.slug = d.slug
  join public.product_variants v on v.product_id = pr.id
 where not exists (select 1 from public.variant_images i where i.variant_id = v.id);

-- Size guides, trimmed to the sizes each product is actually sold in.
with g(key, headers, rows, note, note_fr) as (values
  ('tops', array['المقاس','الصدر (سم)','الطول (سم)'],
   '[["S","96","68"],["M","102","70"],["L","108","72"],["XL","114","74"],["XXL","120","76"]]'::jsonb,
   'القياسات مأخوذة والقطعة مفرودة على سطح مستو، مع هامش خطأ 1 إلى 2 سم.',
   'Mesures prises à plat, avec une marge de 1 à 2 cm.'),
  ('pants', array['المقاس','الخصر (سم)','الورك (سم)','الطول الداخلي (سم)'],
   '[["38","76","96","78"],["40","80","100","79"],["42","84","104","80"],["44","88","108","81"],["46","92","112","82"]]'::jsonb,
   'الخصر يُقاس عند أعلى البنطال مفرودًا، والطول الداخلي من الحاشية الداخلية إلى أسفل الساق.',
   'Tour de taille mesuré à plat en haut du pantalon, entrejambe de la couture au bas de la jambe.'),
  ('waist', array['المقاس','الخصر (سم)'],
   '[["S","72"],["M","76"],["L","80"],["XL","84"],["XXL","88"]]'::jsonb,
   'الخصر المطاطي يُقاس مفرودًا دون شد، وهو يتسع حتى 15 سم إضافية.',
   'Taille élastique mesurée à plat sans tirer, elle s''étire de 15 cm environ.')
)
insert into public.size_guides (product_id, name, headers, rows, note, note_fr, sort_order)
select pr.id, 'دليل المقاسات', g.headers,
       (select jsonb_agg(r) from jsonb_array_elements(g.rows) r where (r->>0) = any(d.sizes)),
       g.note, g.note_fr, 0
  from demo_p d
  join g on g.key = d.guide
  join public.products pr on pr.slug = d.slug
 where not exists (select 1 from public.size_guides s where s.product_id = pr.id);

-- Reviews arrive unapproved (validate_review forces it), so approve them after,
-- the same way the moderation screen does.
create temp table demo_r as
select * from (values
    ('hoodie-classique', 'ياسين ح.', 5, 'قماش ثقيل ودافئ، والمقاس مضبوط تماماً.'),
    ('hoodie-classique', 'سارة م.', 4, 'ممتاز للشتاء، واللون مطابق للصورة.'),
    ('jean-slim', 'كريم ز.', 5, 'قصة ممتازة ومريحة، وصلني في ثلاثة أيام.'),
    ('jean-slim', 'نادية ع.', 4, 'جودة جيدة بالنسبة للسعر.'),
    ('tshirt-regular', 'أمين ب.', 5, 'قطن مريح ولا يتقلص بعد الغسل.'),
    ('tshirt-oversize-basic', 'ليلى ك.', 5, 'القصة الواسعة رائعة، أخذت مقاس M.'),
    ('polo-demi-manches', 'رضا ف.', 4, 'أنيق ومناسب للعمل.'),
    ('pantalon-cargo', 'محمد س.', 5, 'الجيوب كبيرة والقماش متين.'),
    ('veste-coupe-vent', 'إيمان د.', 5, 'خفيفة ومناسبة للمطر الخفيف.'),
    ('sacoche-bandouliere', 'يوسف ر.', 4, 'صغيرة وعملية، تتسع للهاتف والمحفظة.'),
    ('pull-maille', 'هدى ن.', 5, 'ناعم جداً ودافئ.'),
    ('chemise-casual', 'سمير ل.', 4, 'قماش جميل وخياطة نظيفة.')
  ) as r(slug, name, rating, comment);

insert into public.reviews (product_id, customer_name, rating, comment)
select pr.id, r.name, r.rating, r.comment
  from demo_r r join public.products pr on pr.slug = r.slug
 where not exists (
   select 1 from public.reviews x
    where x.product_id = pr.id and x.customer_name = r.name and x.comment = r.comment
 );

-- Only the reviews above, never a customer's own pending one.
update public.reviews x set is_approved = true
  from demo_r r join public.products pr on pr.slug = r.slug
 where x.product_id = pr.id and x.customer_name = r.name and x.comment = r.comment
   and x.is_approved = false;

drop table demo_r, demo_p;
