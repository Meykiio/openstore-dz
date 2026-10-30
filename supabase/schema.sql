-- =============================================================================
-- OpenStore DZ — complete database schema
-- =============================================================================
--
-- THIS IS THE ONLY DATABASE FILE. There are no migrations.
--
-- A shop owner installs OpenStore by pasting this file once, or by running:
--     docker exec -i supabase_db_openstore-dz psql -U postgres -v ON_ERROR_STOP=1 < supabase/schema.sql
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
  -- Latin-script versions for French and English visitors. Optional.
  tagline_fr          text,
  description_fr      text,
  address_fr          text,
  logo_url            text,
  banner_url          text,
  -- The storefront's primary colour, "#rrggbb". Null keeps the default theme.
  brand_color         text check (brand_color ~ '^#[0-9a-fA-F]{6}$'),

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
  -- Delivery is free once the subtotal reaches this. 0 means never free.
  free_shipping_threshold int not null default 0 check (free_shipping_threshold >= 0),

    -- Guepex origin. The carrier matches wilaya by exact name string, so this
    -- must match the carrier's spelling character for character.
    guepex_from_wilaya  text,

    -- What the shop says to buyers before they buy.
    --
    -- The announcement is off by default, so a shop that has never opened the
    -- settings page renders nothing rather than an empty bar.
    announcement            text,
    announcement_enabled    boolean not null default false,
    -- Full URLs, not handles. A handle cannot be turned into a correct link for
    -- every platform, and guessing wrong sends a buyer to a stranger's profile.
    instagram_url           text,
    facebook_url            text,
    tiktok_url              text,
    -- `returns_days` says how long; this says what is covered, which is the part
    -- buyers actually ask about.
    returns_note            text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Admin accounts. Roles live here, never on the user object itself.
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        public.admin_role not null default 'staff',
  created_at  timestamptz not null default now()
);

-- Categories are rows, not free text, so a category page has a canonical slug and
-- a renamed label does not split one category into two.
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  name_fr      text,
  description  text,
  image_url    text,
  sort_order   int not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
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
  category_id   uuid references public.categories(id) on delete set null,
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
  -- Home delivery, or pickup at the carrier's office (stopdesk), which costs the
  -- buyer less. The office is the carrier's own id, never free text.
  delivery_method text not null default 'home' check (delivery_method in ('home', 'stopdesk')),
  stopdesk_id    int,
  stopdesk_name  text,
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
  note_fr     text,
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
  -- Price for pickup at the carrier's office. Null means pickup is not offered here.
  stopdesk_fee int check (stopdesk_fee >= 0),
  eta_days    int not null default 3 check (eta_days >= 1),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- Columns added after the first release. Declared above for a fresh install;
-- added here for an existing one, before section 7's grants name them.
alter table public.store_settings
  add column if not exists tagline_fr text,
  add column if not exists description_fr text,
  add column if not exists address_fr text;
alter table public.size_guides
  add column if not exists note_fr text;
alter table public.store_settings
  add column if not exists brand_color text check (brand_color ~ '^#[0-9a-fA-F]{6}$');
alter table public.delivery_zones
  add column if not exists stopdesk_fee int check (stopdesk_fee >= 0);
-- Who placed the order, as a hash of the caller's IP address (never the address
-- itself), so place_order() can cap how many orders one connection places an hour.
alter table public.orders
  add column if not exists client_key text;
