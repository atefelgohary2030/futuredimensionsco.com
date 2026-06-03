-- Optional backend schema for Future Dimensions Client Portal.
-- Run in Supabase SQL editor, then enable and adjust RLS policies according to your real user/client model.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  client_id uuid,
  name_ar text,
  name_en text,
  client_ar text,
  client_en text,
  owner text,
  status text default 'new',
  stage text default 'diagnose',
  progress int default 0,
  next_ar text,
  next_en text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text default 'other',
  name_ar text,
  name_en text,
  status text default 'under_review',
  storage_path text,
  created_at timestamptz default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  invoice_no text,
  name_ar text,
  name_en text,
  amount numeric default 0,
  currency text default 'EGP',
  status text default 'unpaid',
  storage_path text,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title_ar text,
  title_en text,
  message text,
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title_ar text,
  title_en text,
  description text,
  meeting_date timestamptz,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.invoices enable row level security;
alter table public.tickets enable row level security;
alter table public.meetings enable row level security;

-- Basic self-access policies. Replace with stronger company/client role policies before production.
create policy "clients can read own projects" on public.projects for select using (auth.uid() = user_id);
create policy "clients can read own documents" on public.documents for select using (auth.uid() = user_id);
create policy "clients can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "clients can read own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "clients can read own tickets" on public.tickets for select using (auth.uid() = user_id);
create policy "clients can insert own tickets" on public.tickets for insert with check (auth.uid() = user_id);
create policy "clients can read own meetings" on public.meetings for select using (auth.uid() = user_id);
create policy "clients can insert own meetings" on public.meetings for insert with check (auth.uid() = user_id);

-- Admin helper policies for deletion/update.
-- To use these safely, set the admin user's app_metadata role to "admin" from Supabase Auth admin tools / service role backend.
-- Example JWT check used below: (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

create policy "admins can read all projects" on public.projects
  for select using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage documents" on public.documents
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage invoices" on public.invoices
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage tickets" on public.tickets
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can manage meetings" on public.meetings
  for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =========================================================
-- V5 Admin Panel additions: access requests and clients
-- Run this in Supabase SQL Editor after reviewing it.
-- The admin email below must match the app constant FD_ADMIN_EMAILS.
-- =========================================================

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  service text,
  message text,
  status text default 'pending',
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text unique not null,
  phone text,
  status text default 'active',
  source_request_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.access_requests enable row level security;
alter table public.clients enable row level security;

-- Public visitors can submit access requests. They cannot read all requests.
drop policy if exists "Public can create access requests" on public.access_requests;
create policy "Public can create access requests"
  on public.access_requests for insert
  with check (true);

-- Admin can read and update access requests.
drop policy if exists "Admin can manage access requests" on public.access_requests;
create policy "Admin can manage access requests"
  on public.access_requests for all
  using (lower(auth.email()) in ('info@futuredimensionsco.com'))
  with check (lower(auth.email()) in ('info@futuredimensionsco.com'));

-- Admin can manage client profiles.
drop policy if exists "Admin can manage clients" on public.clients;
create policy "Admin can manage clients"
  on public.clients for all
  using (lower(auth.email()) in ('info@futuredimensionsco.com'))
  with check (lower(auth.email()) in ('info@futuredimensionsco.com'));

-- A signed-in client can read only their own client profile by email.
drop policy if exists "Client can read own profile" on public.clients;
create policy "Client can read own profile"
  on public.clients for select
  using (lower(email) = lower(auth.email()));

-- IMPORTANT:
-- Do not expose the Supabase Service Role key in the browser.
-- Official user creation/invitation should be done from Supabase Authentication dashboard
-- or through a secure Edge Function/server endpoint.
