-- =============================================================================
-- OpenStore DZ — complete database schema
-- =============================================================================
--
-- THIS IS THE ONLY DATABASE FILE. There are no migrations.
--
-- A shop owner installs OpenStore by pasting this file once, or by running:
--     npx supabase db reset --local
--
-- Every object below is created idempotently, so re-running this file against an
-- existing database is safe. Seed data uses ON CONFLICT so it never duplicates.
--
-- Design rules this file must not break:
--
--   1. Every table has RLS AND a base GRANT. PostgREST evaluates grants BEFORE
--      policies and returns 401 if the role lacks the table privilege, which
--      looks exactly like a broken policy and is not one.
--
--   2. Every policy has WITH CHECK, not just USING. USING decides which existing
--      rows you may touch; without WITH CHECK a caller could UPDATE a row's
--      owner_id and hand it to someone else.
--
--   3. Policy function calls are wrapped in (select ...) so Postgres evaluates
--      them once per statement instead of once per candidate row.
--
--   4. Prices are never trusted from the browser. Order totals are recomputed
--      from the catalogue by trigger.
--
--   5. Money is INTEGER dinar. Never floating point.
--
-- =============================================================================

-- =============================================================================
-- 1. Types
-- =============================================================================

do $$ begin
  create type public.admin_role as enum ('owner', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_kind as enum ('single', 'pack');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending',    -- placed, not yet confirmed by phone
    'confirmed',  -- customer confirmed by phone
    'refused',    -- customer refused the parcel
    'shipped',    -- handed to the courier
    'delivered',
    'cancelled',
    'returned'
  );
exception when duplicate_object then null; end $$;


-- =============================================================================
-- 2. Tables
-- =============================================================================

