import { defineConfig, devices } from "@playwright/test";

/**
 * Testes E2E (ponta a ponta) com Playwright.
 *
 * Rodam contra o app em modo demonstração (build SEM as variáveis do Supabase),
 * para que os dados sejam previsíveis e nenhum banco real seja alterado.
 * Por padrão o Playwright sobe o servidor de produção (`npm run start`);
 * rode `npm run build` antes. Para testar um servidor já no ar (ex.: preview
 * da Vercel), defina E2E_BASE_URL.
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "pt-BR",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
