# DATABASE

Postgres on Supabase. **The schema is one file: `supabase/schema.sql`.** There are no
migration files by design, so a shop owner can install this by pasting one document.
This is a deliberate, documented departure from the owner's general rule that every
schema change is a versioned migration. See `docs/DECISIONS.md` entry 4.

`supabase/schema.sql` is not written yet. It is Sprint 2. This page documents the rules
it will follow, so the rules are decided before the tables are.

## The three rules that prevent the most common bugs

**1. Every table needs a policy AND a grant.**
Row Level Security is evaluated *after* PostgREST checks whether the requesting role has a
table-level privilege. Without `GRANT SELECT ON public.products TO anon`, a perfectly
correct policy still returns `401 Unauthorized`. This is the single most common cause of
"my RLS policy is not working".

```sql
create policy "Public can read published products"
  on public.products for select to anon, authenticated
  using (status = 'published');

grant select on public.products to anon, authenticated;
```

**2. Every policy needs a `WITH CHECK` clause.**
`USING` governs which existing rows you may touch. Without `WITH CHECK`, you may also set
what the row becomes. A missing `with check` lets a caller `UPDATE ... SET owner_id =
'someone-else'` and hand their row away.

```sql
create policy "Admins manage their own products"
  on public.products for all to authenticated
  using      ((select auth.uid()) = owner_id)   -- existing rows
  with check ((select auth.uid()) = owner_id);  -- resulting rows
```

**3. Wrap policy function calls in `(select ...)`.**
Without the parentheses Postgres evaluates the function once per candidate row. With
them it becomes an `initPlan` evaluated once per statement. On a large table this is the
difference between milliseconds and seconds.

```sql
using ((select auth.uid()) = owner_id)     -- good
using (auth.uid() = owner_id)               -- slow
```

## Planned tables

| Table | Holds | Public read | Admin write |
|---|---|---|---|
| `store_settings` | name, legal disclosures, contact, Guepex origin wilaya | yes | yes |
| `admin_users` | shop owner and staff | no | yes |
| `products` | single items and packs | published only | yes |
| `product_variants` | size, colour, price, stock | yes | yes |
| `variant_images` | gallery per variant | yes | yes |
| `pack_items` | child variants inside a pack | yes | yes |
| `orders` | customer, delivery, status, computed totals | no | yes |
| `reviews` | rating, comment, image | approved only | yes |

Money is stored as `integer` in Algerian dinar. Never floating point: dinar amounts with
two decimal places are not a thing here, and a float will eventually produce a total that
does not match the sum of its parts.

## Prices are computed server-side

A BEFORE INSERT trigger recomputes `subtotal`, `delivery_fee` and `total` from the stored
product rows and ignores whatever the browser sent. A tampered payload must not be able
to change what a buyer is charged.

## Validation lives in triggers, not only in the UI

Browser validation is for the user's benefit. It is not a security control. The same
length, range and format rules are enforced in BEFORE INSERT triggers on `orders` and
`reviews`, so a hand-crafted request hits the same wall.

## Storage

One public bucket, `product-media`, for product and review imagery. Public read is the
point: image URLs must resolve in a `<img>` tag without a session.

- Read: public, by design.
- Write: admin only, enforced by policy on `storage.objects`.
- API-level object listing stays closed. A shop owner should not be able to enumerate
  every file in the bucket.

## Seed data

`supabase/schema.sql` ends with a demo shop: a handful of products, one pack, a few
reviews and a full `store_settings` row. A fresh install must show a working shop, not an
empty one. An empty first screen reads as broken.

Seed data is idempotent (`on conflict do nothing` or `on conflict do update`) so
re-running the file never duplicates rows.

## Algerian legal disclosures

Law 18-05 of 10 May 2018, Article 11, requires a set of disclosures to be published for any
e-commerce activity in Algeria. `store_settings` carries the fields for them:

- NIF (tax identification number)
- RC or artisan register number
- Physical address and phone number
- Price including tax
- Delivery method, cost and delay
- Terms of sale including data protection
- Warranty and after-sales terms
- Accepted payment methods
- Order confirmation method
- Return, exchange and refund conditions

The platform provides the fields. Publishing them correctly, and registering the
business, remains the shop owner's legal obligation. This is not legal advice.

## Verifying a schema change

```bash
npx supabase db reset --local   # applies schema.sql plus seed, from scratch
npx supabase db advisors        # RLS, security and performance review
```

Run `db advisors` after every schema change and fix what it reports before committing.