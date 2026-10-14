# The hosted demo

A public demo shop runs at the URL in the repository description. It exists so a
shop owner can look at a populated dashboard before installing anything, and so
contributors can see the product without seeding their own database.

## Signing in

|              |                      |
| ------------ | -------------------- |
| **Email**    | `demo@openstore.dz`  |
| **Password** | `OpenStoreDemo2026!` |
| **Role**     | `staff`              |

These are published on purpose. The account is a demo and holds no real data.

## What the demo account can and cannot do

It is `staff`, not `owner`, and that is the whole point. RLS decides, not the UI.

**Can:** see the dashboard, orders, the call queue, products, variants, reviews,
delivery zones, size guides.

**Cannot:** read or change `store_settings`, or add an `order_export_target`
webhook. Both are owner-only policies, and `has_admin_role(…, array['owner'])`
returns false for this account.

The export restriction matters most. A destination is a URL the shop will POST
orders to, signed with a secret the creator can read. If a stranger could add one,
they could point the shop's orders at their own endpoint. That is why the policy is
owner-only rather than owner-and-staff, and the demo account is why it was worth
being strict about.

## Reseeding

The catalogue comes from `supabase/seed-demo.sql`, which is separate from
`schema.sql` so a real shop owner does not inherit 25 products to delete.

```bash
psql "$DATABASE_URL" -f supabase/seed-demo.sql
```

Re-runnable: a sentinel checks for the first product and returns early if the demo
catalogue is already there.

To reset the demo, delete what it created and run it again:

```sql
delete from public.orders where customer_name in
  ('أمين ب.','ياسمين ح.','كريم ز.','هدى ل.','رضا ب.','مريم ص.','أمينة ك.','سارة ب.','وليد ن.',
   'إلياس د.','بلال هـ.','فاطمة الزهراء','نور الهدى','سمير ق.','طارق ج.','نبيل ع.','سفيان م.','عبد الرحمان ف.');
delete from public.products where slug in
  ('chemise-slim-blanche','chemise-oxford','chemise-lin-ete','chemise-carreaux','pantalon-chino',
   'pantalon-jean-slim','pantalon-jogger','pantalon-classique','robe-ete-fleurie','robe-soiree',
   'robe-casual','hoodie-basique','hoodie-zippe','sweat-col-rond','basket-blanche','mocassin-cuir',
   'sandale-ete','ceinture-cuir','casquette-brodee','echarpe-hiver','sac-bandouliere',
   'survetement-complet','legging-sport','karakou-moderne','caftan-brode',
   'pack-ete','pack-sport','pack-hiver','pack-travail','pack-manasabat');
delete from public.delivery_zones;
delete from public.size_guides where product_id is null;
```

Then run the seed again.

## What the demo deliberately contains

- **25 single products and 5 packs**, across 8 categories, with real size runs and
  colour variants rather than one variant per product.
- **Two variants at zero stock**, so the out-of-stock path and the low-stock list
  have something to show.
- **26 variants with a `compare_at_price`**, so sale rendering is exercised.
- **18 orders across every status**, spread over the last 52 days, so the revenue
  trend and the refusal rate are not four empty widgets.
- **Three size guides store-wide plus one product-specific**, so both the fallback
  and the override path have data.

## Two things worth knowing if you extend it

**Order statuses cannot be seeded inline.** `validate_order()` forces
`new.status := 'pending'` on every insert, because an order cannot be born
delivered and that guard is what stops a crafted request claiming one. Statuses are
applied by a follow-up `UPDATE`, the same path the confirmation screen takes.

**Wilaya spellings must match `src/lib/wilayas.ts` character for character.**
`Setif` and `Bejaia`, not `Sétif` and `Béjaïa`. They are the app's lookup keys and
the carrier's match keys, so an accented spelling silently matches neither and
fails only when a parcel is rejected. The seed originally got this wrong, and the
`delivery_wilayas` check is what caught it.

## Imagery

Placeholder images from `picsum.photos`, seeded per SKU so a product always gets the
same picture. They are not clothing, and they are not meant to be shipped to a real
shop. Replace them with uploaded media before anything goes public.
