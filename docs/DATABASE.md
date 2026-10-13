# DATABASE

Postgres on Supabase. **The schema is one file: `supabase/schema.sql`.** There are no
migration files by design, so a shop owner can install this by pasting one document.
This is a deliberate, documented departure from the owner's general rule that every
schema change is a versioned migration. See `docs/DECISIONS.md` entry 4.

`supabase/schema.sql` now exists and is the whole database: 9 tables, RLS and grants on
every one, the order-placement and order-tracking RPCs, storage policies, and a demo shop.
It has **not** been executed against a live database. Run `npx supabase db reset --local`
once before trusting it, and `npx supabase db advisors` after.

## Order placement is a function, not three inserts

The first draft gave `anon` an INSERT policy on `orders` and `order_items` and let the
browser post them separately. That was wrong twice over:

- Three round trips leave half-written orders behind whenever the connection drops, and
  those orphans still consume a confirmation slot in the phone queue.
- An INSERT policy on `order_items` guarded by `exists (select 1 from orders where id =
order_id)` is satisfied by _any_ order whose id the caller can name. Guessing an order
  id is enough to append lines to someone else's order.

So `anon` gets no table privileges on `orders` or `order_items` at all. They are reached
only through two `SECURITY DEFINER` functions:

| Function                                       | Caller                  | Returns                     |
| ---------------------------------------------- | ----------------------- | --------------------------- |
| `place_order(p_customer jsonb, p_items jsonb)` | `anon`, `authenticated` | the tracking token          |
| `track_order(p_token uuid)`                    | `anon`, `authenticated` | order plus lines, or `null` |

`place_order` writes the order and its lines in one transaction and never reads a price
from the caller. `track_order` is the only way anyone learns about an order without a
session, and it returns nothing for a token that does not exist.

## The three rules that prevent the most common bugs

**1. Every table needs a policy AND a grant.**
Row Level Security is evaluated _after_ PostgREST checks whether the requesting role has a
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

**4. To lock one column, never grant the table-level privilege.**

This is the trap that makes rule 4 feel like it works when it does not:

```sql
grant update on public.orders to authenticated;      -- every column
revoke update (total) on public.orders to authenticated;   -- NO-OP
```

Column privileges are a _separate_ grant set. The table-level `UPDATE` still covers
`total`, so the revoke does nothing and the dashboard can type its own order totals. The
only correct shape is to never issue the table-level grant at all and enumerate columns:

```sql
grant select, insert, delete on public.orders to authenticated;
grant update (customer_name, phone, wilaya, commune, address, note, status,
              confirmed_at, carrier, tracking_number, ...)
  on public.orders to authenticated;
-- subtotal, delivery_fee and total are absent on purpose
```

## Tables as built

| Table              | Holds                                                       | Public read    | Admin write |
| ------------------ | ----------------------------------------------------------- | -------------- | ----------- |
| `store_settings`   | name, legal disclosures, contact, Guepex origin wilaya      | yes            | yes         |
| `admin_users`      | shop owner and staff                                        | no             | yes         |
| `products`         | single items and packs                                      | published only | yes         |
| `product_variants` | size, colour, price, stock                                  | yes            | yes         |
| `variant_images`   | gallery per variant                                         | yes            | yes         |
| `pack_items`       | child variants inside a pack                                | yes            | yes         |
| `orders`           | customer, delivery, status, computed totals                 | no             | yes         |
| `order_items`      | snapshot of what was bought, at the price it was bought for | no             | yes         |
| `reviews`          | rating, comment, image                                      | approved only  | yes         |

Money is stored as `integer` in Algerian dinar. Never floating point: dinar amounts with
two decimal places are not a thing here, and a float will eventually produce a total that
does not match the sum of its parts.

## Prices are computed server-side

A tampered payload must not be able to change what a buyer is charged. Two triggers split
the job:

- `validate_order_item` is BEFORE INSERT on `order_items`. It reads `unit_price`, the
  variant label and the product name straight from the catalogue and overwrites whatever
  the caller sent. The caller only ever names a `variant_id` and a `quantity`.
