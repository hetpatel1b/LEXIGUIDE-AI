import fs from "fs";
import { processDocument } from "../src/lib/document-engine";
async function main() {
  const buf = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const doc = await processDocument(buf, "test.pdf", "application/pdf");
  const text = doc.chunks.map((c: any) => c.text).join("\n");
  console.log("Invoice payment:", text.match(/invoices shall be paid within[^.]+/i)?.[0]);
  console.log("Termination notice:", text.match(/terminate employment by giving[^.]+/i)?.[0]);
  console.log("Retention award:", text.match(/retention award\s*of\s*[^\s,]+/i)?.[0]);
  console.log("Confidentiality:", text.match(/Confidentiality obligations survive for[^.]+/i)?.[0]);
}
main().catch(console.error);
