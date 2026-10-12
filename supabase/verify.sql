-- Verification queries for supabase/schema.sql
-- Every one of these must return the expected result. Run after applying.

\echo '=== 1. Tables (expect 9) ==='
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'store_settings','admin_users','products','product_variants',
    'variant_images','pack_items','orders','order_items','reviews'
  )
order by table_name;

\echo '=== 2. RLS enabled on every table (expect 9 rows, all true) ==='
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'store_settings','admin_users','products','product_variants',
    'variant_images','pack_items','orders','order_items','reviews'
  )
order by relname;

\echo '=== 3. anon must have NO insert on orders (expect 0) ==='
select count(*) as anon_order_insert_grants
from information_schema.role_table_grants
where grantee = 'anon'
  and table_name = 'orders'
  and privilege_type = 'INSERT';

\echo '=== 4. anon must have NO select on orders (expect 0) ==='
select count(*) as anon_order_select_grants
from information_schema.role_table_grants
where grantee = 'anon'
  and table_name = 'orders'
  and privilege_type = 'SELECT';

\echo '=== 5. authenticated must NOT be able to update order money (expect 0) ==='
select count(*) as dangerous_column_grants
from information_schema.column_privileges
where grantee = 'authenticated'
  and table_name = 'orders'
  and privilege_type = 'UPDATE'
  and column_name in ('subtotal','delivery_fee','total');

\echo '=== 6. Seed data present ==='
select
  (select count(*) from public.products)                    as products,
  (select count(*) from public.product_variants)            as variants,
  (select count(*) from public.pack_items)                  as pack_items,
  (select count(*) from public.reviews where is_approved)   as approved_reviews,
  (select count(*) from public.store_settings)              as settings_rows;

\echo '=== 7. Arabic seed text survived byte-exact (expect the shop name) ==='
select name, delivery_fee_flat, delivery_wilayas[1] as first_wilaya
from public.store_settings where id = 1;

\echo '=== 8. Singleton constraint holds (expect ERROR below) ==='
insert into public.store_settings (id, name) values (2, 'second shop');

\echo '=== 9. Price is taken from the catalogue, not the caller ==='
select public.place_order(
  '{"customer_name":"اختبار","phone":"0555123456","wilaya":"الجزائر","address":"10 rue test"}',
  '[{"variant_id":"aaaaaaaa-2222-4111-8222-222222222222","quantity":3}]'
) as token \gset

\echo '=== 10. Totals were computed server-side: 2500 x 3 + 600 fee = 8100 ==='
select o.subtotal, o.delivery_fee, o.total, o.status,
       oi.product_name, oi.variant_label, oi.quantity, oi.unit_price
from public.orders o
join public.order_items oi on oi.order_id = o.id
where o.public_token = :'token';

\echo '=== 11. track_order returns the order without exposing internal ids ==='
select jsonb_object_keys(public.track_order(:'token'::uuid)) as key
order by key;

\echo '=== 12. track_order on a random token returns null (expect empty) ==='
select public.track_order(gen_random_uuid()) is null as unknown_token_is_null;

\echo '=== 13. A bad order is rejected (expect ERROR below) ==='
select public.place_order(
  '{"customer_name":"x","phone":"nope","wilaya":"","address":""}',
  '[]'
);

\echo '=== 14. Selling an inactive variant is refused (expect ERROR below) ==='
update public.product_variants set is_active = false
where id = 'aaaaaaaa-1111-4111-8111-111111111111';

select public.place_order(
  '{"customer_name":"اختبار","phone":"0555123456","wilaya":"الجزائر","address":"10 rue test"}',
  '[{"variant_id":"aaaaaaaa-1111-4111-8111-111111111111","quantity":1}]'
);

\echo '=== 15. Reviews cannot self-approve (expect ERROR on the insert below) ==='
insert into public.reviews (product_id, customer_name, rating, comment, is_approved)
values ('11111111-1111-4111-8111-111111111111', 'اختبار', 5, 'تحSelfApproved', true);

select customer_name, is_approved from public.reviews
where customer_name = 'اختبار';

\echo '=== 16. Every policy that is not SELECT must have a WITH CHECK ==='
select
  tablename, policyname, cmd,
  (qual is not null)   as has_using,
  (with_check is not null) as has_with_check
from pg_policies
where schemaname = 'public'
  and cmd in ('INSERT','UPDATE','ALL')
order by tablename, policyname;

\echo '=== 17. Storage bucket ==='
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'product-media';