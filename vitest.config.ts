import path from "node:path"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  // Playwright specs live in e2e/ and run via `yarn test:e2e`.
  test: { exclude: [...configDefaults.exclude, "e2e/**"] }
})