-- Store profile. Singleton: the CHECK on id makes a second row impossible.
create table if not exists public.store_settings (
  id                  smallint primary key default 1 check (id = 1),

  name                text not null default 'My Shop',
  tagline             text,
  description         text,
  logo_url            text,
  banner_url          text,

  -- Contact and legal disclosures. Law 18-05 (10 May 2018) Article 11 requires
  -- these to be published by any Algerian e-commerce activity.
  legal_name          text,
  nif                 text,
  rc_number           text,
  phone               text,
  whatsapp            text,
  email               text,
  address             text,

  -- Commerce rules the storefront needs to render honestly.
  currency            text not null default 'DZD',
  delivery_fee_flat   int  not null default 600 check (delivery_fee_flat >= 0),
  delivery_wilayas    text[] not null default '{}',
  delivery_eta_days   int  not null default 3 check (delivery_eta_days >= 1),
  returns_days        int  not null default 14 check (returns_days >= 0),
  accepts_cod         boolean not null default true,

  -- Guepex origin. The carrier matches wilaya by exact name string, so this
  -- must match the carrier's spelling character for character.
  guepex_from_wilaya  text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Admin accounts. Roles live here, never on the user object itself.
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        public.admin_role not null default 'staff',
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  name_fr       text,
  description   text,
  description_fr text,
  kind          public.product_kind not null default 'single',
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  category      text,
  -- Published products are world-readable; everything else is admin-only.
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  size          text,
  color_name    text,
  color_hex     text,
  sku           text,
  -- Dinar. A variant may cost more or less than its product's base price.
  price         int not null check (price >= 0),
  stock         int not null default 0 check (stock >= 0),
  -- Physical measurements drive the Guepex volumetric-weight fee.
  weight_grams  int check (weight_grams is null or weight_grams > 0),
  length_cm     numeric(8,2) check (length_cm is null or length_cm > 0),
  width_cm      numeric(8,2) check (width_cm  is null or width_cm  > 0),
  height_cm     numeric(8,2) check (height_cm is null or height_cm > 0),
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.variant_images (
  id          uuid primary key default gen_random_uuid(),
  variant_id  uuid not null references public.product_variants(id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- What is inside a pack. Only used when products.kind = 'pack'.
create table if not exists public.pack_items (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products(id) on delete cascade,
  variant_id    uuid not null references public.product_variants(id) on delete cascade,
  quantity      int not null default 1 check (quantity > 0),
  sort_order    int not null default 0,
  unique (product_id, variant_id)
);

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  -- Unguessable token for the public tracking link. Never expose the id.
  public_token   uuid not null unique default gen_random_uuid(),

  customer_name  text not null,
  phone          text not null,
  wilaya         text not null,
  commune        text,
  address        text not null,
  note           text,

  -- Recomputed by trigger from the catalogue. Any value supplied by the
  -- browser is ignored.
  subtotal       int not null default 0 check (subtotal >= 0),
  delivery_fee   int not null default 0 check (delivery_fee >= 0),
  total          int not null default 0 check (total >= 0),

  status         public.order_status not null default 'pending',

  -- Confirmation workflow. A phone call before dispatch is what cuts COD
  -- refusals, and refusal is what destroys margin on cash-on-delivery.
  confirmed_at   timestamptz,
  confirmed_by   text,
  refused_at     timestamptz,
  refused_reason text,

  -- Delivery, populated in the delivery sprint.
  carrier          text,
  tracking_number  text,
  tracking_url     text,
  shipped_at       timestamptz,
  delivered_at     timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Snapshots what was bought, at the price it was bought for. Product names and
-- prices must survive later catalogue edits, so they are copied, not joined.
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  variant_id     uuid references public.product_variants(id) on delete set null,
  product_name   text not null,
  variant_label  text,
  quantity       int not null check (quantity > 0),
  unit_price     int not null check (unit_price >= 0),
  created_at     timestamptz not null default now()
);

create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid references public.products(id) on delete set null,
  customer_name  text not null,
  rating         int not null check (rating between 1 and 5),
  comment        text not null,
  image_url      text,
  is_approved    boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Size guides. `product_id` null means a store-wide guide that every product can
-- show; a non-null value scopes it to one product. Clothes returns drop sharply
-- when a buyer can measure, which is the whole reason this table exists.
create table if not exists public.size_guides (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete cascade,
  name        text not null,
  -- Column headings, e.g. {المقاس, الصدر, الطول}
  headers     text[] not null default '{}',
  -- Array of string arrays, one per row, aligned to headers. jsonb rather than
  -- a child table because a guide is always read and written whole.
  rows        jsonb not null default '[]'::jsonb,
  note        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Per-wilaya delivery pricing. The flat fee in store_settings is the fallback;
-- a row here overrides it for that wilaya. Keeps a store usable before Guepex
-- is connected and after, when the carrier's own rate is authoritative.
create table if not exists public.delivery_zones (
  wilaya      text primary key,
  fee         int not null default 0 check (fee >= 0),
  eta_days    int not null default 3 check (eta_days >= 1),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- =============================================================================
-- 3. Indexes
--
-- Only on columns a known query actually filters or sorts by. An index speeds
-- reads and slows every write on that table.
-- =============================================================================

create index if not exists products_status_idx      on public.products (status);
create index if not exists products_kind_idx        on public.products (kind);
create index if not exists variants_product_idx     on public.product_variants (product_id);
create index if not exists variants_active_idx      on public.product_variants (product_id) where is_active;
create index if not exists variant_images_variant_idx on public.variant_images (variant_id);
create index if not exists pack_items_product_idx   on public.pack_items (product_id);
-- The admin order list sorts by newest first.
create index if not exists orders_created_at_idx     on public.orders (created_at desc);
create index if not exists orders_status_idx        on public.orders (status);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists reviews_product_idx      on public.reviews (product_id);
create index if not exists reviews_approved_idx     on public.reviews (created_at desc) where is_approved;
-- Covering indexes for the two foreign keys that Supabase's performance advisor
-- flagged. Without them, deleting a variant scans both tables, and the cascade
-- from products -> variants -> these rows gets slower as the catalogue grows.
create index if not exists order_items_variant_idx  on public.order_items (variant_id);
create index if not exists pack_items_variant_idx   on public.pack_items (variant_id);
create index if not exists size_guides_product_idx  on public.size_guides (product_id);


-- =============================================================================
-- 4. Functions
-- =============================================================================

-- Is this user an admin, and of what role?
--
-- SECURITY DEFINER so the policy can read admin_users without recursing into
-- admin_users' own policy. search_path is pinned and every reference is
-- schema-qualified, so a caller cannot point an unqualified name at their own
-- object and run it with this function owner's privileges.
create or replace function public.has_admin_role(_user_id uuid, _roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = _user_id and role = any(_roles)
  );
$$;

revoke all on function public.has_admin_role(uuid, public.admin_role[]) from public;
grant execute on function public.has_admin_role(uuid, public.admin_role[]) to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Recompute an order's money from the stored lines.
--
-- Runs AFTER the line is written. This is the safety net that keeps totals
-- correct when an admin adds or removes a line from the dashboard. The unit
-- price itself is fixed earlier, by validate_order_item, which runs BEFORE.
create or replace function public.recalculate_order_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_subtotal int;
  v_fee      int;
begin
  -- Branch on tg_op instead of writing coalesce(new.x, old.x). In an INSERT
  -- trigger `old` is unassigned and in a DELETE trigger `new` is unassigned, so
  -- touching the wrong one raises "record old is not assigned yet" at runtime,
  -- not at create time. It compiles cleanly and then fails on the first row.
  if tg_op = 'DELETE' then
    v_order_id := old.order_id;
  else
    v_order_id := new.order_id;
  end if;

  select coalesce(sum(oi.quantity * oi.unit_price), 0)
    into v_subtotal
  from public.order_items oi
  where oi.order_id = v_order_id;

  select coalesce((select delivery_fee_flat from public.store_settings where id = 1), 0)
    into v_fee;

  update public.orders
     set subtotal     = v_subtotal,
         delivery_fee = v_fee,
         total        = v_subtotal + v_fee
   where id = v_order_id;

  -- Same reason: coalesce() cannot identify a composite record type.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Field validation. The browser validates for the user's benefit; this is the
-- actual control, because a hand-crafted request never passes through React.
create or replace function public.validate_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if length(trim(coalesce(new.customer_name, ''))) < 2 or length(new.customer_name) > 120 then
    raise exception 'Invalid customer_name';
  end if;
  if new.phone !~ '^[0-9+\s\-]{8,20}$' then
    raise exception 'Invalid phone';
  end if;
  if length(trim(coalesce(new.wilaya, ''))) < 2 or length(new.wilaya) > 80 then
    raise exception 'Invalid wilaya';
  end if;
  if length(trim(coalesce(new.address, ''))) < 5 or length(new.address) > 500 then
    raise exception 'Invalid address';
  end if;
  if new.note is not null and length(new.note) > 1000 then
    raise exception 'Note too long';
  end if;

  -- An order always opens as pending. Callers cannot supply a different
  -- status, so nobody can open an order that is already marked delivered.
  new.status := 'pending';

  return new;
end;
$$;

create or replace function public.validate_order_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity is null or new.quantity < 1 or new.quantity > 100 then
    raise exception 'Invalid quantity';
  end if;

  -- The browser sends only a variant_id and a quantity. Price and names are
  -- read from the catalogue here, so a hand-crafted request cannot buy a
  -- 45000 DZD variant for 1 DZD.
  select pv.price,
         nullif(concat_ws(' / ', nullif(pv.size, ''), nullif(pv.color_name, '')), ''),
         p.name
    into new.unit_price, new.variant_label, new.product_name
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = new.variant_id;

  if not found then
    raise exception 'Variant does not exist';
  end if;

  if not exists (
    select 1 from public.product_variants
    where id = new.variant_id and is_active
  ) then
    raise exception 'Variant unavailable';
  end if;

  return new;
end;
$$;

create or replace function public.validate_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if length(trim(coalesce(new.customer_name, ''))) < 2 or length(new.customer_name) > 120 then
    raise exception 'Invalid customer_name';
  end if;
  if length(trim(coalesce(new.comment, ''))) < 3 or length(new.comment) > 2000 then
    raise exception 'Invalid comment';
  end if;
  -- Nobody self-approves, not even a signed-in admin pasting their own row in.
  new.is_approved := false;
  return new;
end;
$$;

-- Place an order and return its tracking token.
--
-- One transaction, one round trip. The alternative -- insert the order, then
-- insert its lines, then read it back -- leaves half-written orders behind
-- whenever the connection drops between calls, and those orphan rows still
-- occupy a stock order number and a confirmation slot in the phone queue.
--
-- The caller sends names, phone and a list of variant ids. It never sends a
-- price: validate_order_item reads unit_price from the catalogue.
create or replace function public.place_order(
  p_customer jsonb,
  p_items    jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_token    uuid;
  v_item     jsonb;
  v_inserted int := 0;
begin
  if p_customer is null or p_items is null then
    raise exception 'Missing order details';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Items must be a list';
  end if;

  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'Order must contain between 1 and 50 items';
  end if;

  -- validate_order() still runs as the BEFORE INSERT trigger and does the field
  -- checks. This function only decides the rows.
  insert into public.orders (customer_name, phone, wilaya, commune, address, note)
  values (
    coalesce(p_customer->>'customer_name', ''),
    coalesce(p_customer->>'phone', ''),
    coalesce(p_customer->>'wilaya', ''),
    nullif(p_customer->>'commune', ''),
    coalesce(p_customer->>'address', ''),
    nullif(p_customer->>'note', '')
  )
  returning id, public_token into v_order_id, v_token;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (order_id, variant_id, quantity)
    values (
      v_order_id,
      (v_item->>'variant_id')::uuid,
      coalesce((v_item->>'quantity')::int, 1)
    );
    v_inserted := v_inserted + 1;
  end loop;

  if v_inserted = 0 then
    raise exception 'Order has no items';
  end if;

  -- Recompute now rather than relying on the row trigger, so the token is
  -- returned only once the order is fully priced.
  perform public.recalculate_for_order(v_order_id);

  return v_token;
end;
$$;

-- Recompute one order's totals. Split out of the trigger so place_order() can
-- force a synchronous recalculation instead of relying on AFTER-trigger order.
create or replace function public.recalculate_for_order(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders o
     set subtotal     = coalesce(s.sub, 0),
         delivery_fee = coalesce((select delivery_fee_flat from public.store_settings where id = 1), 0),
         total        = coalesce(s.sub, 0)
                    + coalesce((select delivery_fee_flat from public.store_settings where id = 1), 0)
    from (select sum(quantity * unit_price) as sub
            from public.order_items where order_id = p_order_id) s
   where o.id = p_order_id;
$$;

-- Read one order by its tracking token.
--
-- This is the only way an anonymous visitor learns anything about an order, and
-- it returns address and phone because the buyer typed them and the courier
-- needs them. It must not return the customer note beyond what tracking needs,
-- and it must never return internal ids that could be enumerated.
create or replace function public.track_order(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_token is null then
    return null;
  end if;

  select * into v_order
  from public.orders
  where public_token = p_token;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'token',        v_order.public_token,
    'customer_name', v_order.customer_name,
    'phone',        v_order.phone,
    'wilaya',       v_order.wilaya,
    'commune',      v_order.commune,
    'address',      v_order.address,
    'subtotal',     v_order.subtotal,
    'delivery_fee', v_order.delivery_fee,
    'total',        v_order.total,
    'status',       v_order.status,
    'carrier',      v_order.carrier,
    'tracking_number', v_order.tracking_number,
    'tracking_url', v_order.tracking_url,
    'created_at',   v_order.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name',  oi.product_name,
        'variant_label', oi.variant_label,
        'quantity',      oi.quantity,
        'unit_price',    oi.unit_price
      ))
      from public.order_items oi
      where oi.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
revoke all on function public.track_order(uuid) from public;
grant execute on function public.track_order(uuid) to anon, authenticated;
-- place_order() calls recalculate_for_order internally as the owner, and the
-- AFTER trigger on order_items already keeps totals right when the dashboard
-- edits a line. No client needs to call it over RPC.
revoke all on function public.recalculate_for_order(uuid) from public, anon, authenticated;

-- Trigger functions are invoked by the trigger machinery, which does not check
-- EXECUTE privileges, so revoking costs nothing and removes them from the
-- exposed RPC surface. Supabase's advisor flags any SECURITY DEFINER function
-- reachable without signing in; five of these were reachable purely by accident.
revoke all on function public.touch_updated_at()         from public, anon, authenticated;
revoke all on function public.validate_order()           from public, anon, authenticated;
revoke all on function public.validate_order_item()      from public, anon, authenticated;
revoke all on function public.validate_review()          from public, anon, authenticated;
revoke all on function public.recalculate_order_totals() from public, anon, authenticated;


-- =============================================================================
-- 5. Triggers
-- =============================================================================

drop trigger if exists touch_store_settings on public.store_settings;
create trigger touch_store_settings before update on public.store_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_products on public.products;
create trigger touch_products before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_variants on public.product_variants;
create trigger touch_variants before update on public.product_variants
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_orders on public.orders;
create trigger touch_orders before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists validate_order_trigger on public.orders;
create trigger validate_order_trigger before insert on public.orders
  for each row execute function public.validate_order();

drop trigger if exists validate_order_item_trigger on public.order_items;
create trigger validate_order_item_trigger before insert on public.order_items
  for each row execute function public.validate_order_item();

-- After, not before: the totals can only be right once the item row exists.
drop trigger if exists recalculate_order_totals_trigger on public.order_items;
create trigger recalculate_order_totals_trigger
  after insert or update or delete on public.order_items
  for each row execute function public.recalculate_order_totals();

drop trigger if exists validate_review_trigger on public.reviews;
create trigger validate_review_trigger before insert on public.reviews
  for each row execute function public.validate_review();

drop trigger if exists touch_size_guides on public.size_guides;
create trigger touch_size_guides before update on public.size_guides
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_delivery_zones on public.delivery_zones;
create trigger touch_delivery_zones before update on public.delivery_zones
  for each row execute function public.touch_updated_at();


-- =============================================================================
-- 6. Row Level Security
--
-- Policy audience is deliberately two disjoint groups: the public storefront,
-- and the shop owner. There is no tenant, because there is only one shop.
-- =============================================================================

alter table public.store_settings    enable row level security;
alter table public.admin_users       enable row level security;
alter table public.products          enable row level security;
alter table public.product_variants  enable row level security;
alter table public.variant_images    enable row level security;
alter table public.pack_items        enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.reviews           enable row level security;

-- Supabase grants anon and authenticated broad privileges on new tables in the
-- public schema. Policies do NOT remove grants. Revoke first, then re-grant
-- exactly what each role needs, or the policies below are decorative.
revoke all on all tables in schema public from anon, authenticated;

-- --- store_settings: public read (name, fees, policies are all public), admin write
drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings"
  on public.store_settings for select to anon, authenticated
  using (true);

drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings"
  on public.store_settings for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner']::public.admin_role[])) is true);

-- --- admin_users: a user may read only their own row.
-- There is deliberately no INSERT/UPDATE/DELETE policy. Staff accounts are
-- created in the SQL editor by the owner. Allowing a self-service policy would
-- mean every admin could promote themselves to owner.
drop policy if exists "Users read their own role" on public.admin_users;
create policy "Users read their own role"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);

-- --- products: published are public, drafts are admin-only
drop policy if exists "Public reads published products" on public.products;
create policy "Public reads published products"
  on public.products for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

-- --- product_variants: readable only when the parent product is published
drop policy if exists "Public reads published variants" on public.product_variants;
create policy "Public reads published variants"
  on public.product_variants for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  ));

drop policy if exists "Admins manage variants" on public.product_variants;
create policy "Admins manage variants"
  on public.product_variants for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

-- --- variant_images
drop policy if exists "Public reads published images" on public.variant_images;
create policy "Public reads published images"
  on public.variant_images for select to anon, authenticated
  using (exists (
    select 1
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = variant_id and p.status = 'published'
  ));

drop policy if exists "Admins manage images" on public.variant_images;
create policy "Admins manage images"
  on public.variant_images for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

-- --- pack_items
drop policy if exists "Public reads published pack items" on public.pack_items;
create policy "Public reads published pack items"
  on public.pack_items for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.status = 'published'
  ));

