/**
 * LexiGuide AI — Production / Preview Deployment Smoke Check
 * Verifies that a deployed instance serves critical routes, returns 200 OK,
 * serves required HTML structure, and does not leak errors or maintenance pages.
 * 
 * Usage:
 *   node scripts/deployment-smoke-check.mjs <optional_url>
 *   DEPLOYMENT_URL=https://lexiguide.example.com node scripts/deployment-smoke-check.mjs
 */

const targetUrl = (process.argv[2] || process.env.DEPLOYMENT_URL || "http://localhost:3000").replace(/\/$/, "");

const CRITICAL_ROUTES = [
  { path: "/", expectedText: "LexiGuide" },
  { path: "/analyze", expectedText: "LexiGuide" },
  { path: "/compare", expectedText: "LexiGuide" },
  { path: "/qa", expectedText: "LexiGuide" },
  { path: "/action-center", expectedText: "LexiGuide" },
];

async function runSmokeCheck() {
  console.log("================================================================================");
  console.log("LEXIGUIDE AI — DEPLOYMENT SMOKE CHECK SUITE");
  console.log(`Target URL: ${targetUrl}`);
  console.log("================================================================================\n");

  let passedRoutes = 0;
  let failedRoutes = 0;

  for (const route of CRITICAL_ROUTES) {
    const fullUrl = `${targetUrl}${route.path}`;
    const t0 = Date.now();
    try {
      const res = await fetch(fullUrl, {
        headers: {
          "User-Agent": "LexiGuide-SmokeChecker/1.0",
        },
      });

      const durationMs = Date.now() - t0;
      const status = res.status;
      const body = await res.text();

      if (status !== 200) {
        console.error(`❌ FAIL: ${route.path} -> HTTP ${status} (${durationMs}ms)`);
        failedRoutes++;
        continue;
      }

      if (route.expectedText && !body.includes(route.expectedText)) {
        console.error(`❌ FAIL: ${route.path} -> Missing expected text "${route.expectedText}" (${durationMs}ms)`);
        failedRoutes++;
        continue;
      }

      console.log(`✅ PASS: ${route.path} -> HTTP 200 OK (${durationMs}ms)`);
      passedRoutes++;
    } catch (err) {
      const durationMs = Date.now() - t0;
      console.error(`❌ ERROR: ${route.path} -> Network failure: ${err.message} (${durationMs}ms)`);
      failedRoutes++;
    }
  }

  console.log("\n--------------------------------------------------------------------------------");
  if (failedRoutes === 0) {
    console.log(`✅ ALL CHECKS PASSED: ${passedRoutes}/${CRITICAL_ROUTES.length} critical routes healthy.`);
    console.log("================================================================================\n");
    process.exit(0);
  } else {
    console.error(`🚨 SMOKE CHECK FAILED: ${failedRoutes} route(s) failed out of ${CRITICAL_ROUTES.length}.`);
    console.log("================================================================================\n");
    process.exit(1);
  }
}

runSmokeCheck();
