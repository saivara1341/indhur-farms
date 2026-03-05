-- ═══════════════════════════════════════════════════════════════
-- INDHUR FARMS — Phase 1 Self-Managing Backend Automation SQL
-- Run this ONCE in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Add order_number column to orders ───────────────────────
alter table public.orders
  add column if not exists order_number text unique;

-- Sequence for human-readable order numbers
create sequence if not exists order_seq start with 1001;

-- ─── 2. Auto-generate readable order number on insert ───────────
create or replace function public.set_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := 'IF-' || lpad(nextval('order_seq')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_order_number on public.orders;
create trigger trg_order_number
  before insert on public.orders
  for each row execute function public.set_order_number();

-- Backfill existing orders that don't have a number yet
update public.orders
set order_number = 'IF-' || lpad(nextval('order_seq')::text, 4, '0')
where order_number is null;

-- ─── 3. Auto-decrement stock & deactivate product when stock hits 0 ─
create or replace function public.handle_order_stock()
returns trigger language plpgsql as $$
declare
  item jsonb;
  pid  uuid;
  qty  int;
begin
  -- Loop over items array in the order
  for item in select * from jsonb_array_elements(new.items)
  loop
    pid := (item->>'product_id')::uuid;
    qty := (item->>'quantity')::int;

    update public.products
    set
      stock = greatest(stock - qty, 0),
      is_active = case when (stock - qty) <= 0 then false else is_active end
    where id = pid;
  end loop;
  return new;
end $$;

drop trigger if exists trg_order_stock on public.orders;
create trigger trg_order_stock
  after insert on public.orders
  for each row execute function public.handle_order_stock();

-- ─── 4. Auto-create user profile row on new signup ──────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_new_user on auth.users;
create trigger trg_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Low stock alert view with "Days Remaining" logic (stock ≤ 10)
create or replace view public.low_stock_products as
  with product_sales as (
    select
      product_id,
      coalesce(sum(quantity), 0) / 14.0 as daily_velocity
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.created_at > now() - interval '14 days'
    group by 1
  )
  select
    p.id, p.name, p.slug, p.stock, p.unit, p.is_active,
    coalesce(ps.daily_velocity, 0) as daily_velocity,
    case
      when coalesce(ps.daily_velocity, 0) = 0 then 999
      else floor(p.stock / ps.daily_velocity)
    end as estimated_days_left
  from public.products p
  left join product_sales ps on ps.product_id = p.id
  where p.stock <= 10
  order by p.stock asc;

-- Daily revenue summary
create or replace view public.revenue_summary as
  select
    date_trunc('day', created_at)::date                          as day,
    count(*)::int                                                 as order_count,
    coalesce(sum(case when status not in ('cancelled') then total else 0 end), 0)::numeric as revenue
  from public.orders
  group by 1
  order by 1 desc;

-- Revenue Forecast (Next 7 Days)
create or replace view public.revenue_forecast as
  with recent_avg as (
    select avg(revenue) as daily_avg
    from public.revenue_summary
    where day > now() - interval '14 days'
  )
  select
    daily_avg * 7 as predicted_weekly_revenue,
    daily_avg as estimated_daily_revenue
  from recent_avg;

-- Top products by number sold
create or replace view public.top_products as
  select
    p.id,
    p.name,
    p.image_url,
    coalesce(sum(oi.quantity), 0)::int as units_sold,
    coalesce(sum(oi.quantity * oi.price), 0)::numeric as revenue
  from public.products p
  left join public.order_items oi on oi.product_id = p.id
  left join public.orders o on o.id = oi.order_id and o.status != 'cancelled'
  group by p.id, p.name, p.image_url
  order by units_sold desc
  limit 10;

-- ─── 6. RLS Policies — Products (admin write) ────────────────────
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Admins can insert products"
  on public.products for insert to authenticated
  with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update products"
  on public.products for update to authenticated
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ─── 7. RLS Policies — Categories (admin write) ──────────────────
drop policy if exists "Admins can insert categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;

create policy "Admins can insert categories"
  on public.categories for insert to authenticated
  with check (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can update categories"
  on public.categories for update to authenticated
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete categories"
  on public.categories for delete to authenticated
  using (
    exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ─── 8. RLS — Allow views to be read by admins ───────────────────
grant select on public.low_stock_products to authenticated;
grant select on public.revenue_summary to authenticated;
grant select on public.revenue_forecast to authenticated;
grant select on public.top_products to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Done! All automation is now active.
-- ═══════════════════════════════════════════════════════════════