drop policy if exists "Admins manage pack items" on public.pack_items;
create policy "Admins manage pack items"
  on public.pack_items for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

-- --- orders: anon has NO insert policy and NO select policy.
--
-- Orders are only ever written by place_order(), a SECURITY DEFINER function
-- owned by postgres, which bypasses RLS and performs the order insert and its
-- line inserts in one transaction. An anon INSERT policy would let a caller
-- write an order with no lines, or attach lines to any order whose id they
-- guessed, which is exactly what the RPC exists to prevent.
drop policy if exists "Anyone can place an order" on public.orders;

drop policy if exists "Buyers track their own order by token" on public.orders;
-- No public SELECT policy on orders. Tracking goes through track_order(), which
-- takes the token as an argument. Letting anon read orders by a session-scoped
-- GUC instead would make "can this caller see this order" depend on a request
-- header rather than on the value itself.

drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

-- --- order_items: anon has NO insert policy and NO select policy, for the same
-- reason as orders. place_order() writes the lines, track_order() reads them.
drop policy if exists "Buyers add lines to their own order" on public.order_items;

drop policy if exists "Buyers read lines of a tracked order" on public.order_items;
-- No public SELECT policy on order_items either. track_order() returns the
-- lines together with the order.

drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage order items"
  on public.order_items for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