alter table public.orders
  add column if not exists delivery_method text not null default 'home'
    check (delivery_method in ('home', 'stopdesk')),
  add column if not exists stopdesk_id int,
  add column if not exists stopdesk_name text;

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
create index if not exists orders_client_key_idx    on public.orders (client_key, created_at desc);
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
  if new.quantity is null or new.quantity < 1 or new.quantity > 20 then
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
security definer
set search_path = ''
as $$
begin
  -- A script could fill the moderation queue with junk. Twenty waiting reviews an
  -- hour is far above what a small shop receives, and a flood stops there.
  -- Security definer so the count sees unapproved rows, which RLS hides.
  if (
    select count(*) from public.reviews r
    where not r.is_approved and r.created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'Too many reviews right now, please try again later'
      using errcode = 'check_violation', hint = 'too_many_reviews';
  end if;
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
  v_units    int;
  v_headers  json;
  v_ip       text;
  v_client   text;
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

  -- Fake orders drain real stock: every line takes stock away until the owner
  -- refuses it. Fifty pieces is a large retail order; bigger ones go through
  -- WhatsApp or a phone call.
  select coalesce(sum(greatest(coalesce((i->>'quantity')::int, 1), 1)), 0)
    into v_units from jsonb_array_elements(p_items) i;
  if v_units > 50 then
    raise exception 'Too many pieces in one order'
      using errcode = 'check_violation', hint = 'too_many_items';
  end if;

  -- One connection may place ten orders an hour. The per-phone cap alone does
  -- not stop a script inventing numbers. The IP is stored only as a salted hash.
  -- Not the first x-forwarded-for entry: a caller can write that one, and
  -- Cloudflare appends the real address after it (supabase discussion 34647).
  -- cf-connecting-ip is Cloudflare's own; the last forwarded entry is the
  -- fallback. Calls with neither (the SQL editor) are not limited.
  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_ip := coalesce(
    nullif(trim(v_headers->>'cf-connecting-ip'), ''),
    nullif(trim(regexp_replace(coalesce(v_headers->>'x-forwarded-for', ''), '^.*,', '')), '')
  );
  if v_ip is not null then
    v_client := md5('openstore-order:' || v_ip);
    if (
      select count(*) from public.orders o
      where o.client_key = v_client and o.created_at > now() - interval '1 hour'
    ) >= 10 then
      raise exception 'Too many orders from this connection, please try again later'
        using errcode = 'check_violation', hint = 'too_many_orders';
    end if;
  end if;

  -- validate_order() still runs as the BEFORE INSERT trigger and does the field
  -- checks. This function only decides the rows.
  insert into public.orders (customer_name, phone, wilaya, commune, address, note,
                             delivery_method, stopdesk_id, stopdesk_name, client_key)
  values (
    coalesce(p_customer->>'customer_name', ''),
    coalesce(p_customer->>'phone', ''),
    coalesce(p_customer->>'wilaya', ''),
    nullif(p_customer->>'commune', ''),
    coalesce(p_customer->>'address', ''),
    nullif(p_customer->>'note', ''),
    coalesce(nullif(p_customer->>'delivery_method', ''), 'home'),
    nullif(p_customer->>'stopdesk_id', '')::int,
    nullif(p_customer->>'stopdesk_name', ''),
    v_client
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
    'delivery_method', v_order.delivery_method,
    'stopdesk_name', v_order.stopdesk_name,
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

drop trigger if exists touch_categories on public.categories;
create trigger touch_categories before update on public.categories
  for each row execute function public.touch_updated_at();

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
alter table public.categories        enable row level security;
alter table public.size_guides       enable row level security;
alter table public.delivery_zones    enable row level security;

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

-- --- categories, size guides, delivery zones: public read, admin write.
-- All three are what the storefront shows before a buyer commits, so reading
-- them needs no session. Hidden categories and paused zones stay admin-only.
drop policy if exists "Public reads active categories" on public.categories;
create policy "Public reads active categories"
  on public.categories for select to anon, authenticated
  using (is_active);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
  on public.categories for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

drop policy if exists "Public reads size guides" on public.size_guides;
create policy "Public reads size guides"
  on public.size_guides for select to anon, authenticated
  using (true);

drop policy if exists "Admins manage size guides" on public.size_guides;
create policy "Admins manage size guides"
  on public.size_guides for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

drop policy if exists "Public reads active delivery zones" on public.delivery_zones;
create policy "Public reads active delivery zones"
  on public.delivery_zones for select to anon, authenticated
  using (is_active);

drop policy if exists "Admins manage delivery zones" on public.delivery_zones;
create policy "Admins manage delivery zones"
  on public.delivery_zones for all to authenticated
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
grant select on public.categories       to anon, authenticated;
grant select on public.size_guides      to anon, authenticated;
grant select on public.delivery_zones   to anon, authenticated;

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
  public.store_settings, public.categories, public.size_guides,
  public.delivery_zones
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
              carrier, tracking_number, tracking_url, shipped_at, delivered_at,
              stopdesk_id, stopdesk_name)
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
       'Demo SARL', '000000000000000', '00/00-0000000', '+213 555 00 00 00', '+213 555 00 00 00',
  'Alger, Algeria',
  600,
  -- Empty means every wilaya. It was a list of Arabic names, which the checkout
  -- (matching on the carrier's Latin names) filtered down to nothing.
  '{}',
  3, 14,
  10000
)
on conflict (id) do nothing;

-- Two products: one single item, one pack. Prices and stock are the numbers the
-- storefront and the seed-verification query in the README expect.
insert into public.categories (slug, name, name_fr, sort_order)
values
  ('shirts', 'قمصان', 'Chemises', 1),
  ('packs',  'باقات', 'Packs',    2)
on conflict (slug) do nothing;

insert into public.products (id, slug, name, name_fr, description, kind, status, category_id, published_at)
values
  ('11111111-1111-4111-8111-111111111111', 'shirt-demo',  'قميص قطني كلاسيكي',  'Chemise coton classique',  'قميص قطني 100% بقصة مريحة، مناسب للعمل والمناسبات اليومية.', 'single', 'published', (select id from public.categories where slug = 'shirts'), now()),
  ('22222222-2222-4222-8222-222222222222', 'pack-demo',    'باك القميص + البنطال', 'Pack chemise + pantalon', 'باقة موفرة تجمع قميصاً وبنطالاً بسعر أقل من شرائهما منفصلين.', 'pack', 'published', (select id from public.categories where slug = 'packs'), now())
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
  if new.quantity is null or new.quantity < 1 or new.quantity > 20 then
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

-- ── Fake-order protection ──────────────────────────────────────────────────
-- Fake cash-on-delivery orders cost a shop the outbound and return shipping of
-- a parcel nobody collects. Two controls, enforced here so a script cannot skip
-- them: a number may hold at most three unconfirmed orders a day, and an owner
-- can block a number outright. Numbers are compared in one canonical form, so
-- "+213 555..." and "0555..." are the same buyer.
create or replace function public.canonical_dz_phone(raw text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p ~ '^\+?213' then '0' || regexp_replace(p, '^\+?213', '') else p end
  from (select regexp_replace(coalesce(raw, ''), '[^0-9+]', '', 'g') as p) cleaned;
$$;

create table if not exists public.blocked_phones (
  phone       text primary key,
  reason      text,
  created_at  timestamptz not null default now()
);

alter table public.blocked_phones enable row level security;

drop policy if exists "Admins manage blocked phones" on public.blocked_phones;
create policy "Admins manage blocked phones"
  on public.blocked_phones for all to authenticated
  using      ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true)
  with check ((select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true);

revoke all on public.blocked_phones from anon, authenticated;
grant select, insert, delete on public.blocked_phones to authenticated;

create index if not exists orders_phone_canon_idx
  on public.orders (public.canonical_dz_phone(phone), created_at desc);

-- What the dashboard shows next to an order: how this number has behaved before.
create or replace function public.admin_phone_history(p_phones text[])
returns table (phone text, orders bigint, refused bigint, delivered bigint, blocked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.phone,
         count(o.id),
         count(o.id) filter (where o.status in ('refused', 'returned')),
         count(o.id) filter (where o.status = 'delivered'),
         exists (select 1 from public.blocked_phones b where b.phone = c.phone)
  from (select distinct public.canonical_dz_phone(x) as phone from unnest(p_phones) as x) c
  left join public.orders o on public.canonical_dz_phone(o.phone) = c.phone
  where (select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is true
  group by c.phone;
$$;

revoke all on function public.admin_phone_history(text[]) from public, anon;
grant execute on function public.admin_phone_history(text[]) to authenticated;

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

  -- Pickup only where the owner priced it, so a buyer is never charged a
  -- pickup fee the shop never agreed to.
  if new.delivery_method = 'stopdesk' and not exists (
    select 1 from public.delivery_zones dz
    where dz.wilaya = new.wilaya and dz.is_active and dz.stopdesk_fee is not null
  ) then
    raise exception 'Pickup is not offered in %', new.wilaya
      using errcode = 'check_violation', hint = 'stopdesk_unavailable';
  end if;
  if new.delivery_method = 'home' then
    new.stopdesk_id := null;
    new.stopdesk_name := null;
  end if;

  -- The hint is a stable code the checkout translates; the message is for logs.
  if exists (
    select 1 from public.blocked_phones b where b.phone = public.canonical_dz_phone(new.phone)
  ) then
    raise exception 'This phone number cannot place orders'
      using errcode = 'check_violation', hint = 'phone_blocked';
  end if;

  if (
    select count(*) from public.orders o
    where public.canonical_dz_phone(o.phone) = public.canonical_dz_phone(new.phone)
      and o.status = 'pending'
      and o.created_at > now() - interval '24 hours'
  ) >= 3 then
    raise exception 'Too many unconfirmed orders for this phone number'
      using errcode = 'check_violation', hint = 'too_many_pending';
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

-- ── Delivery fee: the zone, the flat fee, and the free-delivery threshold ──
-- The checkout shows the buyer the wilaya's zone fee, and the storefront
-- promises free delivery above the threshold. The totals used to charge the
-- flat fee regardless, so the order the courier collected on was not the order
-- the buyer agreed to. src/lib/delivery.ts mirrors this rule for display only.
alter table public.store_settings
  add column if not exists free_shipping_threshold int not null default 0
  check (free_shipping_threshold >= 0);

-- The two-argument version predates pickup. Left in place it would make every
-- two-argument call ambiguous against the defaulted three-argument one.
drop function if exists public.delivery_fee_for(text, int);

create or replace function public.delivery_fee_for(
  p_wilaya text,
  p_subtotal int,
  p_method text default 'home'
)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when s.free_shipping_threshold > 0 and p_subtotal >= s.free_shipping_threshold then 0
    when p_method = 'stopdesk' then
      (select dz.stopdesk_fee from public.delivery_zones dz where dz.wilaya = p_wilaya and dz.is_active)
    else coalesce(
      (select dz.fee from public.delivery_zones dz where dz.wilaya = p_wilaya and dz.is_active),
      s.delivery_fee_flat
    )
  end
  from public.store_settings s
  where s.id = 1;
$$;

create or replace function public.recalculate_for_order(p_order_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders o
     set subtotal     = s.sub,
         delivery_fee = coalesce(public.delivery_fee_for(o.wilaya, s.sub, o.delivery_method), 0),
         total        = s.sub + coalesce(public.delivery_fee_for(o.wilaya, s.sub, o.delivery_method), 0)
    from (select coalesce(sum(quantity * unit_price), 0)::int as sub
            from public.order_items where order_id = p_order_id) s
   where o.id = p_order_id;
$$;

-- The line trigger now defers to the same function, so a dashboard edit and a
-- new order can never price delivery two different ways.
create or replace function public.recalculate_order_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_for_order(old.order_id);
    return old;
  end if;
  perform public.recalculate_for_order(new.order_id);
  return new;
end;
$$;

-- ── Dashboard analytics ─────────────────────────────────────────────────────
-- One function, one round trip, so the totals are computed over every order
-- rather than over whatever a capped browser fetch happened to return. The
-- shape is the `Analytics` type in src/lib/analytics.ts.
--
-- "Confirmed value" counts orders the buyer said yes to on the phone and that
-- have not since failed. A refusal is a refused or returned parcel: both cost
-- the outbound and the return. Wilayas under three orders are left out, because
-- one refusal out of one order is noise, not a rate.
create or replace function public.admin_analytics(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_since timestamptz;
  v_days  int := greatest(1, least(coalesce(p_days, 30), 366));
begin
  if (select public.has_admin_role((select auth.uid()), array['owner','staff']::public.admin_role[])) is not true then
    raise exception 'Only the shop''s administrators can read its analytics'
      using errcode = 'insufficient_privilege';
  end if;

  v_since := date_trunc('day', now()) - make_interval(days => v_days - 1);

  return (
    with win as (
      select * from public.orders where created_at >= v_since
    )
    select jsonb_build_object(
      'days', v_days,
      'revenue', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'day', to_char(d.day, 'YYYY-MM-DD'),
                 'orders', coalesce(x.orders, 0),
                 'value', coalesce(x.value, 0)) order by d.day), '[]'::jsonb)
        from generate_series(v_since, date_trunc('day', now()), interval '1 day') as d(day)
        left join (
          select date_trunc('day', created_at) as day,
                 count(*) as orders,
                 sum(total) filter (where status in ('confirmed','shipped','delivered')) as value
          from win group by 1
        ) x on x.day = d.day
      ),
      'funnel', (
        select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
        from (select status::text as status, count(*) as n from win group by 1) f
      ),
      'totals', (
        select jsonb_build_object(
          'orders', count(*),
          'confirmedValue', coalesce(sum(total) filter (where status in ('confirmed','shipped','delivered')), 0),
          'refused', count(*) filter (where status in ('refused','returned')))
        from win
      ),
      'byWilaya', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'wilaya', wilaya, 'total', total, 'delivered', delivered,
                 'refused', refused, 'rate', round(refused::numeric / total, 4))
               order by refused::numeric / total desc, total desc), '[]'::jsonb)
        from (
          select wilaya, count(*) as total,
                 count(*) filter (where status = 'delivered') as delivered,
                 count(*) filter (where status in ('refused','returned')) as refused
          from win group by wilaya having count(*) >= 3
        ) w
      ),
      'topProducts', (
        select coalesce(jsonb_agg(jsonb_build_object('name', name, 'units', units, 'value', value)
               order by units desc, value desc), '[]'::jsonb)
        from (
          select oi.product_name as name, sum(oi.quantity) as units,
                 sum(oi.quantity * oi.unit_price) as value
          from public.order_items oi
          join win o on o.id = oi.order_id
          where o.status in ('confirmed','shipped','delivered')
          group by oi.product_name
          order by units desc, value desc
          limit 5
        ) t
      ),
      'lowStock', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'id', id, 'product', product, 'label', label, 'stock', stock)
               order by stock, product), '[]'::jsonb)
        from (
          select pv.id, p.name as product,
                 nullif(concat_ws(' / ', nullif(pv.size, ''), nullif(pv.color_name, '')), '') as label,
                 pv.stock
          from public.product_variants pv
          join public.products p on p.id = pv.product_id
          where pv.is_active and p.status = 'published' and pv.stock <= 3
          order by pv.stock, p.name
          limit 10
        ) l
      )
    )
  );