- `recalculate_for_order` sums the stored lines and rewrites `subtotal`, `delivery_fee` and
  `total` on the parent order. It is called from `place_order` and from an AFTER trigger on
  `order_items`, so totals stay right even when an admin edits lines from the dashboard.

`order_items` copies names and prices instead of joining back to the catalogue, so a price
change tomorrow does not rewrite the history of an order placed today.

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

`supabase/verify.sql` goes further. It asserts the 17 properties this schema claims to
have, including the three that are easy to get wrong and hard to notice:

- `anon` holds no INSERT and no SELECT privilege on `orders`
- `authenticated` holds no UPDATE privilege on `subtotal`, `delivery_fee` or `total`
- a caller's price is overwritten by the catalogue price

It also runs five statements that are _supposed_ to fail, so each one prints its error.
Run it after every schema change:

```bash
npx supabase db reset --local
docker exec -i supabase_db_<project>-<slug> psql -U postgres -d postgres -f - < supabase/verify.sql
```

### Current status: authored, not executed

The schema is applied to the OpenStore project and was exercised end to end, not just
applied. What was actually run and observed:

- `place_order` inserted an order and its lines in one transaction; totals came back
  7500 + 600 = 8100 and 9000 + 600 = 9600, both computed from the catalogue
- the caller sent only `variant_id` and `quantity`; `product_name`, `variant_label`
  (`"L / أسود"`) and `unit_price` were filled by `validate_order_item` from the catalogue
- `track_order` returned the order for a valid token, `null` for an unknown token and
  `null` for a null token
- an order with a one-character name was rejected by `validate_order`
- an order against an `is_active = false` variant was rejected with `Variant unavailable`,
  and the transaction rolled back so no orphan order row survived
- `anon` holds zero privileges on `orders`; `authenticated` cannot UPDATE `subtotal`,
  `delivery_fee` or `total`, but can UPDATE `status`, `tracking_number` and `confirmed_at`

Four defects were found and fixed along the way, none of which the compiler could catch:

| Defect                                                      | Why it was invisible                                                                                                                                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create order_items_order_idx` missing the word `index`     | Syntax error, caught by the first run                                                                                                                                         |
| `coalesce(new.order_id, old.order_id)` in a DECLARE default | Compiles; raises `record "old" is not assigned yet` on the first INSERT                                                                                                       |
| `coalesce(new, old)` on composite records                   | Compiles; raises `could not identify a record type`                                                                                                                           |
| seed reviews silently arrived unapproved                    | `validate_review` forces `is_approved := false` on every INSERT, including the seed's; the demo shop shipped with zero visible reviews until the seed approved them by UPDATE |

`supabase/verify.sql` asserts these properties and is the regression net for the next
change. It includes five statements that are expected to fail, so their error output is
part of the result.

### Advisors

Both advisor classes were run against the live project.

**Security** returned only `SECURITY DEFINER` exposure warnings. Four are intentional and
must stay: `place_order` and `track_order` are the anonymous order path, and
`has_admin_role` has to be executable for the RLS policies to call it. The rest were
trigger functions reachable over RPC by accident — `touch_updated_at`, `validate_order`,
`validate_order_item`, `validate_review` and `recalculate_order_totals` — and their
`EXECUTE` is now revoked. Trigger functions are invoked by the trigger machinery, which
does not check privileges, so revoking costs nothing. `recalculate_for_order` was revoked
from clients too: `place_order` calls it internally, and the AFTER trigger already covers
dashboard line edits.

**Performance** returned two real findings and two noise findings. The real ones were
`order_items.variant_id` and `pack_items.variant_id` without covering indexes; both now
have one. The noise: `unused_index` on eight indexes (a fresh database has had no traffic —
these serve storefront and dashboard queries that do not exist yet) and
`multiple_permissive_policies` (Postgres ORs `Admins manage X` with `Public reads X`, which
is correct; at single-shop scale the extra evaluation is not measurable).

Run `db advisors` after every schema change and fix what it reports before committing.