-- --- reviews: public reads approved, anyone submits unapproved, admins moderate
drop policy if exists "Public reads approved reviews" on public.reviews;
create policy "Public reads approved reviews"
  on public.reviews for select to anon, authenticated
  using (is_approved);

drop policy if exists "Anyone submits a review" on public.reviews;
create policy "Anyone submits a review"
  on public.reviews for insert to anon, authenticated
  with check (is_approved = false);

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews"
  on public.reviews for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);


-- =============================================================================
-- 7. Grants
--
-- PostgREST checks these BEFORE RLS. A missing grant here returns 401 even
-- though the policy above is perfect.
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- The storefront sees only published catalogue rows. Orders, order_items and
-- admin_users are deliberately absent: they are reached through
-- place_order(), track_order() and the authenticated role instead.
grant select on public.store_settings   to anon, authenticated;
grant select on public.products         to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.variant_images   to anon, authenticated;
grant select on public.pack_items       to anon, authenticated;
grant select on public.reviews          to anon, authenticated;

-- Buyers do not get table-level INSERT on orders or order_items. place_order()
-- is their only route in and it is granted as a function, not as a table
-- privilege. Reviews stay directly insertable because a review is a single
-- self-contained row with nothing to couple it to.
grant insert on public.reviews to anon, authenticated;