end;
$$;

revoke all on function public.admin_analytics(int) from public, anon;
grant execute on function public.admin_analytics(int) to authenticated;

revoke all on function public.delivery_fee_for(text, int, text) from public, anon, authenticated;
revoke all on function public.recalculate_for_order(uuid)     from public, anon, authenticated;
revoke all on function public.recalculate_order_totals()      from public, anon, authenticated;

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

-- =============================================================================
-- 11. Order export to Google Sheets, and to anything else taking a webhook
-- =============================================================================
--
-- An owner can point orders at one or many endpoints, typically a Google Apps
-- Script web app bound to their own Sheet. Off by default: a shop with no targets
-- behaves exactly as it did before.
--
--  * pg_net, not an Edge Function. Its requests are queued and sent after the
--    transaction commits, so a slow or dead endpoint can never delay or fail a
--    checkout. A function in the middle would add a hop and a second thing to
--    misconfigure for no benefit.
--  * The URL and the signing secret live here, in a table only the owner can
--    read, and the request is made by the database. No browser ever holds them,
--    so there is nothing for the storefront bundle to leak.
--  * Every payload is HMAC-SHA256 signed over the raw body, so the receiving
--    script can prove the request came from this shop. Without that the URL alone
--    is a bearer token, and an Apps Script endpoint has to be public.
--
-- pgcrypto lives in the `extensions` schema, so its functions are named in full
-- rather than relying on search_path.

