import { defineConfig, devices } from "@playwright/test";

// The preview pod ships Chrome instead of Playwright's bundled browsers.
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH ?? "/usr/bin/google-chrome";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["json", { outputFile: "../test_reports/playwright-e2e.json" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath, args: ["--no-sandbox"] },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "landing",
      testMatch: /landing\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/super-admin.json" },
    },
  ],
});
