-- ============================================================
-- SECTION: REVIEWS TABLE
-- ============================================================

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  order_id    uuid references public.orders(id) on delete set null,
  user_name   text not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  comment     text not null,
  source      text default 'web' check (source in ('web', 'instagram', 'whatsapp')),
  is_approved boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
drop policy if exists "Public read approved reviews" on public.reviews;
drop policy if exists "User insert own review" on public.reviews;
drop policy if exists "Admin manage reviews" on public.reviews;

create policy "Public read approved reviews"
  on public.reviews for select
  using (is_approved = true);

create policy "User insert own review"
  on public.reviews for insert
  to authenticated
  with check (
    -- Let them insert if they provide their own user_id
    (user_id = auth.uid()) 
    OR 
    -- Or if it's an admin manually adding
    ((select public.is_admin()))
  );

create policy "Admin manage reviews"
  on public.reviews for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
