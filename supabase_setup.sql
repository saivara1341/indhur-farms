-- ============================================================
--  INDHUR FARMS — COMPLETE SUPABASE SETUP SCRIPT
--  Run this ONCE in Supabase SQL Editor → New Query
--  Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================


-- ============================================================
-- SECTION 1: TABLE CREATION
-- ============================================================

-- 1.1 categories
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz default now()
);

-- 1.2 products
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  price            numeric(10,2) not null,
  compare_at_price numeric(10,2),
  image_url        text,
  gallery          text[] default '{}',
  stock            integer default 0,
  unit             text,
  category_id      uuid references public.categories(id) on delete set null,
  is_active        boolean default true,
  is_featured      boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 1.3 user_roles  (admin check)
create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  role       text not null check (role in ('admin', 'user')),
  created_at timestamptz default now(),
  unique(user_id, role)
);

-- 1.4 cart_items
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity   integer default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 1.5 orders
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  total            numeric(10,2) not null,
  shipping_address text,
  phone            text,
  notes            text,
  status           text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_status   text default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  payment_txn_id   text,
  payment_screenshot_url text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 1.6 order_items
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity   integer not null,
  price      numeric(10,2) not null,
  created_at timestamptz default now()
);

-- 1.7 site_settings
create table if not exists public.site_settings (
  id           uuid primary key default gen_random_uuid(),
  upi_id       text,
  qr_code_url  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 1.8 delivery_receipts
create table if not exists public.delivery_receipts (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references public.orders(id) on delete cascade,
  delivered_by text,
  notes        text,
  photo_url    text,
  delivered_at timestamptz,
  created_at   timestamptz default now()
);


-- ============================================================
-- SECTION 2: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.user_roles       enable row level security;
alter table public.cart_items       enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.site_settings    enable row level security;
alter table public.delivery_receipts enable row level security;

-- ── Helper: is current user an admin? ──────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and   role    = 'admin'
  );
$$;

-- ── categories ──────────────────────────────────────────────
drop policy if exists "Public read categories"  on public.categories;
drop policy if exists "Admin manage categories" on public.categories;

create policy "Public read categories"
  on public.categories for select using (true);

create policy "Admin manage categories"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── products ────────────────────────────────────────────────
drop policy if exists "Public read active products" on public.products;
drop policy if exists "Admin manage products"       on public.products;

create policy "Public read active products"
  on public.products for select using (true);

create policy "Admin manage products"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── user_roles ───────────────────────────────────────────────
drop policy if exists "Admin read user roles" on public.user_roles;
drop policy if exists "User read own role"    on public.user_roles;

create policy "User read own role"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admin read user roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── cart_items ───────────────────────────────────────────────
drop policy if exists "User manage own cart" on public.cart_items;

create policy "User manage own cart"
  on public.cart_items for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── orders ───────────────────────────────────────────────────
drop policy if exists "User read own orders"  on public.orders;
drop policy if exists "User insert own order" on public.orders;
drop policy if exists "Admin manage orders"   on public.orders;

create policy "User read own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid());

create policy "User insert own order"
  on public.orders for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Admin manage orders"
  on public.orders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── order_items ──────────────────────────────────────────────
drop policy if exists "User read own order items" on public.order_items;
drop policy if exists "User insert order items"   on public.order_items;
drop policy if exists "Admin manage order items"  on public.order_items;

create policy "User read own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and user_id = auth.uid()
    )
  );

create policy "User insert order items"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders
      where id = order_items.order_id and user_id = auth.uid()
    )
  );

create policy "Admin manage order items"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── site_settings ────────────────────────────────────────────
drop policy if exists "Public read settings" on public.site_settings;
drop policy if exists "Admin manage settings" on public.site_settings;

create policy "Public read settings"
  on public.site_settings for select using (true);

create policy "Admin manage settings"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── delivery_receipts ────────────────────────────────────────
drop policy if exists "Admin manage delivery receipts" on public.delivery_receipts;

create policy "Admin manage delivery receipts"
  on public.delivery_receipts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- SECTION 3: STORAGE BUCKET
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public to view images
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Allow admins to upload/delete images
drop policy if exists "Admin upload product images"  on storage.objects;
drop policy if exists "Admin delete product images"  on storage.objects;

create policy "Admin upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admin delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());


-- ============================================================
-- SECTION 4: MAKE YOUR ACCOUNT AN ADMIN
-- ============================================================
-- IMPORTANT: Replace 'your-email@example.com' with your actual
--            Supabase login email, then run this section.

insert into public.user_roles (user_id, role)
select id, 'admin'
from   auth.users
where  email = 'your-email@example.com'   -- ← CHANGE THIS
on conflict (user_id, role) do nothing;


-- ============================================================
-- SECTION 5: SEED CATEGORIES
-- ============================================================

insert into public.categories (name, slug, description)
values
  ('Turmeric Products 🟡',    'turmeric-products',    'Pasupu kommulu, turmeric powder and extracts from Indhur Farms'),
  ('Fruits 🍎',               'fruits',               'Fresh seasonal fruits directly from our orchards'),
  ('Vegetables 🥦',           'vegetables',           'Farm-fresh vegetables grown without harmful pesticides'),
  ('Paddy & Grains 🌾',       'paddy-grains',         'Premium rice, paddy and other grains'),
  ('Sugarcane & Jaggery 🎋',  'sugarcane-jaggery',    'Natural sugarcane products and organic jaggery'),
  ('Other Farm Products 🧺',  'other-farm-products',  'All other seasonal and specialty farm produce')
on conflict (slug) do nothing;


-- ============================================================
-- SECTION 6: SEED SAMPLE PRODUCTS (optional)
-- ============================================================

insert into public.products (name, slug, description, price, compare_at_price, image_url, unit, stock, is_featured, category_id)
select
  'Pasupu Kommulu',
  'pasupu-kommulu',
  'Premium quality raw turmeric fingers (Pasupu Kommulu) directly from Indhur Farms. Rich in curcumin and traditional aroma.',
  150,
  180,
  'https://images.unsplash.com/photo-1615485242231-8933227928b9?auto=format&fit=crop&q=80&w=800',
  '500g',
  100,
  true,
  id
from public.categories where slug = 'turmeric-products'
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, compare_at_price, image_url, unit, stock, is_featured, category_id)
select
  'Pasupu (Turmeric Powder)',
  'pasupu-turmeric-powder',
  'Pure, stone-ground turmeric powder from Indhur Farms. No additives, no colors—just pure goodness.',
  120,
  150,
  'https://images.unsplash.com/photo-1585241936939-be4099591252?auto=format&fit=crop&q=80&w=800',
  '250g',
  100,
  true,
  id
from public.categories where slug = 'turmeric-products'
on conflict (slug) do nothing;


-- ============================================================
-- DONE ✅
-- After running:
--   1. The Category dropdown will show all 6 categories
--   2. You can add/edit/delete products as admin
--   3. Images can be uploaded to the product-images bucket
--   4. Customers can browse, cart, and checkout
-- ============================================================