create extension if not exists pg_net;

create table if not exists public.order_export_targets (
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(trim(label)) between 1 and 80),
  -- https only. A plaintext webhook would put names, phone numbers and addresses
  -- on the wire in the clear.
  url text not null check (url ~ '^https://.'),
  secret text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.order_export_targets is
  'Outbound order webhooks, typically a Google Apps Script bound to a Sheet. Owner-only, because the secret signs payloads and must be pasted into the receiving script.';

create table if not exists public.order_export_log (
  id bigserial primary key,
  target_id uuid not null references public.order_export_targets(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  event text not null check (event in ('created', 'status_changed')),
  status text not null,
  request_id bigint,
  created_at timestamptz not null default now()
);

comment on table public.order_export_log is
  'One row per attempted export. request_id correlates to net._http_response, which pg_net retains for six hours.';

create index if not exists order_export_log_target_idx
  on public.order_export_log (target_id, created_at desc);
create index if not exists order_export_log_order_idx
  on public.order_export_log (order_id);

drop trigger if exists order_export_targets_touch on public.order_export_targets;
create trigger order_export_targets_touch
  before update on public.order_export_targets
  for each row execute function public.touch_updated_at();

/*
 * A flat, self-describing payload rather than the raw row.
 *
 * The person writing the receiving script is a shop owner looking at a
 * spreadsheet, not at this schema, so every field is named in full and the line
 * total is precomputed.
 *
 * SECURITY DEFINER because it reads customer personal data and must never be
 * callable from a client. Execute is revoked from every API role below.
 */
create or replace function public.order_export_payload(p_order_id uuid, p_event text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'event', p_event,
    'sent_at', now(),
    'shop', (
      select jsonb_build_object('name', s.name, 'phone', s.phone, 'whatsapp', s.whatsapp)
      from public.store_settings s where s.id = 1
    ),
    'order', jsonb_build_object(
      'id', o.id,
      'token', o.public_token,
      'customer_name', o.customer_name,
      'phone', o.phone,
      'wilaya', o.wilaya,
      'commune', o.commune,
      'address', o.address,
      'note', o.note,
      'subtotal', o.subtotal,
      'delivery_fee', o.delivery_fee,
      'total', o.total,
      'status', o.status,
      'created_at', o.created_at,
      'confirmed_at', o.confirmed_at,
      'refused_at', o.refused_at,
      'refused_reason', o.refused_reason,
      'shipped_at', o.shipped_at,
      'delivered_at', o.delivered_at,
      'carrier', o.carrier,
      'tracking_number', o.tracking_number,
      'tracking_url', o.tracking_url
    ),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'product_name', i.product_name,
            'variant_label', i.variant_label,
            'quantity', i.quantity,
            'unit_price', i.unit_price,
            'line_total', i.unit_price * i.quantity
          )
          order by i.created_at
        )
        from public.order_items i where i.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders o
  where o.id = p_order_id;
