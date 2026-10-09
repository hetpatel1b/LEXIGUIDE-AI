import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Cross-platform test file discovery and execution runner for LexiGuide AI.
 * 
 * Bypasses shell-dependent glob expansion (e.g. bash without globstar on Linux CI)
 * by discovering all *.test.ts files programmatically and passing them explicitly
 * to the Node.js native test runner via tsx.
 */

function findTestFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findTestFiles(fullPath));
      } else if (stat.isFile() && (entry.endsWith('.test.ts') || entry.endsWith('.test.js'))) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Failed to read directory: ${dir}`, err);
  }
  return results;
}

const testsDir = resolve(process.cwd(), 'tests');
const testFiles = findTestFiles(testsDir).sort();

console.log(`[TEST-RUNNER] Discovered ${testFiles.length} unit/integration test files in ${testsDir}`);

if (testFiles.length === 0) {
  console.error('[TEST-RUNNER] FATAL: Zero test files discovered! Check test file locations.');
  process.exit(1);
}

// Direct node execution using tsx CLI entrypoint
const tsxCli = resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs');

const child = spawn(
  process.execPath,
  [tsxCli, '--test', ...testFiles],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      GROQ_API_KEY: process.env.GROQ_API_KEY || 'mock_ci_test_key_for_deterministic_testing',
    },
  }
);

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`[TEST-RUNNER] Test run exited with code ${code}`);
    process.exit(code || 1);
  }
  console.log('[TEST-RUNNER] All test suites completed successfully.');
  process.exit(0);
});
