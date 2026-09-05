// Lighthouse audit for the public landing page. Usage:
//   E2E_BASE_URL=https://<pod>.preview.emergentagent.com yarn audit:lighthouse
import fs from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const url = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const outputDir = process.env.LH_OUTPUT_DIR ?? "../test_reports";

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  chromePath: process.env.PLAYWRIGHT_CHROME_PATH ?? "/usr/bin/google-chrome",
});

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: ["json"],
    logLevel: "error",
    screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1 },
    formFactor: "desktop",
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
  });

  const categories = Object.fromEntries(
    Object.values(result.lhr.categories).map((category) => [
      category.id,
      Math.round((category.score ?? 0) * 100),
    ]),
  );

  fs.mkdirSync(path.resolve(outputDir), { recursive: true });
  fs.writeFileSync(path.resolve(outputDir, "lighthouse-landing.json"), result.report[0]);
  fs.writeFileSync(
    path.resolve(outputDir, "lighthouse-landing-summary.json"),
    JSON.stringify({ url, audited_at: new Date().toISOString(), scores: categories }, null, 2) + "\n",
  );

  console.table(categories);
} finally {
  await chrome.kill();
}
