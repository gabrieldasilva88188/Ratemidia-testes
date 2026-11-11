# RateMedia

Aplicação web no estilo Letterboxd para rastrear, avaliar e resenhar **animes, mangás, séries e filmes**, com um diferencial: **campanhas de RPG** criadas e avaliadas pela comunidade.

Projeto final da disciplina de DevOps (Fatec). Sem Docker nesta fase: foco em desenvolvimento local simples e deploy direto na Vercel.

## Stack

- Next.js 15 (App Router, Server Actions) + React 19
- Tailwind CSS
- Supabase (PostgreSQL + Auth e-mail/senha + RLS)
- APIs externas: Jikan (animes/mangás) e TMDB (filmes/séries)
- CI: GitHub Actions · Deploy: Vercel

## Estrutura

```
src/
  app/
    (site)/            site público (Navbar + Footer)
      (auth)/          login, cadastro e Server Actions de autenticação
      (app)/busca/     busca avançada: filtros, ordenação, paginação
      (app)/listas/    perfil + minhas listas (e /listas/[id])
      (app)/minha-biblioteca/
      obras/[id]/      detalhe da obra: status, progresso, nota e críticas
      campanhas/       listagem, criação e detalhe com avaliações
    (admin)/admin/     painel admin com layout próprio (sidebar):
                       visão geral, catálogo (CRUD), moderação, usuários
  components/          Navbar, busca/, perfil/, admin/, home/ ...
  lib/                 supabase/, external/, search.ts, format.ts, data.ts
  middleware.ts        renova sessão e protege rotas privadas
supabase/
  schema.sql                                  tabelas, enums, triggers e RLS
  migrations/002_telas_busca_perfil_admin.sql gêneros, status editorial, perfil, RLS admin
tests/
  unit/                testes unitários (regras puras: busca, formatação, constantes...)
  integration/         Server Actions, middleware e data.ts com Supabase simulado
  e2e/                 fluxos do usuário no navegador (Playwright)
  performance/         teste de carga: latência, volume e erros
  helpers/             dublê do client Supabase e utilitários
```

## Rodando localmente

