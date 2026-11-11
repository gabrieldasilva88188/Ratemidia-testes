import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

// Config base. Os projetos de teste ficam em vitest.workspace.ts.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "tests/e2e/**"],
  },
});
