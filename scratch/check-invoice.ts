import fs from "fs";
import { processDocument } from "../src/lib/document-engine";
async function main() {
  const bufA = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const docA = await processDocument(bufA, "A.pdf", "application/pdf");
  const textA = docA.chunks.map((c: any) => c.text).join(" ");
  console.log("PDF Invoice:");
  textA.match(/.{0,50}invoice.{0,50}/gi)?.forEach((m: any) => console.log(m.replace(/\n/g, ' ')));
  
  const bufB = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt");
  const docB = await processDocument(bufB, "B.txt", "text/plain");
  const textB = docB.chunks.map((c: any) => c.text).join(" ");
  console.log("\nTXT Invoice:");
  textB.match(/.{0,50}invoice.{0,50}/gi)?.forEach((m: any) => console.log(m.replace(/\n/g, ' ')));
}
main().catch(console.error);
