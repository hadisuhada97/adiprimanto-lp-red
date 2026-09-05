import { expect, test } from "@playwright/test";

test.describe("Admin panel", () => {
  test("dashboard loads for the signed in admin", async ({ page }) => {
    await page.goto("/admin/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-main")).toBeVisible();
  });

  test("trash page lists module filters", async ({ page }) => {
    await page.goto("/admin/trash", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("trash-module-filters")).toBeVisible();
    await expect(page.getByTestId("trash-filter-all")).toContainText("All modules");
  });

  test("localization page shows locales and translation coverage", async ({ page }) => {
    await page.goto("/admin/settings/localization", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("locale-row-id")).toContainText("Indonesian");
    await expect(page.getByTestId("locale-row-en")).toContainText("English");
    await expect(page.getByTestId("locale-coverage")).toBeVisible();
  });

  test("media library creates, renames and deletes a folder", async ({ page }) => {
    await page.goto("/admin/media", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("media-folder-list")).toBeVisible();

    const name = `E2E Folder ${Date.now()}`;
    await page.getByTestId("media-folder-create-button").click();
    await page.getByTestId("media-folder-name-input").fill(name);
    await page.getByTestId("media-folder-save-button").click();

    const folder = page.locator('[data-testid^="media-folder-filter-e2e-folder-"]').first();
    await expect(folder).toBeVisible();

    const slug = (await folder.getAttribute("data-testid"))!.replace("media-folder-filter-", "");
    await page.getByTestId(`media-folder-edit-button-${slug}`).click({ force: true });
    await page.getByTestId("media-folder-name-input").fill(`${name} renamed`);
    await page.getByTestId("media-folder-save-button").click();
    await page.waitForTimeout(1000);

    const renamed = page.locator('[data-testid^="media-folder-filter-e2e-folder-"]').first();
    const renamedSlug = (await renamed.getAttribute("data-testid"))!.replace("media-folder-filter-", "");
    await page.getByTestId(`media-folder-delete-button-${renamedSlug}`).click({ force: true });
    await page
      .getByTestId("media-folder-delete-dialog")
      .getByRole("button", { name: /delete folder/i })
      .click();
    await page.waitForTimeout(1000);

    await expect(page.locator(`[data-testid="media-folder-filter-${renamedSlug}"]`)).toHaveCount(0);
  });
});

test.describe("Role based access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("editor sees an access denied state on a gated page", async ({ page }) => {
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').waitFor({ state: "visible" });
    await page.locator('input[type="email"]').fill("editor.test@adiprimanto.com");
    await page.locator('input[type="password"]').fill("EditorTest#2026");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 30_000 });

    await page.goto("/admin/settings/localization", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("admin-access-denied")).toBeVisible();
  });
});
