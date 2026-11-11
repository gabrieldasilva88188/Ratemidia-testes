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
| `npm test` | Testes (Vitest) |

## CI/CD

- `.github/workflows/ci.yml`: instala dependências, lint, typecheck, testes e build a cada push/PR.
- Deploy: importe o repositório na Vercel e defina as variáveis de ambiente. Cada PR gera um preview; `main` publica em produção.

## Segurança

- Credenciais apenas em variáveis de ambiente (`.env.local` fora do Git; use `.env.example` como modelo).
- Permissões garantidas por RLS no Supabase; ações de admin revalidadas no servidor.

## Próximos passos

- Itens de lista (adicionar obras às listas)
- Testes E2E e monitoramento
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
