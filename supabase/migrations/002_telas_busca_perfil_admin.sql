-- RateMedia: colunas e políticas exigidas pelas telas Busca, Perfil/Listas e Painel Admin.
-- Execute no SQL Editor do Supabase (idempotente).

-- Obras: gêneros (filtros da busca), subtítulo e status editorial (painel admin).
alter table media add column if not exists genres text[] not null default '{}';
alter table media add column if not exists subtitle text;            -- estúdio, autor, emissora...
alter table media add column if not exists publish_status text not null default 'published'
  check (publish_status in ('published', 'draft', 'review'));
create index if not exists media_genres_idx on media using gin (genres);

-- Perfil público.
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists banner_url text;

-- Admin pode alterar o papel de outros usuários (tela "Usuários e Permissões").
drop policy if exists "profiles_admin_update" on profiles;
create policy "profiles_admin_update" on profiles for update
  using (is_admin()) with check (is_admin());