-- The shop owner runs the dashboard from the same browser client.
-- Orders are listed separately below rather than included here.
grant select, insert, update, delete on
  public.products, public.product_variants, public.variant_images,
  public.pack_items, public.order_items, public.reviews,
  public.store_settings
  to authenticated;

grant select on public.admin_users to authenticated;

-- Orders: column-level UPDATE only, and deliberately excluding the money.
--
-- These two lines have to be written this way. A table-level
-- `grant update on public.orders` followed by `revoke update (total)` does NOT
-- work: the table-level grant still covers every column, so the revoke is a
-- no-op and the dashboard can type its own totals. Column privileges are a
-- separate grant set from table privileges, so the table-level UPDATE must
-- simply never be issued.
grant select, insert, delete on public.orders to authenticated;

grant update (id, public_token, customer_name, phone, wilaya, commune, address,
              note, status, confirmed_at, confirmed_by, refused_at, refused_reason,
              carrier, tracking_number, tracking_url, shipped_at, delivered_at)
  on public.orders to authenticated;

-- Keep future tables consistent with the pattern above.
alter default privileges in schema public grant select on tables to anon, authenticated;


-- =============================================================================
-- 8. Storage
--
-- One public bucket for product and review imagery. Public read is the point:
-- an <img src> must resolve without a session. Listing stays closed, writing is
-- admin-only.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media', 'product-media', true, 8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads product media" on storage.objects;
create policy "Public reads product media"
  on storage.objects for select
  using (bucket_id = 'product-media');

