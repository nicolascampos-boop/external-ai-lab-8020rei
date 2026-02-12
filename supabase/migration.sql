-- ============================================
-- AI Training Platform - Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 2. MATERIALS TABLE
-- ============================================
create table if not exists public.materials (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  category text not null,
  tags text[] default '{}',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.materials enable row level security;

create policy "Materials are viewable by authenticated users"
  on public.materials for select
  to authenticated
  using (true);

create policy "Authenticated users can upload materials"
  on public.materials for insert
  to authenticated
  with check (auth.uid() = uploaded_by);

create policy "Admins can update any material"
  on public.materials for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete any material"
  on public.materials for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 3. VOTES TABLE
-- ============================================
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  material_id uuid references public.materials(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quality_score integer not null check (quality_score between 1 and 5),
  relevance_score integer not null check (relevance_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(material_id, user_id)
);

alter table public.votes enable row level security;

create policy "Votes are viewable by authenticated users"
  on public.votes for select
  to authenticated
  using (true);

create policy "Authenticated users can vote"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own votes"
  on public.votes for update
  to authenticated
  using (auth.uid() = user_id);

-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. MATERIAL SCORES VIEW (aggregated ratings)
-- ============================================
create or replace view public.material_scores as
select
  m.*,
  coalesce(avg(v.quality_score), 0)::numeric(3,1) as avg_quality,
  coalesce(avg(v.relevance_score), 0)::numeric(3,1) as avg_relevance,
  coalesce((avg(v.quality_score) + avg(v.relevance_score)) / 2, 0)::numeric(3,1) as avg_overall,
  count(v.id)::integer as vote_count
from public.materials m
left join public.votes v on v.material_id = m.id
group by m.id;

-- 6. STORAGE BUCKET FOR MATERIALS
-- ============================================
-- Create a storage bucket for file uploads
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Authenticated users can upload files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materials');

create policy "Anyone can view files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'materials');

create policy "Admins can delete files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'materials' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- DONE! After running this:
-- 1. Go to Authentication > Providers > Google and enable it
-- 2. Set your Google OAuth credentials
-- 3. Set Site URL to your Vercel domain
-- 4. Add redirect URL: https://your-domain.vercel.app/auth/callback
-- ============================================
