import fs from "fs";
import path from "path";

/**
 * LexiGuide AI — Client Bundle Secret Scanner
 * Inspects compiled production assets in .next/static/ to guarantee that
 * server-only secrets (e.g. GROQ_API_KEY, private keys, authorization headers)
 * are never leaked into client browser bundles.
 */

const STATIC_DIR = path.resolve(process.cwd(), ".next/static");

// Patterns that MUST NEVER appear in client-facing browser bundles
const FORBIDDEN_PATTERNS = [
  { name: "Groq API Key Pattern", regex: /\bgsk_[a-zA-Z0-9]{20,}\b/ },
  { name: "Server GROQ_API_KEY identifier", regex: /process\.env\.GROQ_API_KEY\b/ },
  { name: "Generic Secret Key Assignment", regex: /GROQ_API_KEY\s*[:=]\s*["'][^"']+["']/i },
  { name: "Private Key Header", regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----/ },
  { name: "Authorization Bearer with Secret", regex: /Authorization:\s*["']Bearer\s+gsk_[^"']+["']/i },
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }

  return arrayOfFiles;
}

function scanBundles() {
  console.log("================================================================================");
  console.log("LEXIGUIDE AI — CLIENT BUNDLE SECRET PROTECTION SCANNER");
  console.log("Target Directory: .next/static");
  console.log("================================================================================\n");

  if (!fs.existsSync(STATIC_DIR)) {
    console.error("ERROR: .next/static directory not found.");
    console.error("Please run 'npm run build' before executing the client bundle secret scan.");
    process.exit(1);
  }

  const staticFiles = getAllFiles(STATIC_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === ".js" || ext === ".css" || ext === ".html" || ext === ".json";
  });

  console.log(`Found ${staticFiles.length} client-facing assets to scan in .next/static/...\n`);

  let violationsFound = 0;
  const inspectedSummary = [];

  for (const filePath of staticFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, "utf8");

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(content)) {
        violationsFound++;
        console.error(`❌ SECURITY VIOLATION in ${relativePath}:`);
        console.error(`   Detected forbidden pattern: ${pattern.name}`);
        console.error(`   Server-only credentials or configurations must NEVER be leaked to browser bundles!\n`);
      }
    }

    inspectedSummary.push(relativePath);
  }

  console.log("--------------------------------------------------------------------------------");
  if (violationsFound === 0) {
    console.log(`✅ SCAN PASSED: All ${staticFiles.length} client assets verified.`);
    console.log("   No server-only secrets, GROQ_API_KEY patterns, or private keys detected in browser bundles.");
    console.log("================================================================================\n");
    process.exit(0);
  } else {
    console.error(`🚨 SCAN FAILED: Detected ${violationsFound} forbidden pattern(s) in client bundles.`);
    console.error("   Review the output above and ensure server secrets are strictly scoped to server components/APIs.");
    console.log("================================================================================\n");
    process.exit(1);
  }
}

scanBundles();
