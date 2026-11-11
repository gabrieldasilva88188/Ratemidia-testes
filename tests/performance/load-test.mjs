#!/usr/bin/env node
/**
 * Teste de performance do RateMedia (sem dependências: só Node 20+).
 *
 * Dispara requisições concorrentes contra as páginas principais e mede:
 *   - LATÊNCIA: mínimo, média, p50, p90, p95, p99 e máximo (ms)
 *   - VOLUME:   total de requisições e vazão (req/s)
 *   - ERROS:    respostas fora do status esperado, falhas de rede e timeouts
 *
 * Ao final compara com os limites (thresholds) e sai com código 1 se algum for
 * violado, para a CI barrar regressões de performance.
 *
 * Uso:
 *   npm run build && npm run start          # em outro terminal
 *   npm run test:perf                       # perfil "load"
 *   PERF_PROFILE=smoke npm run test:perf    # rápido (1 conexão)
 *   PERF_PROFILE=stress npm run test:perf   # 50 conexões
 *
 * Variáveis (todas opcionais):
 *   BASE_URL              http://localhost:3000
 *   PERF_PROFILE          smoke | load | stress            (padrão: load)
 *   PERF_DURATION         segundos de teste por perfil
 *   PERF_CONNECTIONS      requisições simultâneas
 *   PERF_P95_MS           limite de p95 em ms
 *   PERF_MAX_ERROR_RATE   taxa máxima de erros (0.01 = 1%)
 *   PERF_MIN_RPS          vazão mínima em req/s (0 = não verifica)
 *   PERF_TIMEOUT_MS       timeout de cada requisição       (padrão: 10000)
 *   PERF_ROUTES           rotas separadas por vírgula; use "rota|status" para
 *                         esperar outro status (ex.: "/nao-existe|404")
 *   PERF_REPORT           caminho do relatório JSON        (padrão: tests/performance/results/<perfil>.json)
 *   PERF_SKIP_WARMUP=1    pula o aquecimento
 */
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const PROFILES = {
  smoke: { duration: 10, connections: 1, p95: 800, maxErrorRate: 0, minRps: 0 },
  load: { duration: 30, connections: 10, p95: 1500, maxErrorRate: 0.01, minRps: 5 },
  stress: { duration: 30, connections: 50, p95: 4000, maxErrorRate: 0.05, minRps: 0 },
};

const DEFAULT_ROUTES = [
  "/",
  "/busca",
  "/busca?q=frieren",
  "/busca?tipo=anime&min=4&ordem=az",
  "/campanhas",
  "/login",
  "/rota-que-nao-existe|404",
];

const env = process.env;
const profileName = env.PERF_PROFILE ?? "load";
const profile = PROFILES[profileName];
if (!profile) {
  console.error(`Perfil desconhecido "${profileName}". Use: ${Object.keys(PROFILES).join(", ")}`);
  process.exit(2);
}

