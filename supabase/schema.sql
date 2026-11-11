-- RateMedia: schema inicial. Execute no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

-- Enums
create type media_type as enum ('anime', 'manga', 'series', 'movie');
create type user_status as enum ('planned', 'in_progress', 'completed', 'dropped');
create type campaign_status as enum ('recruiting', 'ongoing', 'finished', 'paused');
create type user_role as enum ('user', 'admin');

-- Perfis (1:1 com auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  avatar_url text,
  role user_role not null default 'user',
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Obras (catálogo global)
create table media (
  id uuid primary key default gen_random_uuid(),
  type media_type not null,
  title text not null,
  synopsis text,
  cover_url text,
  release_year int,
  total_units int,                      -- episódios, capítulos ou 1 (filme)
  external_source text,                 -- 'jikan' | 'tmdb' | 'manual'
  external_id text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (external_source, external_id)
);
create index media_type_idx on media(type);
create index media_title_idx on media using gin (to_tsvector('simple', title));

-- Entradas da biblioteca do usuário (status, nota, progresso, resenha)
create table library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  media_id uuid not null references media(id) on delete cascade,
  status user_status not null default 'planned',
  rating numeric(2,1) check (rating between 0 and 5),
  progress int not null default 0,
  review text,
  has_spoilers boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, media_id)
);

-- Listas personalizadas
create table lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create table list_items (
  list_id uuid references lists(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,
  position int not null default 0,
  primary key (list_id, media_id)
);

-- Campanhas de RPG
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  synopsis text not null,
  system text not null,                 -- ex: D&D 5e, Tormenta20, Call of Cthulhu
  rules text,
  status campaign_status not null default 'recruiting',
  cover_url text,
  created_at timestamptz not null default now()
);
create table campaign_reviews (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating numeric(2,1) not null check (rating between 0 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);

-- Row Level Security
alter table profiles enable row level security;
alter table media enable row level security;
alter table library_entries enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;
alter table campaigns enable row level security;
alter table campaign_reviews enable row level security;

create policy "profiles_read" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

create policy "media_read" on media for select using (true);
create policy "media_admin_write" on media for all using (is_admin()) with check (is_admin());

create policy "entries_read" on library_entries for select using (true);
create policy "entries_own_write" on library_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "entries_admin_moderate" on library_entries for update using (is_admin());

create policy "lists_read" on lists for select using (is_public or auth.uid() = user_id);
create policy "lists_own_write" on lists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "list_items_read" on list_items for select using (
  exists (select 1 from lists l where l.id = list_id and (l.is_public or l.user_id = auth.uid())));
create policy "list_items_own_write" on list_items for all using (
  exists (select 1 from lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lists l where l.id = list_id and l.user_id = auth.uid()));

create policy "campaigns_read" on campaigns for select using (true);
create policy "campaigns_own_write" on campaigns for all
  using (auth.uid() = author_id or is_admin()) with check (auth.uid() = author_id or is_admin());

create policy "creviews_read" on campaign_reviews for select using (true);
create policy "creviews_own_write" on campaign_reviews for all
  using (auth.uid() = user_id or is_admin()) with check (auth.uid() = user_id or is_admin());

-- Para tornar alguém admin (rode manualmente):
-- update profiles set role = 'admin' where username = 'seu_usuario';

-- Telas Busca/Perfil/Admin: aplique também supabase/migrations/002_telas_busca_perfil_admin.sql
