import { defineWorkspace } from "vitest/config";

// npm run test:unit         -> só o projeto "unit"
// npm run test:integration  -> só o projeto "integration"
// npm test                  -> os dois
export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      name: "unit",
      include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      name: "integration",
      include: ["tests/integration/**/*.test.ts"],
    },
  },
]);
