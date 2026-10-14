-- =============================================================================
-- Demo seed: a shop with enough data to look like a real one
-- =============================================================================
--
-- Run AFTER `schema.sql`. Separate from it on purpose: `schema.sql` gives a real
-- shop owner a working but minimal shop, and this gives the hosted demo a
-- catalogue worth clicking through. A shop owner should not have to delete 25
-- demo products they never asked for.
--
--   supabase db push                      # applies schema.sql
--   psql "$DATABASE_URL" -f supabase/seed-demo.sql
--
-- Re-runnable. A sentinel checks for the first product and returns early if the
-- demo catalogue is already there, so running it twice is a no-op rather than a
-- duplicate.
--
-- Everything here is demo data. The customer names are invented, the phone
-- numbers are in the reserved-looking 05xx range, and the imagery is external
-- placeholders. Replace all of it before a shop goes live.

do $$
begin
  if exists (select 1 from public.products where slug = 'chemise-slim-blanche') then
    raise notice 'Demo seed already applied. Nothing to do.';
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- Categories
  -- ---------------------------------------------------------------------------
  insert into public.categories (slug, name, name_fr, description, sort_order, is_active)
  values
    ('shirts',      'قمصان',            'Chemises',       'قمصان رجالية ونسائية بكل المقاسات.',       1, true),
    ('trousers',    'بناطيل',           'Pantalons',      'بناطيل قطنية وجينز وجوغر.',                2, true),
    ('dresses',     'فساتين',           'Robes',          'فساتين صيفية وسهرة.',                      3, true),
    ('hoodies',     'سويت شيرت',        'Sweats',         'سويت شيرت وهودي بقماش ثقيل.',              4, true),
    ('shoes',       'أحذية',            'Chaussures',     'أحذية رياضية وكلاسيكية.',                  5, true),
    ('accessories', 'إكسسوارات',        'Accessoires',    'حقائب، أحزمة، قبعات وأوشحة.',              6, true),
    ('sportswear',  'ملابس رياضية',     'Sport',          'أطقم رياضية وملابس تمرين.',                7, true),
    ('traditional', 'تقليدي',           'Traditionnel',   'قراقو وقفطان بلمسة عصرية.',                8, true)
  on conflict (slug) do nothing;

  -- ---------------------------------------------------------------------------
  -- Products
  -- ---------------------------------------------------------------------------
  insert into public.products (slug, name, name_fr, description, description_fr, kind, status, published_at, category_id)
  select v.slug, v.name, v.name_fr, v.description, v.description_fr, 'single', 'published', now() - (v.days || ' days')::interval, c.id
  from (values
    -- shirts
    ('chemise-slim-blanche', 'قميص قطن ضيق أبيض', 'Chemise coton slim blanche', 'قميص قطني 100% بقَصّة ضيقة، مناسب للعمل والمناسبات. القماش لا يحتاج كيًا كثيرًا.', 'Chemise 100% coton, coupe slim, pour le travail et les occasions.', 45, 'shirts'),
    ('chemise-oxford', 'قميص أوكسفورد أزرق', 'Chemise Oxford bleue', 'قميص أوكسفورد بقماش سميك قليلًا، أزرق كلاسيكي يناسب كل الأوقات.', 'Chemise Oxford au tissu épais, bleu classique.', 38, 'shirts'),
    ('chemise-lin-ete', 'قميص كتان صيفي', 'Chemise en lin', 'قميص كتان خفيف يتنفس في الحرارة، مثالي لصيف الجزائر.', 'Chemise en lin légère, idéale pour l''été algérien.', 30, 'shirts'),
    ('chemise-carreaux', 'قميص كاروهات', 'Chemise à carreaux', 'قميص كاروهات بقماش دافئ، يناسب الخريف والشتاء.', 'Chemise à carreaux chaude, pour l''automne et l''hiver.', 22, 'shirts'),
    -- trousers
    ('pantalon-chino', 'بنطال تشينو بيج', 'Pantalon chino beige', 'بنطال تشينو قطني بقَصّة مستقيمة، مريح ويرتدي مع كل شيء.', 'Chino en coton, coupe droite, confortable.', 40, 'trousers'),
    ('pantalon-jean-slim', 'جينز ضيق أزرق غامق', 'Jean slim bleu foncé', 'جينز ضيق بقماش مرن قليلًا، لا يفقد لونه بعد الغسل.', 'Jean slim légèrement stretch, qui ne perd pas sa couleur.', 35, 'trousers'),
    ('pantalon-jogger', 'بنطال جوغر رمادي', 'Jogger gris', 'جوغر قطني بحزام مطاطي، للبيت والخروج السريع.', 'Jogger en coton avec taille élastique.', 28, 'trousers'),
    ('pantalon-classique', 'بنطال كلاسيكي أسود', 'Pantalon classique noir', 'بنطال كلاسيكي بقماش أنيق، مناسب للمناسبات الرسمية.', 'Pantalon classique élégant, pour les occasions formelles.', 25, 'trousers'),
    -- dresses
    ('robe-ete-fleurie', 'فستان صيفي مزهّر', 'Robe d''été fleurie', 'فستان خفيف بنقشة أزهار، مريح في الحرارة.', 'Robe légère à fleurs, confortable par temps chaud.', 26, 'dresses'),
    ('robe-soiree', 'فستان سهرة طويل', 'Robe de soirée longue', 'فستان سهرة بقماش لامع وقَصّة طويلة.', 'Robe de soirée au tissu satiné, coupe longue.', 20, 'dresses'),
    ('robe-casual', 'فستان يومي بسيط', 'Robe décontractée', 'فستان بسيط بجيبين، يُلبس كل يوم.', 'Robe simple à deux poches, pour tous les jours.', 18, 'dresses'),
    -- hoodies
    ('hoodie-basique', 'هودي بسيط', 'Hoodie basique', 'هودي بقماش ثقيل 320 غرام، دافئ ولا يتشوّه بعد الغسل.', 'Hoodie 320 g, chaud et qui ne se déforme pas.', 32, 'hoodies'),
    ('hoodie-zippe', 'هودي بسحّاب', 'Hoodie zippé', 'هودي بسحّاب كامل وجيبين، عملي في الشتاء.', 'Hoodie zippé avec deux poches, pratique en hiver.', 27, 'hoodies'),
    ('sweat-col-rond', 'سويت شيرت رقبة دائرية', 'Sweat col rond', 'سويت شيرت بسيط برقبة دائرية، قطني بالكامل.', 'Sweat col rond, entièrement en coton.', 24, 'hoodies'),
    -- shoes
    ('basket-blanche', 'حذاء رياضي أبيض', 'Baskets blanches', 'حذاء رياضي أبيض بنعل مطاطي، يناسب المشي الطويل.', 'Baskets blanches à semelle caoutchouc.', 21, 'shoes'),
    ('mocassin-cuir', 'موكاسان جلد', 'Mocassins en cuir', 'موكاسان جلد طبيعي بخياطة يدوية.', 'Mocassins en cuir naturel, cousus main.', 16, 'shoes'),
    ('sandale-ete', 'صندل صيفي', 'Sandales d''été', 'صندل خفيف بنعل مريح للصيف.', 'Sandales légères à semelle confortable.', 14, 'shoes'),
    -- accessories
    ('ceinture-cuir', 'حزام جلد', 'Ceinture en cuir', 'حزام جلد طبيعي بإبزيم معدني.', 'Ceinture en cuir naturel, boucle métallique.', 30, 'accessories'),
    ('casquette-brodee', 'قبعة مطرزة', 'Casquette brodée', 'قبعة قطنية مطرزة بحجم قابل للتعديل.', 'Casquette en coton brodée, taille ajustable.', 26, 'accessories'),
    ('echarpe-hiver', 'وشاح شتوي', 'Écharpe d''hiver', 'وشاح صوف ناعم ودافئ.', 'Écharpe en laine douce et chaude.', 20, 'accessories'),
    ('sac-bandouliere', 'حقيبة كتف صغيرة', 'Sac bandoulière', 'حقيبة صغيرة بحزام طويل، تكفي للهاتف والمحفظة.', 'Petit sac à bandoulière longue.', 17, 'accessories'),
    -- sportswear
    ('survetement-complet', 'طقم رياضي كامل', 'Survêtement complet', 'طقم رياضي من قطعتين بقماش يمتص العرق.', 'Survêtement deux pièces, tissu respirant.', 19, 'sportswear'),
    ('legging-sport', 'ليقن رياضي', 'Legging de sport', 'ليقن مرن بقماش سميك لا يشف.', 'Legging stretch au tissu épais.', 15, 'sportswear'),
    -- traditional
    ('karakou-moderne', 'قراقو عصري', 'Karakou moderne', 'قراقو بطرز يدوي ولمسة عصرية في القَصّة.', 'Karakou brodé main, coupe moderne.', 12, 'traditional'),
    ('caftan-brode', 'قفطان مطرز', 'Caftan brodé', 'قفطان بقماش فاخر وطرز يدوي على الصدر.', 'Caftan au tissu luxueux, broderie main.', 10, 'traditional')
  ) as v(slug, name, name_fr, description, description_fr, days, category_slug)
  join public.categories c on c.slug = v.category_slug;

  -- ---------------------------------------------------------------------------
  -- Variants
  --
  -- Sizes are real size runs; stock is deliberately uneven, with two variants at
  -- zero so the out-of-stock path and the low-stock list have something to show.
  -- Two variants carry a compare_at_price so the sale rendering is exercised.
  -- ---------------------------------------------------------------------------
  insert into public.product_variants (product_id, size, color_name, color_hex, sku, price, compare_at_price, stock, weight_grams, sort_order)
  select p.id, v.size, v.color_name, v.color_hex, v.sku, v.price, v.compare_at, v.stock, v.weight, v.sort_order
  from (values
    ('chemise-slim-blanche','S','أبيض','#ffffff','DEMO-CSB-W-S',2900,null,9,200,0),
    ('chemise-slim-blanche','M','أبيض','#ffffff','DEMO-CSB-W-M',2900,null,14,210,1),
    ('chemise-slim-blanche','L','أبيض','#ffffff','DEMO-CSB-W-L',2900,null,11,220,2),
    ('chemise-slim-blanche','XL','أبيض','#ffffff','DEMO-CSB-W-XL',3100,null,0,230,3),
    ('chemise-oxford','M','أزرق','#1e3a8a','DEMO-COX-B-M',3400,4200,12,230,0),
    ('chemise-oxford','L','أزرق','#1e3a8a','DEMO-COX-B-L',3400,4200,10,240,1),
    ('chemise-oxford','XL','أزرق','#1e3a8a','DEMO-COX-B-XL',3600,4200,6,250,2),
    ('chemise-lin-ete','M','بيج','#d6c7a1','DEMO-CLE-B-M',3200,null,8,180,0),
    ('chemise-lin-ete','L','بيج','#d6c7a1','DEMO-CLE-B-L',3200,null,7,190,1),
    ('chemise-lin-ete','L','أزرق فاتح','#93c5fd','DEMO-CLE-BL-L',3200,null,5,190,2),
    ('chemise-carreaux','M','أحمر','#991b1b','DEMO-CCA-R-M',3300,null,6,240,0),
    ('chemise-carreaux','L','أحمر','#991b1b','DEMO-CCA-R-L',3300,null,5,250,1),
    ('pantalon-chino','38','بيج','#d6c7a1','DEMO-PCH-B-38',3600,null,10,420,0),
    ('pantalon-chino','40','بيج','#d6c7a1','DEMO-PCH-B-40',3600,null,12,430,1),
    ('pantalon-chino','42','بيج','#d6c7a1','DEMO-PCH-B-42',3600,null,7,440,2),
    ('pantalon-jean-slim','38','أزرق غامق','#1e293b','DEMO-PJS-B-38',3900,4800,9,480,0),
    ('pantalon-jean-slim','40','أزرق غامق','#1e293b','DEMO-PJS-B-40',3900,4800,13,490,1),
    ('pantalon-jean-slim','42','أزرق غامق','#1e293b','DEMO-PJS-B-42',3900,4800,4,500,2),
    ('pantalon-jogger','M','رمادي','#6b7280','DEMO-PJO-G-M',2700,null,15,400,0),
    ('pantalon-jogger','L','رمادي','#6b7280','DEMO-PJO-G-L',2700,null,12,410,1),
    ('pantalon-jogger','XL','رمادي','#6b7280','DEMO-PJO-G-XL',2700,null,0,420,2),
    ('pantalon-classique','40','أسود','#111827','DEMO-PCL-N-40',3800,null,8,450,0),
    ('pantalon-classique','42','أسود','#111827','DEMO-PCL-N-42',3800,null,6,460,1),
    ('robe-ete-fleurie','S','متعدد','#f472b6','DEMO-REF-M-S',4200,null,6,250,0),
    ('robe-ete-fleurie','M','متعدد','#f472b6','DEMO-REF-M-M',4200,null,8,260,1),
    ('robe-ete-fleurie','L','متعدد','#f472b6','DEMO-REF-M-L',4200,null,5,270,2),
    ('robe-soiree','M','أسود','#111827','DEMO-RSO-N-M',8900,11000,4,400,0),
    ('robe-soiree','L','أسود','#111827','DEMO-RSO-N-L',8900,11000,3,420,1),
    ('robe-soiree','M','عنابي','#7f1d1d','DEMO-RSO-B-M',8900,11000,2,400,2),
    ('robe-casual','S','رمادي','#9ca3af','DEMO-RCA-G-S',3500,null,9,220,0),
    ('robe-casual','M','رمادي','#9ca3af','DEMO-RCA-G-M',3500,null,7,230,1),
    ('hoodie-basique','M','أسود','#111827','DEMO-HOB-N-M',4500,null,11,520,0),
    ('hoodie-basique','L','أسود','#111827','DEMO-HOB-N-L',4500,null,9,540,1),
    ('hoodie-basique','XL','أسود','#111827','DEMO-HOB-N-XL',4700,null,5,560,2),
    ('hoodie-zippe','M','رمادي','#4b5563','DEMO-HOZ-G-M',5200,6000,8,560,0),
    ('hoodie-zippe','L','رمادي','#4b5563','DEMO-HOZ-G-L',5200,6000,7,580,1),
    ('sweat-col-rond','M','كحلي','#1e3a8a','DEMO-SCR-N-M',3900,null,10,480,0),
    ('sweat-col-rond','L','كحلي','#1e3a8a','DEMO-SCR-N-L',3900,null,8,500,1),
    ('basket-blanche','40','أبيض','#ffffff','DEMO-BKB-W-40',5500,null,7,700,0),
    ('basket-blanche','41','أبيض','#ffffff','DEMO-BKB-W-41',5500,null,9,720,1),
    ('basket-blanche','42','أبيض','#ffffff','DEMO-BKB-W-42',5500,null,6,740,2),
    ('basket-blanche','43','أبيض','#ffffff','DEMO-BKB-W-43',5700,null,3,760,3),
    ('mocassin-cuir','41','بني','#78350f','DEMO-MOC-B-41',7200,8500,4,650,0),
    ('mocassin-cuir','42','بني','#78350f','DEMO-MOC-B-42',7200,8500,5,670,1),
    ('sandale-ete','40','بني','#a16207','DEMO-SAN-B-40',2900,null,9,400,0),
    ('sandale-ete','41','بني','#a16207','DEMO-SAN-B-41',2900,null,8,410,1),
    ('ceinture-cuir','M','أسود','#111827','DEMO-CEI-N-M',2400,null,14,300,0),
    ('ceinture-cuir','L','أسود','#111827','DEMO-CEI-N-L',2400,null,10,320,1),
    ('casquette-brodee','واحد','أسود','#111827','DEMO-CAS-N-U',1900,null,18,120,0),
    ('casquette-brodee','واحد','بيج','#d6c7a1','DEMO-CAS-B-U',1900,null,12,120,1),
    ('echarpe-hiver','واحد','رمادي','#6b7280','DEMO-ECH-G-U',2600,null,11,250,0),
    ('echarpe-hiver','واحد','عنابي','#7f1d1d','DEMO-ECH-B-U',2600,null,7,250,1),
    ('sac-bandouliere','واحد','أسود','#111827','DEMO-SAC-N-U',3400,null,9,350,0),
    ('survetement-complet','M','كحلي','#1e3a8a','DEMO-SUR-N-M',6900,8200,6,900,0),
    ('survetement-complet','L','كحلي','#1e3a8a','DEMO-SUR-N-L',6900,8200,5,930,1),
    ('legging-sport','S','أسود','#111827','DEMO-LEG-N-S',2800,null,10,240,0),
    ('legging-sport','M','أسود','#111827','DEMO-LEG-N-M',2800,null,13,250,1),
    ('karakou-moderne','M','أزرق ملكي','#1d4ed8','DEMO-KAR-B-M',14500,null,3,700,0),
    ('karakou-moderne','L','أزرق ملكي','#1d4ed8','DEMO-KAR-B-L',14500,null,2,720,1),
    ('caftan-brode','M','ذهبي','#a16207','DEMO-CAF-G-M',12800,15000,3,800,0),
    ('caftan-brode','L','ذهبي','#a16207','DEMO-CAF-G-L',12800,15000,2,820,1)
  ) as v(slug, size, color_name, color_hex, sku, price, compare_at, stock, weight, sort_order)
  join public.products p on p.slug = v.slug;

  -- One image per variant. Deterministic seeds so the same product always gets the
  -- same picture, which matters when comparing two runs.
  insert into public.variant_images (variant_id, url, alt, sort_order)
  select pv.id,
         'https://picsum.photos/seed/' || pv.sku || '/900/1100',
         p.name || ' - ' || pv.color_name,
         0
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.sku like 'DEMO-%'
    and not exists (select 1 from public.variant_images vi where vi.variant_id = pv.id);

  -- ---------------------------------------------------------------------------
  -- Packs
  -- ---------------------------------------------------------------------------
  insert into public.products (slug, name, name_fr, description, description_fr, kind, status, published_at)
  values
    ('pack-ete', 'باك الصيف', 'Pack été', 'قميص كتان + بنطال تشينو، بسعر أقل من شرائهما منفصلين.', 'Chemise en lin + chino, moins cher que séparément.', 'pack', 'published', now() - interval '20 days'),
    ('pack-sport', 'باك رياضي', 'Pack sport', 'طقم رياضي كامل + حذاء رياضي.', 'Survêtement complet + baskets.', 'pack', 'published', now() - interval '18 days'),
    ('pack-hiver', 'باك الشتاء', 'Pack hiver', 'هودي ثقيل + وشاح صوف.', 'Hoodie épais + écharpe en laine.', 'pack', 'published', now() - interval '16 days'),
    ('pack-travail', 'باك العمل', 'Pack travail', 'قميص أوكسفورد + بنطال كلاسيكي.', 'Chemise Oxford + pantalon classique.', 'pack', 'published', now() - interval '14 days'),
    ('pack-manasabat', 'باك المناسبات', 'Pack cérémonie', 'قفطان مطرز + موكاسان جلد.', 'Caftan brodé + mocassins en cuir.', 'pack', 'published', now() - interval '12 days');

  insert into public.product_variants (product_id, size, color_name, color_hex, sku, price, compare_at_price, stock, weight_grams, sort_order)
  select p.id, v.size, v.color, v.hex, v.sku, v.price, v.compare_at, v.stock, v.weight, 0
  from (values
    ('pack-ete','M','متعدد','#22c55e','DEMO-PKETE-M',6200,6800,5,600),
    ('pack-ete','L','متعدد','#22c55e','DEMO-PKETE-L',6200,6800,4,620),
    ('pack-sport','M','كحلي','#1e3a8a','DEMO-PKSPO-M',11500,12700,4,1600),
    ('pack-sport','L','كحلي','#1e3a8a','DEMO-PKSPO-L',11500,12700,3,1650),
    ('pack-hiver','M','أسود','#111827','DEMO-PKHIV-M',6600,7100,6,770),
    ('pack-hiver','L','أسود','#111827','DEMO-PKHIV-L',6600,7100,5,790),
    ('pack-travail','40','كحلي','#1e3a8a','DEMO-PKTRA-40',6800,7200,5,690),
    ('pack-travail','42','كحلي','#1e3a8a','DEMO-PKTRA-42',6800,7200,4,710),
    ('pack-manasabat','M','ذهبي','#a16207','DEMO-PKCER-M',19500,23500,2,1500),
    ('pack-manasabat','L','ذهبي','#a16207','DEMO-PKCER-L',19500,23500,2,1520)
  ) as v(slug, size, color, hex, sku, price, compare_at, stock, weight)
  join public.products p on p.slug = v.slug;

  insert into public.variant_images (variant_id, url, alt, sort_order)
  select pv.id, 'https://picsum.photos/seed/' || pv.sku || '/900/1100', p.name, 0
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where p.kind = 'pack'
    and not exists (select 1 from public.variant_images vi where vi.variant_id = pv.id);

  insert into public.pack_items (product_id, variant_id, quantity, sort_order)
  select pk.id, pv.id, 1, x.sort
  from (values
    ('pack-ete','chemise-lin-ete','M',0),
    ('pack-ete','pantalon-chino','40',1),
    ('pack-sport','survetement-complet','M',0),
    ('pack-sport','basket-blanche','41',1),
    ('pack-hiver','hoodie-basique','M',0),
    ('pack-hiver','echarpe-hiver','واحد',1),
    ('pack-travail','chemise-oxford','M',0),
    ('pack-travail','pantalon-classique','40',1),
    ('pack-manasabat','caftan-brode','M',0),
    ('pack-manasabat','mocassin-cuir','41',1)
  ) as x(pack_slug, item_slug, item_size, sort)
  join public.products pk on pk.slug = x.pack_slug
  join public.products it on it.slug = x.item_slug
  join public.product_variants pv on pv.product_id = it.id and pv.size = x.item_size
  on conflict (product_id, variant_id) do nothing;

  -- ---------------------------------------------------------------------------
  -- Size guides
  --
  -- Store-wide for the clothing categories, plus one product-specific guide, so
  -- both the fallback path and the override path have data.
  -- ---------------------------------------------------------------------------
  -- `headers` is text[] and `rows` is jsonb. That asymmetry is in the schema, not
  -- a mistake here: headers are a flat list of names, rows are a ragged grid.
  insert into public.size_guides (product_id, name, headers, rows, note, sort_order)
  values
    (null, 'دليل المقاسات - قمصان',
     array['المقاس','الصدر (سم)','الخصر (سم)','الطول (سم)'],
     '[["S","96","80","68"],["M","100","84","70"],["L","104","88","72"],["XL","108","92","74"]]'::jsonb,
     'كل القياسات بالسنتيمتر، مأخوذة من القميص مفرودًا على سطح مستو. الطول من أعلى الكتف إلى الأسفل.',
     0),
    (null, 'دليل المقاسات - بناطيل',
     array['المقاس','الخصر (سم)','الورك (سم)','الطول الداخلي (سم)'],
     '[["38","76","96","78"],["40","80","100","79"],["42","84","104","80"],["44","88","108","81"]]'::jsonb,
     'الخصر يُقاس عند أعلى البنطال مفرودًا، والطول الداخلي من الحاشية الداخلية إلى أسفل الساق.',
     1),
    (null, 'دليل مقاسات الأحذية',
     array['المقاس الأوروبي','طول القدم (سم)'],
     '[["40","25.5"],["41","26.2"],["42","26.9"],["43","27.6"]]'::jsonb,
     'قِف على ورقة وظهّر كعبك، ثم قس المسافة من الكعب إلى أطول إصبع. اختر المقاس الأعلى إن كنت بين مقاسين.',
     2);

  -- One product-specific guide, so the override path has data as well as the
  -- store-wide fallback above.
  insert into public.size_guides (product_id, name, headers, rows, note, sort_order)
  select p.id, 'مقاسات القفطان',
         array['المقاس','الصدر (سم)','الطول (سم)'],
         '[["M","102","140"],["L","108","144"]]'::jsonb,
         'القفطان قَصّة واسعة، فاختر مقاسك المعتاد. الطول يُقاس من الكتف إلى أسفل الثوب.',
         3
  from public.products p where p.slug = 'caftan-brode';

  -- ---------------------------------------------------------------------------
  -- Delivery zones
  --
  -- Wilaya names are the French canonical spelling, because the carrier matches on
  -- an exact string and an Arabic name silently fails to match. Fees rise with
  -- distance from Algiers, which is how Algerian carriers actually price.
  -- ---------------------------------------------------------------------------
  insert into public.delivery_zones (wilaya, fee, eta_days, is_active)
  select v.wilaya, v.fee, v.eta, true
  from (values
    ('Alger', 600, 1), ('Blida', 650, 2), ('Boumerdes', 650, 2), ('Tipaza', 650, 2),
    ('Oran', 800, 3), ('Constantine', 800, 3), ('Annaba', 850, 3), ('Setif', 800, 3),
    ('Batna', 850, 3), ('Tlemcen', 900, 4), ('Bejaia', 800, 3), ('Tizi Ouzou', 750, 2),
    ('Skikda', 850, 3), ('Chlef', 750, 2), ('Djelfa', 900, 4), ('Biskra', 950, 4),
    ('Tiaret', 850, 3), ('Mostaganem', 850, 3), ('Medea', 700, 2), ('Mascara', 900, 4),
    ('Ouargla', 1100, 5), ('Ghardaia', 1050, 5), ('Bechar', 1300, 6), ('Adrar', 1400, 7),
    ('Tamanrasset', 1600, 8), ('Illizi', 1500, 7)
  ) as v(wilaya, fee, eta)
  on conflict (wilaya) do nothing;

  -- The shop has to actually serve the wilayas the orders below are going to, and
  -- `validate_order` enforces exactly that. Without this the demo orders are
  -- rejected with "we do not deliver to Blida yet", which is the guard working
  -- correctly on incomplete seed data rather than a bug in the guard.
  --
  -- Spellings must match `src/lib/wilayas.ts` character for character. They are
  -- the carrier's match keys and the app's lookup keys, so an accented "Sétif"
  -- silently matches neither and would fail only at the carrier.
  update public.store_settings
  set delivery_wilayas = array[
    'Alger','Blida','Boumerdes','Tipaza','Oran','Constantine','Annaba','Setif','Batna',
    'Tlemcen','Bejaia','Tizi Ouzou','Skikda','Chlef','Djelfa','Biskra','Tiaret',
    'Mostaganem','Medea','Mascara','Ouargla','Ghardaia','Bechar','Adrar','Tamanrasset','Illizi'
  ]
  where id = 1;

  -- ---------------------------------------------------------------------------
  -- Reviews
  --
  -- Most approved, three left pending so the moderation screen is not empty.
  -- validate_review() forces is_approved := false on INSERT, so the approved ones
  -- are set by a follow-up UPDATE, which is the same path the moderation screen
  -- uses. Do not weaken the trigger to make this simpler.
  -- ---------------------------------------------------------------------------
  insert into public.reviews (product_id, customer_name, rating, comment)
  select p.id, r.name, r.rating, r.comment
  from (values
    ('chemise-slim-blanche','أمين ب.',5,'قماش ممتاز والخياطة نظيفة. المقاس مطابق للدليل.'),
    ('chemise-slim-blanche','سفيان م.',4,'جيد جدًا، لكن اللون الأبيض يحتاج غسلًا منفصلًا.'),
    ('chemise-oxford','ياسمين ح.',5,'وصلني في يومين، والتغليف كان محترمًا.'),
    ('chemise-oxford','كريم ز.',4,'القماش سميك كما وصف. الأزرق أغمق قليلًا من الصورة.'),
    ('chemise-lin-ete','نبيل ع.',5,'مثالي لحرارة الصيف. خفيف ولا يلتصق.'),
    ('pantalon-chino','هدى ل.',5,'المقاس 40 جاء مطابقًا تمامًا. مريح جدًا.'),
    ('pantalon-jean-slim','رضا ب.',4,'الجينز مريح، لكن القَصّة أضيق قليلًا مما توقعت.'),
    ('pantalon-jogger','مريم ص.',5,'اشتريت اثنين. القماش لا يتشوّه بعد الغسل.'),
    ('robe-ete-fleurie','أمينة ك.',5,'جميل جدًا والنقشة أوضح في الحقيقة من الصورة.'),
    ('robe-soiree','سارة ب.',5,'لبسته في عرس وكان لافتًا. القماش ثقيل وأنيق.'),
    ('hoodie-basique','وليد ن.',5,'دفء حقيقي. 320 غرام كما هو مكتوب.'),
    ('hoodie-zippe','طارق ج.',4,'جيد، لكن السحّاب يحتاج تليينًا في البداية.'),
    ('basket-blanche','إلياس د.',4,'مريح للمشي الطويل. النعل يمسك جيدًا.'),
    ('mocassin-cuir','عبد الرحمان ف.',5,'جلد أصلي فعلًا. الخياطة يدوية كما قيل.'),
    ('survetement-complet','بلال هـ.',5,'الطقم كامل ومريح للتمرين.'),
    ('caftan-brode','فاطمة الزهراء',5,'الطرز يدوي بالفعل، وليس مطبوعًا. يستحق السعر.'),
    ('karakou-moderne','نور الهدى',5,'تحفة. أخذته لمناسبة وكل من رآه سأل من أين.'),
    ('pack-ete','سمير ق.',4,'الباك يوفّر فعلًا. لكن القميص جاء مقاسًا أصغر قليلًا.')
  ) as r(slug, name, rating, comment)
  join public.products p on p.slug = r.slug;

  update public.reviews set is_approved = true
  where product_id in (select id from public.products where slug like 'DEMO-%' or slug in
    ('chemise-slim-blanche','chemise-oxford','chemise-lin-ete','pantalon-chino','pantalon-jean-slim',
     'pantalon-jogger','robe-ete-fleurie','robe-soiree','hoodie-basique','hoodie-zippe','basket-blanche',
     'mocassin-cuir','survetement-complet','caftan-brode','karakou-moderne'))
    and customer_name in ('أمين ب.','سفيان م.','ياسمين ح.','كريم ز.','نبيل ع.','هدى ل.','رضا ب.','مريم ص.',
                          'أمينة ك.','سارة ب.','وليد ن.','طارق ج.','إلياس د.','عبد الرحمان ف.','بلال هـ.',
                          'فاطمة الزهراء','نور الهدى');

  -- ---------------------------------------------------------------------------
  -- Orders
  --
  -- Spread across the last 60 days and across every status, so the dashboard has
  -- a revenue trend, a refusal rate and a call queue rather than four empty
  -- widgets. Two refusals in one wilaya is deliberate: the wilaya table excludes
  -- anything under three orders, so nothing here should look like a false signal,
  -- and the point is to have data, not to invent a conclusion.
  --
  -- `subtotal` and `total` are written here and then corrected by the order-item
  -- triggers, which price items from the catalogue. That is the same path a real
  -- checkout takes, so the seeded totals cannot drift from the real ones.
  -- ---------------------------------------------------------------------------
  with created as (
    insert into public.orders (
      public_token, customer_name, phone, wilaya, commune, address,
      subtotal, delivery_fee, total, status, created_at,
      confirmed_at, shipped_at, delivered_at, refused_at, refused_reason,
      carrier, tracking_number
    )
    select
      gen_random_uuid(), o.name, o.phone, o.wilaya, o.commune, o.address,
      o.subtotal, o.fee, o.subtotal + o.fee, o.status::public.order_status,
      now() - (o.days || ' days')::interval,
      case when o.status <> 'pending' then now() - ((o.days - 1) || ' days')::interval end,
      case when o.status in ('shipped','delivered') then now() - ((o.days - 2) || ' days')::interval end,
      case when o.status = 'delivered' then now() - ((o.days - 4) || ' days')::interval end,
      case when o.status = 'refused' then now() - ((o.days - 1) || ' days')::interval end,
      case when o.status = 'refused' then 'لم يجب على الهاتف' end,
      case when o.status in ('shipped','delivered') then 'Guepex' end,
      case when o.status in ('shipped','delivered') then 'GPX' || lpad(o.days::text, 6, '0') end
    from (values
      ('أمين ب.',        '0551234567', 'Alger',       'Bab El Oued',   '12 شارع العربي بن مهيدي', 5400,  600,  'delivered', 52),
      ('ياسمين ح.',      '0661234567', 'Alger',       'Hydra',         '5 شارع باستور',            4200,  600,  'delivered', 47),
      ('كريم ز.',        '0771234567', 'Oran',        'Bir El Djir',   '23 حي النور',              8900,  800,  'delivered', 44),
      ('هدى ل.',         '0552345678', 'Constantine', 'El Khroub',     '7 شارع الإخوة',            3600,  800,  'delivered', 41),
      ('رضا ب.',         '0662345678', 'Alger',       'Kouba',         '31 حي السلام',             3900,  600,  'delivered', 38),
      ('مريم ص.',        '0772345678', 'Blida',       'Boufarik',      '14 شارع الاستقلال',        2700,  650,  'delivered', 35),
      ('أمينة ك.',       '0553456789', 'Setif',       'El Eulma',      '9 حي 5 جويلية',            4200,  800,  'delivered', 32),
      ('سارة ب.',        '0663456789', 'Alger',       'El Biar',       '2 شارع ديدوش مراد',        8900,  600,  'delivered', 29),
      ('وليد ن.',        '0773456789', 'Annaba',      'El Bouni',      '18 شارع الثورة',           4500,  850,  'delivered', 26),
      ('إلياس د.',       '0554567890', 'Tizi Ouzou',  'Azazga',        '6 حي المجاهدين',           5500,  750,  'shipped',   12),
      ('بلال هـ.',       '0664567890', 'Bejaia',      'Akbou',         '40 شارع 1 نوفمبر',         6900,  800,  'shipped',   10),
      ('فاطمة الزهراء',  '0774567890', 'Alger',       'Cheraga',       '11 حي الرياض',            12800,  600,  'confirmed',  7),
      ('نور الهدى',      '0555678901', 'Constantine', 'Didouche Mourad','3 شارع زيغود يوسف',      14500,  800,  'confirmed',  5),
      ('سمير ق.',        '0665678901', 'Oran',        'Es Senia',      '27 حي الوئام',             6200,  800,  'pending',    3),
      ('طارق ج.',        '0775678901', 'Batna',       'Barika',        '8 شارع أول نوفمبر',        5200,  850,  'pending',    2),
      ('نبيل ع.',        '0556789012', 'Ouargla',     'Hassi Messaoud','15 حي العمال',             3200, 1100,  'refused',    9),
      ('سفيان م.',       '0666789012', 'Adrar',       'Reggane',       '4 حي النصر',               2900, 1400,  'refused',    6),
      ('عبد الرحمان ف.', '0776789012', 'Alger',       'Bir Mourad Raïs','21 شارع الحرية',          7200,  600,  'delivered', 20)
    ) as o(name, phone, wilaya, commune, address, subtotal, fee, status, days)
    returning id, customer_name
  )
  insert into public.order_items (order_id, variant_id, quantity)
  select c.id, pv.id, i.qty
  from (values
    ('أمين ب.',        'chemise-slim-blanche', 'M',  1),
    ('أمين ب.',        'pantalon-chino',       '40', 1),
    ('ياسمين ح.',      'chemise-oxford',       'M',  1),
    ('كريم ز.',        'robe-soiree',          'M',  1),
    ('هدى ل.',         'pantalon-chino',       '40', 1),
    ('رضا ب.',         'pantalon-jean-slim',   '40', 1),
    ('مريم ص.',        'pantalon-jogger',      'M',  1),
    ('أمينة ك.',       'robe-ete-fleurie',     'M',  1),
    ('سارة ب.',        'robe-soiree',          'L',  1),
    ('وليد ن.',        'hoodie-basique',       'M',  1),
    ('إلياس د.',       'basket-blanche',       '41', 1),
    ('بلال هـ.',       'survetement-complet',  'M',  1),
    ('فاطمة الزهراء',  'caftan-brode',         'M',  1),
    ('نور الهدى',      'karakou-moderne',      'M',  1),
    ('سمير ق.',        'pack-ete',             'M',  1),
    ('طارق ج.',        'hoodie-zippe',         'M',  1),
    ('نبيل ع.',        'chemise-lin-ete',      'M',  1),
    ('سفيان م.',       'chemise-slim-blanche', 'S',  1),
    ('عبد الرحمان ف.', 'mocassin-cuir',        '42', 1)
  ) as i(name, slug, size, qty)
  join created c on c.customer_name = i.name
  join public.products p on p.slug = i.slug
  join public.product_variants pv on pv.product_id = p.id and pv.size = i.size;

  -- Statuses are set AFTER the insert, and that is not a workaround.
  -- `validate_order()` forces `new.status := 'pending'` on every insert, because an
  -- order cannot be born delivered, and it is the guard that stops a crafted
  -- request claiming a delivered order. So the demo statuses are applied by
  -- UPDATE, which is the same path the confirmation screen takes. Seeding them
  -- inline silently produced 18 pending orders and an empty-looking dashboard,
  -- which is how this was found.
  update public.orders o
  set status = v.status::public.order_status
  from (values
    ('أمين ب.','delivered'),('ياسمين ح.','delivered'),('كريم ز.','delivered'),
    ('هدى ل.','delivered'),('رضا ب.','delivered'),('مريم ص.','delivered'),
    ('أمينة ك.','delivered'),('سارة ب.','delivered'),('وليد ن.','delivered'),
    ('عبد الرحمان ف.','delivered'),
    ('إلياس د.','shipped'),('بلال هـ.','shipped'),
    ('فاطمة الزهراء','confirmed'),('نور الهدى','confirmed'),
    ('سمير ق.','pending'),('طارق ج.','pending'),
    ('نبيل ع.','refused'),('سفيان م.','refused')
  ) as v(name, status)
  where o.customer_name = v.name;

  raise notice 'Demo seed applied.';
end $$;