$$;

/*
 * Queue an export for every enabled target.
 *
 * Fires on creation and on any status change, because a sheet that only ever
 * shows new orders is a sheet the owner still reconciles by hand. The receiving
 * script upserts on order.id.
 *
 * The signature travels in two places, and that is not redundancy. A Google Apps
 * Script web app cannot read request headers at all: the event object passed to
 * doPost() has no `headers` field and never has had one (Google issue 67764685,
 * open since 2017). Apps Script is the main reason this feature exists, so a
 * header-only signature would be unverifiable for the one integration it was
 * built for. The query parameter is for Apps Script; the header is the usual
 * convention for anything else that can read it. Both carry the same digest over
 * the same body, which was verified byte-for-byte against a real endpoint.
 *
 * Wrapped so a misconfigured endpoint cannot fail a checkout. An export is a side
 * effect, and losing an order to a broken webhook would be an absurd trade.
 * Failures land in the log instead.
 */
create or replace function public.enqueue_order_export()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
  payload jsonb;
  event_name text;
  digest text;
  request_id bigint;
begin
  if tg_op = 'INSERT' then
    event_name := 'created';
  elsif new.status is distinct from old.status then
    event_name := 'status_changed';
  else
    return new;
  end if;

  payload := public.order_export_payload(new.id, event_name);
  if payload is null then
    return new;
  end if;

  for target in select id, url, secret from public.order_export_targets where enabled loop
    begin
      digest := encode(extensions.hmac(payload::text, target.secret, 'sha256'), 'hex');

      select net.http_post(
        url := target.url,
        body := payload,
        -- Raw hex, no prefix, because the receiving script compares hex to hex.
        params := jsonb_build_object('sig', digest),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-OpenStore-Event', event_name,
          -- Hex only, deliberately: pg_net refuses to send a request whose
          -- headers contain a carriage return or line feed, and hex cannot.
          'X-OpenStore-Signature', 'sha256=' || digest
        ),
        timeout_milliseconds := 10000
      ) into request_id;

      insert into public.order_export_log (target_id, order_id, event, status, request_id)
      values (target.id, new.id, event_name, 'queued', request_id);
    exception when others then
      insert into public.order_export_log (target_id, order_id, event, status)
      values (target.id, new.id, event_name, 'error: ' || sqlerrm);
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists order_export_enqueue on public.orders;
create trigger order_export_enqueue
  after insert or update of status on public.orders
  for each row execute function public.enqueue_order_export();

