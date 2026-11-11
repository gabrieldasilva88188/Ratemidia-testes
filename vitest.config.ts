import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Config base. Os projetos de teste ficam em vitest.workspace.ts.
// Os testes E2E (tests/e2e) rodam com o Playwright, não com o Vitest.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "tests/e2e/**"],
  },
});
