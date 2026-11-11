-- 003 — Corrige o erro ao salvar avaliação ("has_spoilers" não existe no banco).
-- Seguro para rodar mais de uma vez (add column if not exists).
-- Execute no SQL Editor do Supabase.

alter table public.library_entries
  add column if not exists has_spoilers boolean not null default false;

-- Colunas que bancos criados a partir de versões antigas do schema podem não ter.
alter table public.library_entries
  add column if not exists review text,
  add column if not exists progress int not null default 0;

alter table public.lists
  add column if not exists is_public boolean not null default true;

-- Faz a API do Supabase (PostgREST) enxergar as colunas novas imediatamente.
notify pgrst, 'reload schema';
