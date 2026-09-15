import fs from "fs";
import { processDocument } from "../src/lib/document-engine";
async function main() {
  const buf = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const doc = await processDocument(buf, "test.pdf", "application/pdf");
  const text = doc.chunks.map((c: any) => c.text).join("\n");
  console.log("Matches:");
  const matches = [...text.matchAll(/.{0,50}terminate.{0,50}/gi)];
  matches.forEach((m: any) => console.log(m[0].replace(/\n/g, ' ')));
}
main().catch(console.error);
