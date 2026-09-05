import { expect, test } from "@playwright/test";

const SECTIONS = [
  "home",
  "about",
  "techstack",
  "services",
  "portfolio",
  "process",
  "testimoni",
  "faq",
  "contact",
];

test.describe("Landing page (CMS driven)", () => {
  test("renders every section with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toBeVisible();

    for (const id of SECTIONS) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }

    expect(errors, `console errors: ${errors.join(" | ")}`).toHaveLength(0);
  });

  test("theme toggle switches between dark and light", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.getByTestId("navbar-theme-toggle").click();
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => document.documentElement.dataset.theme);

    expect(after).not.toBe(before);
  });

  test("language toggle loads the other locale copy", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const before = (await page.locator("h1").innerText()).trim();
    await page.getByTestId("navbar-language-toggle").click();
    await page.waitForTimeout(1500);
    const after = (await page.locator("h1").innerText()).trim();

    expect(after).not.toBe(before);
  });

  test("contact form stores a lead", async ({ page }) => {
    await page.goto("/#contact", { waitUntil: "networkidle" });

    const stamp = Date.now();
    await page.getByTestId("contact-name-input").fill(`E2E Lead ${stamp}`);
    await page.getByTestId("contact-email-input").fill(`e2e+${stamp}@example.com`);
    await page.getByTestId("contact-message-input").fill("Automated end-to-end check, please ignore.");

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/public/contact-messages")),
      page.getByTestId("contact-submit-button").click(),
    ]);

    expect(response.status()).toBeLessThan(400);
    await expect(page.getByTestId("contact-success")).toBeVisible();
  });
});
