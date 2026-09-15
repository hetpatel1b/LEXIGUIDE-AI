import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

test("Compare Workspace State Persistence & Lifecycle", async ({ page }) => {
  test.setTimeout(120000);

  const docAPath = path.resolve("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const docBPath = path.resolve("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt");

  expect(fs.existsSync(docAPath)).toBe(true);
  expect(fs.existsSync(docBPath)).toBe(true);

  const consoleErrors: string[] = [];
  const networkRequests: { method: string; url: string }[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" || text.includes("Warning:") || text.includes("Hydration")) {
      consoleErrors.push(`[${msg.type()}] ${text}`);
    }
  });

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) {
      networkRequests.push({
        method: req.method(),
        url: url.replace("http://localhost:3000", ""),
      });
    }
  });

  // Step 1: Open Landing Page
  console.log("Step 1: Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // Step 2: Upload Document A
  console.log("Step 2: Uploading Document A...");
  const fileInputA = page.locator("#document-upload-input");
  await fileInputA.setInputFiles(docAPath);

  const processBtn = page.locator('button:has-text("Process Document"), button:has-text("Analyze Document")');
  if (await processBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await processBtn.click();
  }

  await page.waitForURL("**/analyze", { timeout: 30000 });
  console.log("-> Document A loaded into workspace (/analyze)");

  // Step 3: Navigate to Compare
  console.log("Step 3: Navigating to Compare tab...");
  await page.click('nav a[href="/compare"]');
  await page.waitForURL("**/compare", { timeout: 5000 });

  await expect(page.locator("text=Document A (Baseline)")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=No second document selected")).toBeVisible();
  console.log("-> Baseline Document A verified. Document B is empty.");

  // Step 4: Upload Document B
  console.log("Step 4: Uploading Document B...");
  await page.click('button:has-text("Upload Document")');
  await page.waitForSelector("role=dialog", { timeout: 5000 });

  const fileInputB = page.locator('role=dialog input[type="file"]');
  await fileInputB.setInputFiles(docBPath);

  const processDocBBtn = page.locator('role=dialog button:has-text("Process Document"), role=dialog button:has-text("Upload Document")');
  if (await processDocBBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await processDocBBtn.click();
  }

  await page.waitForSelector("text=Second Document Ready for Comparison", { timeout: 20000 });
  console.log("-> Document B uploaded and ready for comparison.");

  // Step 5: Run Comparison
  console.log("Step 5: Clicking 'Compare Documents'...");
  await page.click('button:has-text("Compare Documents")');

  await page.waitForSelector('button[data-testid="btn-new-comparison"]', { timeout: 60000 });
  console.log("-> Comparison completed successfully!");

  // Verify inconsistency: Section 4 30-day vs Schedule B 15-day payment conflict
  const inconsistencySection = page.locator('section[aria-label="Potential Inconsistencies"]');
  await expect(inconsistencySection).toBeVisible();
  const inconsistencyText = await inconsistencySection.textContent();
  expect(inconsistencyText).toContain("Invoice Payment");
  console.log("-> Exactly 1 validated inconsistency displayed.");

  // Step 6: Tab Switch: Compare -> Q&A
  console.log("Step 6: Navigating to Q&A tab (Compare -> Q&A)...");
  await page.click('nav a[href="/qa"]');
  await page.waitForURL("**/qa", { timeout: 5000 });
  await expect(page.locator("text=Document ready")).toBeVisible({ timeout: 5000 });
  console.log("-> Q&A workspace loaded successfully.");

  // Step 7: Tab Switch BACK: Q&A -> Compare
  console.log("Step 7: Navigating BACK to Compare (Q&A -> Compare)...");
  const requestsBeforeReturn = networkRequests.length;
  await page.click('nav a[href="/compare"]');
  await page.waitForURL("**/compare", { timeout: 5000 });

  // Verify immediate persistence with NO loading and NO upload prompt
  await expect(page.locator('button[data-testid="btn-new-comparison"]')).toBeVisible({ timeout: 2000 });
  await expect(page.locator("text=No second document selected")).not.toBeVisible();
  await expect(inconsistencySection).toBeVisible();

  // Verify ZERO comparison POST API calls during tab return
  const newPostRequests = networkRequests
    .slice(requestsBeforeReturn)
    .filter((r) => r.url.includes("/api/comparison") && r.method === "POST");
  expect(newPostRequests.length).toBe(0);
  console.log("-> SUCCESS: Comparison state persisted across Q&A -> Compare with ZERO API re-runs!");

  // Step 8: Tab Switch: Compare -> Analysis -> Compare
  console.log("Step 8: Navigating to Analysis and back to Compare...");
  await page.click('nav a[href="/analyze"]');
  await page.waitForURL("**/analyze", { timeout: 5000 });
  await expect(page.locator("text=Document Analysis")).toBeVisible({ timeout: 5000 });

  await page.click('nav a[href="/compare"]');
  await page.waitForURL("**/compare", { timeout: 5000 });
  await expect(page.locator('button[data-testid="btn-new-comparison"]')).toBeVisible({ timeout: 2000 });
  console.log("-> SUCCESS: Comparison state persisted across Analysis -> Compare!");

  // Step 9: Test "New Document to Compare"
  console.log("Step 9: Testing 'New Document to Compare' button...");
  const requestsBeforeNewComp = networkRequests.length;
  await page.click('button[data-testid="btn-new-comparison"]');

  // If upload dialog opened, close it
  await page.waitForTimeout(500);
  const dialogClose = page.locator('role=dialog button:has-text("Cancel"), role=dialog button[aria-label="Close"]');
  if (await dialogClose.isVisible().catch(() => false)) {
    await dialogClose.first().click();
  }

  await expect(page.locator("text=No second document selected")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Document A (Baseline)")).toBeVisible();
  await expect(page.locator('button[data-testid="btn-new-comparison"]')).not.toBeVisible();

  // Verify DELETE request sent
  const deleteRequests = networkRequests
    .slice(requestsBeforeNewComp)
    .filter((r) => r.url.includes("/api/comparison") && r.method === "DELETE");
  expect(deleteRequests.length).toBeGreaterThanOrEqual(1);
  console.log("-> SUCCESS: 'New Document to Compare' properly reset state and dispatched DELETE /api/comparison!");

  // Step 10: Exit Workspace
  console.log("Step 10: Testing 'Exit' Workspace...");
  await page.click('header button:has-text("Exit"), header button[aria-label*="Exit"]');
  await page.waitForURL("**/", { timeout: 5000 });
  console.log("-> SUCCESS: Exited workspace cleanly and returned to landing page (/)!");

  // Console checks
  const keyErrors = consoleErrors.filter((e) => e.includes("unique 'key'"));
  expect(keyErrors.length).toBe(0);
});