alter table public.order_export_targets enable row level security;
alter table public.order_export_log enable row level security;

grant select, insert, update, delete on public.order_export_targets to authenticated;
grant select on public.order_export_log to authenticated;
grant usage, select on sequence public.order_export_log_id_seq to authenticated;

-- Owner only, not owner-and-staff as elsewhere: this table holds a signing
-- secret, and a leaked one lets someone forge orders into the shop's spreadsheet.
drop policy if exists order_export_targets_admin on public.order_export_targets;
create policy order_export_targets_admin on public.order_export_targets
  for all to authenticated
  using (
    (select public.has_admin_role((select auth.uid()), array['owner'::public.admin_role])) is true
  )
  with check (
    (select public.has_admin_role((select auth.uid()), array['owner'::public.admin_role])) is true
  );

drop policy if exists order_export_log_admin on public.order_export_log;
create policy order_export_log_admin on public.order_export_log
  for select to authenticated
  using (
    (select public.has_admin_role((select auth.uid()), array['owner'::public.admin_role])) is true
  );

-- Supabase grants broad default privileges on new tables in `public` to anon,
-- authenticated and service_role. That is what makes the usual grant-plus-policy
-- pairing work, and it also means `anon` starts out holding SELECT and TRUNCATE
-- on these two. RLS returns no rows to anon here, because the only policies target
-- `authenticated`, but a signing secret should not be one dropped policy away from
-- being readable. TRUNCATE ignores RLS entirely, so leaving it granted would be a
-- loaded gun for no benefit. Same treatment `public.orders` already gets.
revoke all on public.order_export_targets from anon;
revoke all on public.order_export_log from anon;
revoke truncate, references, trigger on public.order_export_targets from authenticated, service_role;
revoke truncate, references, trigger on public.order_export_log from authenticated, service_role;
revoke all on sequence public.order_export_log_id_seq from anon;

-- These two expose customer personal data and are only ever called by the trigger,
-- which runs as the definer.
revoke all on function public.order_export_payload(uuid, text) from public, anon, authenticated;
revoke all on function public.enqueue_order_export() from public, anon, authenticated;

-- =============================================================================
-- 12. Storefront read helpers
-- =============================================================================
--
-- Both exist for the same reason: the storefront was doing work in the browser
-- that the database does in one row instead.

