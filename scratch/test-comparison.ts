import fs from "fs";
import path from "path";
import { processDocument } from "../src/lib/document-engine";
import { compareDocuments } from "../src/lib/comparison/comparison-service";

async function main() {
  const pdfPathA = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const txtPathB = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt");
  
  const bufferA = fs.readFileSync(pdfPathA);
  const bufferB = fs.readFileSync(txtPathB);
  
  const docA = await processDocument(bufferA, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "application/pdf");
  const docB = await processDocument(bufferB, "LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt", "text/plain");
  
  const result = await compareDocuments(docA, docB, { skipAi: true });
  
  console.log("Changes Identified:", result.metrics.changesIdentified);
  result.changes.forEach((c: any) => {
    console.log(`\n- [${c.changeSeverity}] ${c.clauseTitle} (${c.status})`);
    console.log(`  Diff A: ${c.diffHighlightA}`);
    console.log(`  Diff B: ${c.diffHighlightB}`);
    console.log(`  ID: ${c.id}`);
  });
}

main().catch(console.error);