drop policy if exists "Admins upload product media" on storage.objects;
create policy "Admins upload product media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-media'
    and public.has_admin_role(auth.uid(), array['owner','staff']::public.admin_role[]) is true
  );

drop policy if exists "Admins update product media" on storage.objects;
create policy "Admins update product media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-media'
    and public.has_admin_role(auth.uid(), array['owner','staff']::public.admin_role[]) is true
  )
  with check (
    bucket_id = 'product-media'
    and public.has_admin_role(auth.uid(), array['owner','staff']::public.admin_role[]) is true
  );

drop policy if exists "Admins delete product media" on storage.objects;
create policy "Admins delete product media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-media'
    and public.has_admin_role(auth.uid(), array['owner','staff']::public.admin_role[]) is true
  );

grant all on storage.objects to authenticated;


-- =============================================================================
-- 9. Seed: a working demo shop
--
-- A fresh install must show a shop, not an empty screen. An empty first screen
-- reads as broken. Every insert is idempotent.
-- =============================================================================

insert into public.store_settings (
  id, name, tagline, description,
  legal_name, nif, rc_number, phone, whatsapp, address,
  delivery_fee_flat, delivery_wilayas, delivery_eta_days, returns_days,
  free_shipping_threshold
) values (
  1,
  'OpenStore DZ',
  'متجرك الإلكتروني — الدفع عند الاستلام',
  'This is the demo shop created by supabase/schema.sql. Edit it in Settings, or delete the demo products and add your own.',
  'Demo SARL', '000000000000000', '00/00-0000000', '+213 555 00 00 00', '+21355500000000',
  'Alger, Algeria',
  600,
  array['الجزائر','وهران','قسنطينة','عنابة','سطيف','تلمسان','بجاية','ورقلة','أدرار','تيميمون'],
  3, 14,
  10000
)
on conflict (id) do nothing;

-- Two products: one single item, one pack. Prices and stock are the numbers the
-- storefront and the seed-verification query in the README expect.
insert into public.products (id, slug, name, name_fr, description, kind, status, category, published_at)
values
  ('11111111-1111-4111-8111-111111111111', 'shirt-demo',  'قميص قطني كلاسيكي',  'Chemise coton classique',  'قميص قطني 100% بقصة مريحة، مناسب للعمل والمناسبات اليومية.', 'single', 'published', 'قمصان', now()),
  ('22222222-2222-4222-8222-222222222222', 'pack-demo',    'باك القميص + البنطال', 'Pack chemise + pantalon', 'باقة موفرة تجمع قميصاً وبنطالاً بسعر أقل من شرائهما منفصلين.', 'pack', 'published', 'other',   now())
on conflict (id) do nothing;