const num = (value, fallback) => (value === undefined || value === "" ? fallback : Number(value));
const config = {
  baseUrl: (env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  duration: num(env.PERF_DURATION, profile.duration),
  connections: num(env.PERF_CONNECTIONS, profile.connections),
  timeoutMs: num(env.PERF_TIMEOUT_MS, 10_000),
  thresholds: {
    p95: num(env.PERF_P95_MS, profile.p95),
    maxErrorRate: num(env.PERF_MAX_ERROR_RATE, profile.maxErrorRate),
    minRps: num(env.PERF_MIN_RPS, profile.minRps),
  },
  routes: (env.PERF_ROUTES ? env.PERF_ROUTES.split(",") : DEFAULT_ROUTES).map((r) => {
    const [route, status] = r.trim().split("|");
    return { route, expected: status ? Number(status) : null };
  }),
};

/** Faz uma requisição e mede o tempo até o corpo terminar de chegar. */
async function hit({ route, expected }) {
  const start = performance.now();
  try {
    const res = await fetch(config.baseUrl + route, {
      signal: AbortSignal.timeout(config.timeoutMs),
      headers: { "User-Agent": "ratemedia-load-test" },
    });
    const body = await res.arrayBuffer();
    const ms = performance.now() - start;
    const ok = expected ? res.status === expected : res.status < 400;
    return { route, ms, status: res.status, bytes: body.byteLength, error: ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    const ms = performance.now() - start;
    const timeout = e?.name === "TimeoutError" || e?.name === "AbortError";
    return { route, ms, status: 0, bytes: 0, error: timeout ? "timeout" : `rede: ${e?.cause?.code ?? e?.message ?? e}` };
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summarize(samples, seconds) {
  const lat = samples.map((s) => s.ms).sort((a, b) => a - b);
  const errors = samples.filter((s) => s.error);
  const round = (n) => Math.round(n * 10) / 10;
  return {
    requests: samples.length,
    rps: round(samples.length / seconds),
    errors: errors.length,
    errorRate: samples.length ? errors.length / samples.length : 0,
    bytes: samples.reduce((a, s) => a + s.bytes, 0),
    latency: {
      min: round(lat[0] ?? 0),
      avg: round(lat.reduce((a, b) => a + b, 0) / (lat.length || 1)),
      p50: round(percentile(lat, 50)),
      p90: round(percentile(lat, 90)),
      p95: round(percentile(lat, 95)),
      p99: round(percentile(lat, 99)),
      max: round(lat.at(-1) ?? 0),
    },
    errorTypes: errors.reduce((acc, s) => ((acc[s.error] = (acc[s.error] ?? 0) + 1), acc), {}),
  };
}

async function main() {
  console.log(`\n▶ RateMedia - teste de performance (${profileName})`);
  console.log(`  alvo: ${config.baseUrl} | ${config.connections} conexões | ${config.duration}s | ${config.routes.length} rotas\n`);

  // Aquecimento: a 1ª requisição de cada rota pode incluir compilação/cache.
  if (env.PERF_SKIP_WARMUP !== "1") {
    for (const r of config.routes) {
      const res = await hit(r);
      if (res.status === 0) {
        console.error(`✖ Servidor indisponível em ${config.baseUrl}${r.route} (${res.error}). Rode "npm run build && npm run start".`);
        process.exit(2);
      }
    }
  }

  const samples = [];
  const deadline = performance.now() + config.duration * 1000;
  let next = 0;
  const worker = async () => {
    while (performance.now() < deadline) {
      const route = config.routes[next++ % config.routes.length];
      samples.push(await hit(route));
    }
  };
  const started = performance.now();
  await Promise.all(Array.from({ length: config.connections }, worker));
  const seconds = (performance.now() - started) / 1000;

  const overall = summarize(samples, seconds);
  const byRoute = Object.fromEntries(
    config.routes.map(({ route }) => [route, summarize(samples.filter((s) => s.route === route), seconds)]),
  );

  console.table(
    Object.fromEntries(
      Object.entries(byRoute).map(([route, s]) => [
        route,
        { reqs: s.requests, "req/s": s.rps, "p50 ms": s.latency.p50, "p95 ms": s.latency.p95, "max ms": s.latency.max, erros: s.errors },
      ]),
    ),
  );

  const { thresholds } = config;
  const checks = [
    { name: `Latência p95 <= ${thresholds.p95} ms`, value: `${overall.latency.p95} ms`, pass: overall.latency.p95 <= thresholds.p95 },
    {
      name: `Taxa de erros <= ${(thresholds.maxErrorRate * 100).toFixed(1)}%`,
      value: `${(overall.errorRate * 100).toFixed(2)}% (${overall.errors}/${overall.requests})`,
      pass: overall.errorRate <= thresholds.maxErrorRate,
    },
    {
      name: thresholds.minRps > 0 ? `Vazão >= ${thresholds.minRps} req/s` : "Vazão (sem limite mínimo)",
      value: `${overall.rps} req/s`,
      pass: overall.rps >= thresholds.minRps,
    },
  ];

  console.log(`\nTotal: ${overall.requests} requisições em ${seconds.toFixed(1)}s`);
  console.log(
    `Latência (ms): min ${overall.latency.min} | média ${overall.latency.avg} | p50 ${overall.latency.p50} | p90 ${overall.latency.p90} | p95 ${overall.latency.p95} | p99 ${overall.latency.p99} | max ${overall.latency.max}`,
  );
  if (overall.errors) console.log("Erros:", overall.errorTypes);
  console.log("");
  for (const c of checks) console.log(`${c.pass ? "✔" : "✖"} ${c.name}: ${c.value}`);

  const passed = checks.every((c) => c.pass);
  const report = {
    profile: profileName,
    date: new Date().toISOString(),
    config,
    seconds: Math.round(seconds * 10) / 10,
    overall,
    byRoute,
    checks,
    passed,
  };
  const reportPath = env.PERF_REPORT ?? path.join("tests", "performance", "results", `${profileName}.json`);
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nRelatório: ${reportPath}`);

  // Resumo na aba "Summary" do GitHub Actions.
  if (env.GITHUB_STEP_SUMMARY) {
    const rows = Object.entries(byRoute)
      .map(([r, s]) => `| \`${r}\` | ${s.requests} | ${s.rps} | ${s.latency.p50} | ${s.latency.p95} | ${s.latency.max} | ${s.errors} |`)
      .join("\n");
    appendFileSync(
      env.GITHUB_STEP_SUMMARY,
      `### Performance (${profileName}) ${passed ? "✅" : "❌"}\n\n` +
        `${config.connections} conexões · ${config.duration}s · ${overall.requests} requisições · ${overall.rps} req/s\n\n` +
        `| Rota | Reqs | req/s | p50 ms | p95 ms | máx ms | Erros |\n|---|---|---|---|---|---|---|\n${rows}\n\n` +
        checks.map((c) => `- ${c.pass ? "✅" : "❌"} ${c.name}: **${c.value}**`).join("\n") +
        "\n\n",
    );
  }

  if (!passed) {
    console.error("\n✖ Limites de performance violados.");
    process.exit(1);
  }
  console.log("\n✔ Performance dentro dos limites.");
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
