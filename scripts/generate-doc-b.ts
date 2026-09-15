import fs from "fs";
import path from "path";
import { processDocument } from "../src/lib/document-engine/pipeline";

async function generateDocB() {
  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf");
  const fileBuffer = fs.readFileSync(pdfPath);
  const docA = await processDocument(fileBuffer, "LexiGuide_AI_Comprehensive_Legal_Test_Contract.pdf", "application/pdf");

  // Reconstruct document text section by section
  const sectionsText: string[] = [];

  for (const sec of docA.sections) {
    // Skip removed section
    if (sec.title.includes("OPERATIONAL EXAMPLES")) {
      continue;
    }

    const secChunks = docA.chunks.filter(c => c.sectionId === sec.sectionId);
    let fullSecText = secChunks.map(c => c.text).join("\n\n");

    // Apply controlled revisions
    if (fullSecText.includes("2,400,000")) {
      fullSecText = fullSecText.replace(/2,400,000/g, "2,800,000");
    }
    if (fullSecText.includes("30 days")) {
      fullSecText = fullSecText.replace(/30 days/g, "90 days");
    }
    if (fullSecText.includes("thirty (30) days")) {
      fullSecText = fullSecText.replace(/thirty \(30\) days/g, "ninety (90) days");
    }
    if (fullSecText.includes("Mumbai")) {
      fullSecText = fullSecText.replace(/Mumbai/g, "Bengaluru");
    }
    if (fullSecText.includes("five (5) years")) {
      fullSecText = fullSecText.replace(/five \(5\) years/g, "three (3) years");
    }
    if (fullSecText.includes("5 years")) {
      fullSecText = fullSecText.replace(/5 years/g, "3 years");
    }

    // Ensure 30-day invoice vs 15-day schedule inconsistency
    if (sec.title.toLowerCase().includes("compensation") || sec.title.toLowerCase().includes("payment")) {
      if (!fullSecText.includes("thirty (30) days") && !fullSecText.includes("30 days")) {
        fullSecText += "\n\nAll undisputed invoices shall be paid within thirty (30) days of receipt.";
      }
    }

    sectionsText.push(`\n\n## ${sec.title}\n\n${fullSecText}`);
  }

  // Add Schedule B with 15-day invoice payment for internal inconsistency
  sectionsText.push(`\n\n## Schedule B: Invoicing & Disbursement Schedule\n\nPayment of all vendor invoices shall be executed within fifteen (15) days of receipt.`);

  // Add Section 99: Cybersecurity Incident Disclosure
  sectionsText.push(`\n\n## Section 99: Cybersecurity Incident Disclosure\n\nVendor must notify all cybersecurity incidents and material data breaches to the Company Security Operations Center within 24 hours of discovery.`);

  const docBText = sectionsText.join("\n\n");
  const outPath = path.resolve(process.cwd(), "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt");
  fs.writeFileSync(outPath, docBText, "utf8");
  console.log(`[GENERATED] Document B written to ${outPath} (${docBText.length} chars)`);

  // Verify processDocument parses it
  const parsedDocB = await processDocument(Buffer.from(docBText, "utf8"), "LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt", "text/plain");
  console.log(`[VERIFIED] Parsed Doc B: sections=${parsedDocB.sections.length}, chunks=${parsedDocB.chunks.length}`);
}

generateDocB().catch(console.error);
