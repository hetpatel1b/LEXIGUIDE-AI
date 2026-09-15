import fs from "fs";
import { processDocument } from "../src/lib/document-engine";
async function main() {
  const bufA = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const docA = await processDocument(bufA, "A.pdf", "application/pdf");
  const textA = docA.chunks.map((c: any) => c.text).join(" ");
  console.log("30 matches:");
  textA.match(/.{0,50}30.{0,50}/gi)?.forEach((m: any) => console.log(m.replace(/\n/g, " ")));
}
main().catch(console.error);