insert into public.product_variants (id, product_id, size, color_name, color_hex, sku, price, stock, weight_grams, sort_order)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'M',  'أبيض',  '#ffffff', 'DEMO-TS-W-M',  2500, 12, 180, 0),
  ('aaaaaaaa-2222-4111-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'L',  'أسود',  '#000000', 'DEMO-TS-B-L',  2500,  8, 180, 1),
  ('bbbbbbbb-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'M',  'أبيض',  '#ffffff', 'DEMO-PK-W-M',  4500,  6, 420, 0),
  ('bbbbbbbb-2222-4111-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'L',  'أسود',  '#000000', 'DEMO-PK-B-L',  4500,  4, 420, 1)
on conflict (id) do nothing;

-- Demo imagery: external placeholders so a fresh install renders a shop that
-- looks like a shop on first load. Replace with uploaded media.
insert into public.variant_images (variant_id, url, alt, sort_order)
values
  ('aaaaaaaa-1111-4111-8111-111111111111', 'https://picsum.photos/seed/openstore-shirt-white/900/900', 'قميص أبيض', 0),
  ('aaaaaaaa-2222-4111-8222-222222222222', 'https://picsum.photos/seed/openstore-shirt-black/900/900', 'قميص أسود', 0),
  ('bbbbbbbb-1111-4111-8111-111111111111', 'https://picsum.photos/seed/openstore-pack-white/900/900', 'باقة بيضاء', 0),
  ('bbbbbbbb-2222-4111-8222-222222222222', 'https://picsum.photos/seed/openstore-pack-black/900/900', 'باقة سوداء', 0)
on conflict do nothing;

insert into public.pack_items (product_id, variant_id, quantity, sort_order)
values
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-1111-4111-8111-111111111111', 1, 0),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-1111-4111-8111-111111111111', 1, 1)
on conflict (product_id, variant_id) do nothing;

insert into public.reviews (id, product_id, customer_name, rating, comment, is_approved)
values
  ('cccccccc-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'سعاد', 5, 'قماش ممتاز والتوصيل كان سريع.', true),
  ('cccccccc-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'كريم', 4, 'الباك مناسب والسعر معقول.', true)
on conflict (id) do nothing;

-- The `true` above is a lie, and deliberately so. validate_review() forces
-- is_approved := false on every INSERT, including this one, because that trigger
-- is the control that stops a customer approving their own review. The demo
-- reviews therefore arrive unapproved and are approved here with an UPDATE,
-- which is exactly the path the moderation screen uses. Do not "fix" this by
-- weakening the trigger.
update public.reviews
   set is_approved = true
 where id in (
   'cccccccc-1111-4111-8111-111111111111',
   'cccccccc-2222-4222-8222-222222222222'
 )
   and is_approved = false;

-- =============================================================================
-- 10. Later additions
--
-- Everything below was applied to the live database as a migration and then
-- written back here. Leaving it out would mean a fresh install from this file
-- produced an older, weaker database than the one in production: no stock
-- decrement (so it would oversell), no way to become an administrator, and no
-- phone validation. Appended in dependency order rather than interleaved above,
-- because every statement here is idempotent and the order within the block is
-- what matters.
-- =============================================================================

-- ── Sale pricing ────────────────────────────────────────────────────────────
alter table public.product_variants
  add column if not exists compare_at_price int
  check (compare_at_price is null or compare_at_price >= 0);

comment on column public.product_variants.compare_at_price is
  'Original price when the variant is on sale, in dinar. Null means no sale.';

-- ── Carrier webhook audit ───────────────────────────────────────────────────
create table if not exists public.guepex_webhook_events (
  id           uuid primary key default gen_random_uuid(),
  event_id     text not null unique,
  type         text not null,
  occurred_at  timestamptz,
  data         jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists guepex_events_created_idx on public.guepex_webhook_events (created_at desc);
create index if not exists guepex_events_type_idx    on public.guepex_webhook_events (type);

alter table public.guepex_webhook_events enable row level security;

drop policy if exists "Admins read carrier events" on public.guepex_webhook_events;
create policy "Admins read carrier events"
  on public.guepex_webhook_events for select to authenticated
  using ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

revoke all on public.guepex_webhook_events from anon, authenticated;
grant select on public.guepex_webhook_events to authenticated;

-- ── Algerian phone validation ───────────────────────────────────────────────
-- The original rule was `^[0-9+\s\-]{8,20}$`, which accepts "12345678". On cash
-- on delivery the phone is the only way to confirm an order.
create or replace function public.normalise_dz_phone(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(coalesce(raw, ''), '[^0-9+]', '', 'g');
$$;

create or replace function public.is_valid_dz_phone(raw text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with cleaned as (select public.normalise_dz_phone(raw) as p)
  select case
    when p ~ '^0[5-7][0-9]{8}$' then true
    when p ~ '^\+?213[5-7][0-9]{8}$' then true
    when p ~ '^0[2-4][0-9]{7,8}$' then true
    when p ~ '^\+?213[2-4][0-9]{7,8}$' then true
    else false
  end
  from cleaned;
$$;

grant execute on function public.is_valid_dz_phone(text) to anon, authenticated;

-- ── Order item: price from the catalogue, stock decremented atomically ──────
create or replace function public.validate_order_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity is null or new.quantity < 1 or new.quantity > 100 then
    raise exception 'Invalid quantity' using errcode = 'check_violation';
  end if;

  select pv.price,
         nullif(concat_ws(' / ', nullif(pv.size, ''), nullif(pv.color_name, '')), ''),
         p.name
    into new.unit_price, new.variant_label, new.product_name
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  where pv.id = new.variant_id;

  if not found then
    raise exception 'Variant does not exist' using errcode = 'check_violation';
  end if;

  -- Atomic conditional decrement. Two simultaneous orders for the last item
  -- cannot both match, which a read-then-write check would allow.
  update public.product_variants
     set stock = stock - new.quantity
   where id = new.variant_id
     and is_active
     and stock >= new.quantity;

  if not found then
    if not exists (select 1 from public.product_variants where id = new.variant_id and is_active) then
      raise exception 'Variant unavailable' using errcode = 'check_violation';
    end if;
    raise exception 'Insufficient stock for %', coalesce(new.variant_label, 'item')
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- ── Order: field checks plus the owner's selling rules ─────────────────────
create or replace function public.validate_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_open boolean;
  v_allowed text[];
begin
  if length(trim(coalesce(new.customer_name, ''))) < 2 or length(new.customer_name) > 120 then
    raise exception 'Invalid customer_name' using errcode = 'check_violation';
  end if;

  if not public.is_valid_dz_phone(new.phone) then
    raise exception 'Invalid Algerian phone number' using errcode = 'check_violation';
  end if;

  if length(trim(coalesce(new.wilaya, ''))) < 2 or length(new.wilaya) > 80 then
    raise exception 'Invalid wilaya' using errcode = 'check_violation';
  end if;
  if length(trim(coalesce(new.address, ''))) < 5 or length(new.address) > 500 then
    raise exception 'Invalid address' using errcode = 'check_violation';
  end if;
  if new.note is not null and length(new.note) > 1000 then
    raise exception 'Note too long' using errcode = 'check_violation';
  end if;

  select accepts_cod, delivery_wilayas into v_open, v_allowed
  from public.store_settings where id = 1;

  if v_open is false then
    raise exception 'The shop is not accepting orders right now' using errcode = 'check_violation';
  end if;

  -- An empty list means everywhere. A populated list is a hard restriction.
  if coalesce(array_length(v_allowed, 1), 0) > 0 and not (new.wilaya = any(v_allowed)) then
    raise exception 'We do not deliver to % yet', new.wilaya using errcode = 'check_violation';
  end if;

  new.status := 'pending';
  return new;
end;
$$;

-- ── Restock when an order ends negatively ──────────────────────────────────
create or replace function public.restock_on_negative_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status in ('refused', 'cancelled', 'returned')
     and old.status not in ('refused', 'cancelled', 'returned') then
    update public.product_variants pv
       set stock = pv.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id
       and oi.variant_id = pv.id;
  end if;

  return new;
end;
$$;

drop trigger if exists restock_on_negative_status_trigger on public.orders;
create trigger restock_on_negative_status_trigger
  after update of status on public.orders
  for each row execute function public.restock_on_negative_status();

revoke all on function public.restock_on_negative_status() from public, anon, authenticated;

-- ── Admin bootstrap ────────────────────────────────────────────────────────
-- `admin_users` deliberately has no INSERT policy, or any signed-in user could
-- promote themselves to owner. That left no legitimate route in at all, so this
-- adds exactly one: the first authenticated user may claim the store, and only
-- while it has no administrator. The advisory lock is what stops two
-- simultaneous claims both reading a count of zero and both inserting.
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users);
$$;

create or replace function public.claim_store()
returns public.admin_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_taken int;
begin
  if v_uid is null then
    raise exception 'Sign in before claiming the store' using errcode = 'insufficient_privilege';
  end if;

  perform pg_advisory_xact_lock(hashtext('openstore_claim_store'));

  select count(*) into v_taken from public.admin_users;
  if v_taken > 0 then
    raise exception 'This store already has an administrator' using errcode = 'check_violation';
  end if;

  insert into public.admin_users (user_id, role) values (v_uid, 'owner');
  return 'owner';
end;
$$;

revoke all on function public.admin_exists() from public;
grant execute on function public.admin_exists() to anon, authenticated;

revoke all on function public.claim_store() from public;
grant execute on function public.claim_store() to authenticated;
