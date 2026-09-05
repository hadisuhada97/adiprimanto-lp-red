import { expect, test as setup } from "@playwright/test";

const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "shell.test@adiprimanto.com";
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ShellTester#2026";

// Signing in once keeps the run under the 5 logins/minute API throttle.
setup("authenticate as super admin", async ({ page }) => {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').waitFor({ state: "visible" });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30_000 });

  await expect(page.getByTestId("admin-main")).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/super-admin.json" });
});
