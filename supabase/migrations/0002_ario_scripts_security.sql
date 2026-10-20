-- Ario Scripts additive security migration.
-- Apply to the existing Supabase project after reviewing existing objects.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','moderator','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text,
  tier text not null default 'standard',
  active boolean not null default true,
  automatic boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_audit_logs_created on public.admin_audit_logs(created_at desc);
create index if not exists idx_user_badges_user on public.user_badges(user_id);

alter table public.user_roles enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Users can inspect their own role only; role changes require trusted server/database procedures.
create policy if not exists user_roles_self_read on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create policy if not exists badges_public_read on public.badges
  for select to anon, authenticated using (active = true);

create policy if not exists user_badges_public_read on public.user_badges
  for select to anon, authenticated using (true);

create policy if not exists notifications_self_read on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy if not exists notifications_self_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists audit_logs_no_public_read on public.admin_audit_logs
  for select to authenticated using (false);

-- Seed only generic badge definitions; no users receive privileged badges automatically.
insert into public.badges (name, slug, description, icon, tier, automatic)
values
  ('New Member', 'new-member', 'Joined the Ario Scripts community.', 'sparkles', 'standard', true),
  ('Script Creator', 'script-creator', 'Published an approved Roblox Studio script.', 'code-2', 'standard', true),
  ('Rising Creator', 'rising-creator', 'A creator milestone badge awarded by platform criteria.', 'trending-up', 'rare', true),
  ('Community Helper', 'community-helper', 'Recognized for helpful community contributions.', 'heart-handshake', 'rare', false),
  ('Verified Developer', 'verified-developer', 'Verified developer status granted through an approved process.', 'badge-check', 'special', false),
  ('Moderator', 'moderator', 'Trusted moderation role.', 'shield', 'special', false),
  ('Administrator', 'administrator', 'Trusted platform administrator role.', 'shield-check', 'special', false)
on conflict (slug) do nothing;
