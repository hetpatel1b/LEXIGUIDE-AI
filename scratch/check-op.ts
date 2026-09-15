import fs from "fs";
import { processDocument } from "../src/lib/document-engine";
async function main() {
  const bufA = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const docA = await processDocument(bufA, "A.pdf", "application/pdf");
  const textA = docA.chunks.find((c: any) => c.text.includes("OPERATIONAL EXAMPLES"))?.text;
  console.log("TextA:", textA);
}
main().catch(console.error);