/*
 * Published product count per category.
 *
 * The home page used to select every published product's `category_id` and count
 * them in JavaScript, so producing eight numbers cost a full catalogue read on
 * every load. This returns eight rows.
 */
create or replace function public.category_product_counts()
returns table (category_id uuid, product_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.category_id, count(*)::bigint as product_count
  from public.products p
  where p.status = 'published'
    and p.category_id is not null
  group by p.category_id;
$$;

comment on function public.category_product_counts() is
  'Published product count per category, so the storefront counts in SQL instead of fetching every product.';

revoke all on function public.category_product_counts() from public;
grant execute on function public.category_product_counts() to anon, authenticated;

-- Supports the group-by above, and the catalogue's category filter.
create index if not exists products_status_category_idx
  on public.products (status, category_id);

-- -----------------------------------------------------------------------------
-- The storefront catalogue, filtered, sorted, searched and paged in SQL
-- -----------------------------------------------------------------------------
--
-- The storefront used to filter, sort, search and compute its facets in the
-- browser over the whole catalogue. That stops working the moment the list is
-- paged, and it fails in the worst way: filtering a paged list client-side only
-- ever sees the loaded page, so a result count becomes a wrong answer rather than
-- a slow one. This moves all of it to the database, so the count is always the
-- count of the whole matching set.

/*
 * Arabic normalisation. The rules are the ones a phone keyboard makes necessary:
 * diacritics and tatweel are stripped because nobody types them, hamza forms
 * collapse to bare alef, the two ya forms to one, and taa marbuta to ha, because
 * all of those are written interchangeably in practice.
 */
create or replace function public.normalize_arabic(input text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        translate(lower(coalesce(input, '')), 'أإآٱىةؤئ', 'ااااييهءء'),
        '[ً-ْٰـ]', '', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

comment on function public.normalize_arabic(text) is
  'Normalises Arabic for search. The rules are the ones a phone keyboard makes necessary.';

/*
 * One page of the published catalogue, plus the total and the facets.
 *
 * Returns JSON in the shape the storefront already expects, so this was a change
 * of transport rather than of shape. Every word of the query must match, which is
 * what makes a second word narrow the results instead of widening them.
 *
 * Sort is a text switch rather than four queries, so a caller cannot ask for a
 * sort this does not know and silently get the default.
 */
create or replace function public.catalogue_page(
  p_category_slug text default null,
  p_query text default null,
  p_sizes text[] default null,
  p_colors text[] default null,
  p_min_price int default null,
  p_max_price int default null,
  p_in_stock boolean default false,
  p_sort text default 'newest',
  p_limit int default 12,
  p_offset int default 0
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with matched as (
  select
    p.id,
    p.name,
    p.published_at,
    (select min(v.price) from public.product_variants v
      where v.product_id = p.id and v.is_active) as min_price,
    (select max(v.price) from public.product_variants v
      where v.product_id = p.id and v.is_active) as max_price
  from public.products p
  left join public.categories c on c.id = p.category_id
  where p.status = 'published'
    and (p_category_slug is null or c.slug = p_category_slug)
    and (
      coalesce(trim(p_query), '') = ''
      or not exists (
        select 1
        from unnest(string_to_array(public.normalize_arabic(p_query), ' ')) as word
        where word <> ''
          and public.normalize_arabic(
            p.name || ' ' || coalesce(p.name_fr, '') || ' ' || coalesce(p.description, '')
            || ' ' || p.slug || ' ' || coalesce((
              select string_agg(
                coalesce(v.sku, '') || ' ' || coalesce(v.size, '') || ' ' || coalesce(v.color_name, ''),
                ' '
              )
              from public.product_variants v where v.product_id = p.id
            ), '')
          ) not like '%' || word || '%'
      )
    )
    and (
      coalesce(array_length(p_sizes, 1), 0) = 0
      or exists (select 1 from public.product_variants v
        where v.product_id = p.id and v.is_active and v.size = any(p_sizes))
    )
    and (
      coalesce(array_length(p_colors, 1), 0) = 0
      or exists (select 1 from public.product_variants v
        where v.product_id = p.id and v.is_active and v.color_name = any(p_colors))
    )
    and (
      not coalesce(p_in_stock, false)
      or exists (select 1 from public.product_variants v
        where v.product_id = p.id and v.is_active and v.stock > 0)
    )
    and (
      p_min_price is null
      or exists (select 1 from public.product_variants v
        where v.product_id = p.id and v.is_active and v.price >= p_min_price)
    )
    and (
      p_max_price is null
      or exists (select 1 from public.product_variants v
        where v.product_id = p.id and v.is_active and v.price <= p_max_price)
    )
),
ranked as (
  select
    m.id,
    row_number() over (
      order by
        case when p_sort = 'price-asc' then m.min_price end asc nulls last,
        case when p_sort = 'price-desc' then m.max_price end desc nulls last,
        case when p_sort = 'name' then m.name end asc,
        case when p_sort not in ('price-asc', 'price-desc', 'name') then m.published_at end desc nulls last,
        m.id
    ) as ord
  from matched m
),
page as (
  select r.id, r.ord from ranked r
  order by r.ord
  limit greatest(coalesce(p_limit, 12), 1)
  offset greatest(coalesce(p_offset, 0), 0)
)
select jsonb_build_object(
  'total', (select count(*) from matched),
  'products', coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'slug', p.slug,
        'name', p.name,
        'name_fr', p.name_fr,
        'description', p.description,
        'description_fr', p.description_fr,
        'kind', p.kind,
        'status', p.status,
        'category_id', p.category_id,
        'published_at', p.published_at,
        -- Card ratings, aggregated here so a grid of twelve does not send twelve
        -- review requests of its own.
        'rating_avg', (select round(avg(r.rating)::numeric, 2) from public.reviews r
                        where r.product_id = p.id and r.is_approved),
        'rating_count', (select count(*) from public.reviews r
                          where r.product_id = p.id and r.is_approved),
        'categories', case when c.id is null then null else jsonb_build_object(
          'slug', c.slug, 'name', c.name, 'name_fr', c.name_fr
        ) end,
        -- Only what a card draws: price, sale, stock, order, and one photo. A
        -- product page fetches everything else itself. Sending every variant's
        -- every photo made the home page 510 KB of HTML for twelve cards.
        'product_variants', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', v.id,
              'size', v.size,
              'color_name', v.color_name,
              'color_hex', v.color_hex,
              'price', v.price,
              'compare_at_price', v.compare_at_price,
              'stock', v.stock,
              'is_active', v.is_active,
              'sort_order', v.sort_order,
              'variant_images', case
                when v.id = (
                  select v2.id from public.product_variants v2
                  where v2.product_id = p.id and v2.is_active
                    and exists (select 1 from public.variant_images i2 where i2.variant_id = v2.id)
                  order by v2.sort_order, v2.price
                  limit 1
                ) then coalesce((
                  select jsonb_agg(jsonb_build_object('id', i.id, 'url', i.url, 'alt', i.alt, 'sort_order', i.sort_order))
                  from (select * from public.variant_images
                        where variant_id = v.id order by sort_order limit 1) i
                ), '[]'::jsonb)
                else '[]'::jsonb
              end
            )
            order by v.sort_order
          )
          from public.product_variants v
          where v.product_id = p.id and v.is_active
        ), '[]'::jsonb)
      )
      order by page.ord
    )
    from page
    join public.products p on p.id = page.id
    left join public.categories c on c.id = p.category_id
  ), '[]'::jsonb),
  -- Facets come from the whole published catalogue, not the filtered page, so the
  -- filter panel does not empty itself out as the buyer narrows.
  'facets', jsonb_build_object(
    'sizes', coalesce((
      select jsonb_agg(distinct v.size order by v.size)
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where p.status = 'published' and v.is_active and coalesce(v.size, '') <> ''
    ), '[]'::jsonb),
    'colors', coalesce((
      select jsonb_agg(distinct v.color_name order by v.color_name)
      from public.product_variants v
      join public.products p on p.id = v.product_id
      where p.status = 'published' and v.is_active and coalesce(v.color_name, '') <> ''
    ), '[]'::jsonb),
    'priceMin', coalesce((
      select min(v.price) from public.product_variants v
      join public.products p on p.id = v.product_id
      where p.status = 'published' and v.is_active
    ), 0),
    'priceMax', coalesce((
      select max(v.price) from public.product_variants v
      join public.products p on p.id = v.product_id
      where p.status = 'published' and v.is_active
    ), 0)
  )
);
$$;

comment on function public.catalogue_page(text, text, text[], text[], int, int, boolean, text, int, int) is
  'One page of the published catalogue with filtering, sorting, search, facets and total. Exists so the storefront can page without filtering only the loaded page.';

revoke all on function public.catalogue_page(text, text, text[], text[], int, int, boolean, text, int, int) from public;
grant execute on function public.catalogue_page(text, text, text[], text[], int, int, boolean, text, int, int) to anon, authenticated;
grant execute on function public.normalize_arabic(text) to anon, authenticated;

-- Ask the API to pick up the new tables and functions straight away, so a shop
-- set up from the SQL Editor works on the very next page refresh.
notify pgrst, 'reload schema';
