import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Ensure Vitest ignores the compiled output in dist to avoid CommonJS require() errors
    exclude: ["**/node_modules/**", "**/dist/**"],
    env: {
      ADMIN_API_KEY: "test-admin-key",
      DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
      NODE_ENV: "test",
    },
  },
});
