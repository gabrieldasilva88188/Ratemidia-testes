import { defineWorkspace } from "vitest/config";

// npm run test:unit -> projeto "unit" (npm test roda todos os projetos)
export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      name: "unit",
      include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    },
  },
]);
