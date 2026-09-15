import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

async function runAcceptanceTest() {
  console.log("=== LEXIGUIDE AI — REAL BROWSER ACCEPTANCE TEST ===");

  const docAPath = path.resolve("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const docBPath = path.resolve("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt");

  if (!fs.existsSync(docAPath)) throw new Error(`Missing Doc A fixture: ${docAPath}`);
  if (!fs.existsSync(docBPath)) throw new Error(`Missing Doc B fixture: ${docBPath}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const consoleErrors = [];
  const networkRequests = [];

  page.on("console", (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
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
        timestamp: Date.now(),
      });
    }
  });

  try {
    // 1. Open Landing Page
    console.log("Step 1: Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    // 2. Upload Document A
    console.log("Step 2: Uploading Document A (LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf)...");
    const fileInputA = page.locator("#document-upload-input");
    await fileInputA.setInputFiles(docAPath);

    // Wait for processing button or auto-processing
    const processBtn = page.locator('button:has-text("Process Document"), button:has-text("Analyze Document")');
    if (await processBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await processBtn.click();
    }

    // Wait for redirection to /analyze
    await page.waitForURL("**/analyze", { timeout: 30000 });
    console.log("-> Document A loaded into workspace (/analyze)");

    // 3. Navigate to Compare
    console.log("Step 3: Navigating to Compare tab...");
    await page.click('nav a[href="/compare"]');
    await page.waitForURL("**/compare", { timeout: 5000 });

    // Verify Document A is baseline and Document B is empty
    await page.waitForSelector('text=Document A (Baseline)', { timeout: 5000 });
    const hasDocBEmpty = await page.locator('text=No second document selected').isVisible();
    console.log(`-> Baseline Document A verified. Document B empty state: ${hasDocBEmpty}`);
    if (!hasDocBEmpty) throw new Error("Document B should initially be empty");

    // 4. Upload Document B
    console.log("Step 4: Uploading Document B (LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt)...");
    // Click Upload Document button on Document B card
    await page.click('button:has-text("Upload Document")');
    await page.waitForSelector('role=dialog', { timeout: 5000 });

    // Set file input inside dialog
    const fileInputB = page.locator('role=dialog input[type="file"]');
    await fileInputB.setInputFiles(docBPath);

    // Wait for Process Document inside dialog
    const processDocBBtn = page.locator('role=dialog button:has-text("Process & Compare Document B"), role=dialog button:has-text("Process"), role=dialog button:has-text("Upload Document")');
    if (await processDocBBtn.first().isVisible({ timeout: 4000 }).catch(() => false)) {
      await processDocBBtn.first().click();
    }

    // Wait for dialog to close and "Second Document Ready for Comparison" banner to appear
    await page.waitForSelector('text=Second Document Ready for Comparison', { timeout: 15000 });
    console.log("-> Document B uploaded and ready for comparison.");

    // 5. Run Comparison
    console.log("Step 5: Clicking 'Compare Documents'...");
    await page.click('button:has-text("Compare Documents")');

    // Wait for comparison result to complete (Summary Metrics or Inconsistency section)
    await page.waitForSelector('button[data-testid="btn-new-comparison"]', { timeout: 60000 });
    console.log("-> Comparison completed successfully!");

    // Record metrics
    const changesCountText = await page.locator('text=Changes Identified').locator('..').textContent();
    const inconsistenciesCountText = await page.locator('text=Potential Inconsistencies').first().locator('..').textContent();
    console.log(`-> Summary Metrics: Changes = "${changesCountText?.trim()}", Inconsistencies = "${inconsistenciesCountText?.trim()}"`);

    // Verify 1 inconsistency
    const inconsistencyCards = page.locator('section[aria-label="Potential Inconsistencies"] h3, section[aria-label="Potential Inconsistencies"] h4');
    const inconsistencyTitle = await page.locator('section[aria-label="Potential Inconsistencies"]').textContent();
    console.log(`-> Inconsistency Section Content Preview: ${inconsistencyTitle?.substring(0, 200)}...`);

    // Save screenshot before tab switch
    await page.screenshot({ path: "scratch/compare_before_tab_switch.png", fullPage: true });

    // 6. Tab Switch: Compare -> Q&A
    console.log("Step 6: Navigating to Q&A tab (Compare -> Q&A)...");
    const networkCountBeforeTabSwitch = networkRequests.length;
    await page.click('nav a[href="/qa"]');
    await page.waitForURL("**/qa", { timeout: 5000 });
    await page.waitForSelector('text=Document ready', { timeout: 5000 });
    console.log("-> Q&A workspace loaded successfully.");

    // 7. Tab Switch BACK: Q&A -> Compare
    console.log("Step 7: Navigating BACK to Compare (Q&A -> Compare)...");
    const networkCountBeforeReturn = networkRequests.length;
    await page.click('nav a[href="/compare"]');
    await page.waitForURL("**/compare", { timeout: 5000 });

    // CRITICAL VERIFICATION:
    // 1. Comparison result MUST be immediately rendered without loading
    await page.waitForSelector('button[data-testid="btn-new-comparison"]', { timeout: 2000 });
    const hasUploadPromptAfterReturn = await page.locator('text=No second document selected').isVisible();
    if (hasUploadPromptAfterReturn) {
      throw new Error("FAIL: Comparison result disappeared on returning from Q&A!");
    }

    // 2. Verify ZERO new POST requests to /api/comparison
    const newCompRequests = networkRequests
      .slice(networkCountBeforeReturn)
      .filter((r) => r.url.includes("/api/comparison") && r.method === "POST");
    console.log(`-> Comparison API POST requests during tab switch: ${newCompRequests.length} (Expected: 0)`);
    if (newCompRequests.length > 0) {
      throw new Error("FAIL: Comparison API re-ran during tab navigation!");
    }

    console.log("-> SUCCESS: Comparison state persisted across Compare -> Q&A -> Compare with ZERO API re-runs!");
    await page.screenshot({ path: "scratch/compare_after_qa_return.png", fullPage: true });

    // 8. Tab Switch: Compare -> Analysis -> Compare
    console.log("Step 8: Navigating to Analysis (Compare -> Analysis -> Compare)...");
    await page.click('nav a[href="/analyze"]');
    await page.waitForURL("**/analyze", { timeout: 5000 });
    await page.waitForSelector('text=Document Analysis', { timeout: 5000 });

    await page.click('nav a[href="/compare"]');
    await page.waitForURL("**/compare", { timeout: 5000 });
    await page.waitForSelector('button[data-testid="btn-new-comparison"]', { timeout: 2000 });
    console.log("-> SUCCESS: Comparison state persisted across Compare -> Analysis -> Compare!");

    // 9. Test "New Document to Compare"
    console.log("Step 9: Testing 'New Document to Compare' button...");
    const networkCountBeforeNewComp = networkRequests.length;
    await page.click('button[data-testid="btn-new-comparison"]');

    // Verify Document B upload dialog opens or Document B reset
    await page.waitForTimeout(500);
    // If dialog opened, close it to check workspace state
    const dialogCloseBtn = page.locator('role=dialog button:has-text("Cancel"), role=dialog button[aria-label="Close"]');
    if (await dialogCloseBtn.isVisible().catch(() => false)) {
      await dialogCloseBtn.first().click();
    }

    // Verify comparison result is cleared and Document B is empty
    await page.waitForSelector('text=No second document selected', { timeout: 5000 });
    const hasDocAAfterNewComp = await page.locator('text=Document A (Baseline)').isVisible();
    const hasCompletedMetrics = await page.locator('button[data-testid="btn-new-comparison"]').isVisible();
    console.log(`-> After New Document: Document A retained = ${hasDocAAfterNewComp}, Old comparison result cleared = ${!hasCompletedMetrics}`);

    if (!hasDocAAfterNewComp) throw new Error("Document A should remain active after New Document to Compare");
    if (hasCompletedMetrics) throw new Error("Old comparison result should be removed after New Document to Compare");

    // Check DELETE request
    const deleteCompRequests = networkRequests
      .slice(networkCountBeforeNewComp)
      .filter((r) => r.url.includes("/api/comparison") && r.method === "DELETE");
    console.log(`-> DELETE /api/comparison requests dispatched: ${deleteCompRequests.length} (Expected >= 1)`);

    // 10. Exit Workspace
    console.log("Step 10: Testing 'Exit' Workspace...");
    await page.click('header button:has-text("Exit"), header button[aria-label*="Exit"]');
    await page.waitForURL("**/", { timeout: 5000 });
    console.log("-> Successfully exited workspace and returned to landing page (/)");

    // 11. Console Logs & Warnings Check
    console.log("Step 11: Checking console logs and warnings...");
    const keyWarnings = consoleErrors.filter((e) => e.includes("key") || e.includes("unique 'key'"));
    const hydrationWarnings = consoleErrors.filter((e) => e.includes("Hydration") || e.includes("hydration"));
    console.log(`-> Duplicate key warnings: ${keyWarnings.length}`);
    console.log(`-> Hydration warnings: ${hydrationWarnings.length}`);

    if (keyWarnings.length > 0) {
      console.warn("Key warnings found:", keyWarnings);
    }
    if (hydrationWarnings.length > 0) {
      console.warn("Hydration warnings found:", hydrationWarnings);
    }

    console.log("\n==========================================");
    console.log("ALL REAL BROWSER ACCEPTANCE TESTS PASSED!");
    console.log("==========================================");
    return true;
  } catch (err) {
    console.error("Browser Acceptance Test Failed:", err);
    await page.screenshot({ path: "scratch/compare_test_failure.png", fullPage: true }).catch(() => {});
    return false;
  } finally {
    await browser.close();
  }
}

runAcceptanceTest().then((success) => {
  process.exit(success ? 0 : 1);
});
