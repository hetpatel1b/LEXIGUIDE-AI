import fs from "fs";
import { processDocument } from "../src/lib/document-engine";
async function main() {
  const buf = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const doc = await processDocument(buf, "test.pdf", "application/pdf");
  const text = doc.chunks.map((c: any) => c.text).join("\n");
  console.log("2.8M matches:", text.match(/2,800,000/g));
  console.log("2.4M matches:", text.match(/2,400,000/g));
  console.log("600k matches:", text.match(/600,000/g));
  console.log("750k matches:", text.match(/750,000/g));
}
main().catch(console.error);
