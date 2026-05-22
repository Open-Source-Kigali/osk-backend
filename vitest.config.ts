import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Ensure Vitest ignores the compiled output in dist to avoid CommonJS require() errors
    exclude: ["**/node_modules/**", "**/dist/**"],
    env: {
      ADMIN_API_KEY: "test-admin-key",
      DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
      NODE_ENV: "test",
    include: ["src/**/*.test.ts"],
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/generated/**", "dist/**", "vitest.setup.ts"],
    },
    exclude: ["dist/**"],
  },
});
