import { vi } from "vitest";

/**
 * Dublê (fake) do client Supabase usado nos testes de integração.
 *
 * Simula a API encadeável do PostgREST (`from().select().eq()...`) e registra
 * cada chamada, para que o teste possa verificar *o que* a camada de servidor
 * enviou ao banco sem precisar de um projeto Supabase real.
 */

export interface Op {
  method: string;
  args: unknown[];
}

export interface QueryCall {
  table: string;
  ops: Op[];
}

export interface QueryResult {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

export type Responder = (query: QueryCall) => QueryResult | undefined;

export type FakeUser = { id: string; email?: string } | null;

const CHAIN_METHODS = [
  "select",
  "insert",
  "upsert",
  "update",
  "delete",
  "eq",
  "neq",
  "in",
  "is",
  "not",
  "or",
  "ilike",
  "gte",
  "lte",
  "order",
  "limit",
  "range",
] as const;

export function createSupabaseMock(options: { user?: FakeUser; respond?: Responder } = {}) {
  const calls: QueryCall[] = [];
  let user: FakeUser = options.user ?? null;
  let respond: Responder = options.respond ?? (() => undefined);

  const resolve = (query: QueryCall) => {
    const r = respond(query) ?? {};
    return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  };

  function from(table: string) {
    const query: QueryCall = { table, ops: [] };
    calls.push(query);
    const builder: Record<string, unknown> = {};
    for (const method of CHAIN_METHODS) {
      builder[method] = (...args: unknown[]) => {
        query.ops.push({ method, args });
        return builder;
      };
    }
    builder.single = () => {
      query.ops.push({ method: "single", args: [] });
      return Promise.resolve(resolve(query));
    };
    builder.maybeSingle = () => {
      query.ops.push({ method: "maybeSingle", args: [] });
      return Promise.resolve(resolve(query));
    };
    // `await supabase.from(...).delete().eq(...)` resolve o próprio builder.
    builder.then = (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(resolve(query)).then(onFulfilled, onRejected);
    return builder;
  }

  const auth = {
    getUser: vi.fn(async () => ({ data: { user }, error: null })),
    signInWithPassword: vi.fn(async (_credentials: unknown) => ({ data: {}, error: null as { message: string } | null })),
    signUp: vi.fn(async (_payload: unknown) => ({ data: {}, error: null as { message: string } | null })),
    signOut: vi.fn(async () => ({ error: null })),
  };

  const client = { from: vi.fn(from), auth };

  return {
    client,
    calls,
    setUser(next: FakeUser) {
      user = next;
    },
    setResponder(next: Responder) {
      respond = next;
    },
    /** Consultas feitas a uma tabela, opcionalmente filtradas por um método (insert, update...). */
    queries(table: string, method?: string) {
      return calls.filter((c) => c.table === table && (!method || c.ops.some((o) => o.method === method)));
    },
  };
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;

/** Argumentos da primeira chamada de `method` na consulta. */
export function argsOf(query: QueryCall | undefined, method: string): unknown[] | undefined {
  return query?.ops.find((o) => o.method === method)?.args;
}

/** Todos os filtros `.eq(coluna, valor)` da consulta, como objeto. */
export function eqFilters(query: QueryCall | undefined): Record<string, unknown> {
  return Object.fromEntries((query?.ops ?? []).filter((o) => o.method === "eq").map((o) => [o.args[0], o.args[1]]));
}

/** Monta um FormData a partir de um objeto simples. */
export function form(fields: Record<string, string | undefined>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.append(k, v);
  return fd;
}
