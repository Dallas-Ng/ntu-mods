import { defineConfig } from "@playwright/test"

import { BASE_URL as baseURL } from "./e2e/lib/urls"

// Runs against `astro preview` of an existing build (yarn build) with a seeded
// local D1 (yarn db:seed-local) - dev is skipped on purpose, its HMR/React
// warnings would drown the console checks. Set E2E_BASE_URL to reuse a server.
const PORT = process.env.E2E_PORT || "4399"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  workers: process.env.CI ? "100%" : "90%",
  // No retries: the server is local and deterministic, so a retry only reruns
  // genuine failures.
  retries: 0,
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    launchOptions: {
      // Local escape hatch when the pinned Chromium is not installed.
      executablePath: process.env.E2E_CHROMIUM_PATH || undefined
    }
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "yarn preview",
        env: { PORT },
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000
      }
})