1. `npm install`
2. Crie um projeto no [Supabase](https://supabase.com) e execute `supabase/schema.sql` e, em seguida, `supabase/migrations/002_telas_busca_perfil_admin.sql` no SQL Editor.
3. `cp .env.example .env.local` e preencha as variáveis (URL e anon key do Supabase; TMDB opcional — veja `.env.example`).
4. `npm run dev` e acesse http://localhost:3000.

### Tornar um usuário administrador

Crie uma conta e, no SQL Editor:

```sql
update profiles set role = 'admin' where username = 'seu_usuario';
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Todos os testes do Vitest (unitários + integração) |
| `npm run test:unit` | Só os testes unitários |
| `npm run test:integration` | Só os testes de integração |
| `npm run test:watch` | Vitest em modo observação |
| `npm run test:e2e` | Testes E2E no navegador (Playwright) |
| `npm run test:perf` | Teste de performance (servidor precisa estar no ar) |

## Testes automatizados

| Tipo | Ferramenta | Onde | O que valida |
| --- | --- | --- | --- |
| Unitários | Vitest | `src/**/*.test.ts`, `tests/unit/` | Funções e regras de negócio isoladas: filtros, ordenação e paginação da busca, `timeAgo`, rótulos por tipo de mídia, média de notas, permissão de campanha, cliente HTTP das APIs externas |
| Integração | Vitest | `tests/integration/` | Comunicação entre camadas: Server Actions ↔ Supabase (simulado) ↔ cache/redirect do Next, middleware ↔ sessão, painel admin ↔ AniList/TMDB ↔ catálogo, catálogo demo ↔ busca |
| E2E | Playwright | `tests/e2e/` | Fluxos do usuário no navegador: home, busca pela barra do topo, filtros, ordenação, paginação, login/cadastro, campanhas, 404 |
| Performance | Script Node (sem dependências) | `tests/performance/` | Latência (p50/p95/p99), volume (req/s) e taxa de erros sob carga, com limites que reprovam a CI |

```bash
# Unitários + integração (não precisam de Supabase nem de rede)
npm test

# E2E: build em modo demonstração (sem as variáveis do Supabase) e depois os testes
npx playwright install chromium   # só na primeira vez
npm run build
npm run test:e2e                  # sobe o servidor sozinho; relatório em playwright-report/

# Performance: com o servidor de produção rodando em outro terminal (npm run start)
npm run test:perf                       # perfil "load": 10 conexões por 30 s
PERF_PROFILE=smoke npm run test:perf    # 1 conexão por 10 s
PERF_PROFILE=stress npm run test:perf   # 50 conexões por 30 s
```

Os testes de integração usam um dublê do client Supabase (`tests/helpers/supabase.ts`) que registra as consultas enviadas ao banco; só o banco e a rede são simulados, o restante do código roda de verdade.

> **Por que E2E e performance usam o modo demonstração?** Sem `NEXT_PUBLIC_SUPABASE_*` no build, o app usa o catálogo de demonstração: os dados são sempre os mesmos (testes previsíveis) e nenhum banco real é alterado. Se o seu `.env.local` tiver as chaves do Supabase, renomeie-o temporariamente antes do `npm run build` para rodar os E2E localmente. Para testar um servidor já publicado (ex.: preview da Vercel), use `E2E_BASE_URL=https://... npm run test:e2e`.

Limites do teste de performance (configuráveis por variável de ambiente, veja o cabeçalho de `tests/performance/load-test.mjs`):

| Perfil | Conexões | Duração | p95 máximo | Erros máximos | Vazão mínima |
| --- | --- | --- | --- | --- | --- |
| smoke | 1 | 10 s | 800 ms | 0% | — |
| load | 10 | 30 s | 1500 ms | 1% | 5 req/s |
| stress | 50 | 30 s | 4000 ms | 5% | — |

## CI/CD

- `.github/workflows/ci.yml`, a cada push/PR:
  1. **build-and-test**: lint, typecheck, testes unitários, testes de integração e build.
  2. **e2e** (depois do 1): instala o Chromium, faz o build em modo demonstração e roda o Playwright; o relatório HTML fica nos *artifacts* da execução.
  3. **performance** (depois do 1, em paralelo com o 2): sobe o servidor de produção e roda os perfis *smoke* e *load*; o resumo aparece na aba *Summary* e o JSON nos *artifacts*.
- Deploy: importe o repositório na Vercel e defina as variáveis de ambiente. Cada PR gera um preview; `main` publica em produção.

## Segurança

- Credenciais apenas em variáveis de ambiente (`.env.local` fora do Git; use `.env.example` como modelo).
- Permissões garantidas por RLS no Supabase; ações de admin revalidadas no servidor.

## Próximos passos

- Itens de lista (adicionar obras às listas)
- Monitoramento em produção (logs/erros e métricas da Vercel)
- Testes de RLS contra um Supabase local (`supabase start`)
- Adicionar obras às listas (botão na página da obra)
- Trocar os ícones por SVGs exportados do Figma e usar as capas reais

## Docker

A aplicacao usa Next.js para a interface e o servidor (App Router e Server Actions), entao roda em um unico servico/container. O Supabase continua externo. As paginas com dados de demonstracao podem ser vistas sem acesso a conta Supabase.

Requisitos: Docker Desktop com Docker Compose v2.

1. Copie `.env.example` para `.env.local`. Se tiver acesso ao Supabase, preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. TMDB e opcional. Nunca coloque chaves `service_role` nesse arquivo.
2. Com `.env.local` configurado, construa e inicie com `docker compose --env-file .env.local up --build`. Sem credenciais Supabase, execute `docker compose up --build`.
3. Acesse http://localhost:3000. Para encerrar, use `Ctrl+C`. Para executar em segundo plano, acrescente `-d`; para parar e remover o container, use `docker compose down`.

A porta padrao e `3000`; para alterar a porta no host, defina `PORT` antes de executar o Compose (por exemplo, `$env:PORT=3001; docker compose --env-file .env.local up --build` no PowerShell). O container continua ouvindo na porta `3000`.

As variaveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` entram no bundle do navegador durante o build. Para altera-las, reconstrua a imagem. Variaveis somente de servidor, como `TMDB_API_READ_TOKEN` e `TMDB_API_KEY`, sao carregadas pelo Compose com `--env-file .env.local`; aplique alteracoes recriando o servico com `docker compose --env-file .env.local up -d`.

O Dockerfile usa build multi-stage e a imagem final roda com usuario sem privilegios. `.dockerignore` exclui dependencias, artefatos e arquivos de ambiente do contexto. O Compose inclui uma verificacao HTTP de saude para facilitar a demonstracao.
