import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { createTestPdf, createTestDocx } from "./fixture-generator";

async function generateFixtures() {
  const fixturesDir = path.resolve(process.cwd(), "tests/fixtures");
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. simple.txt
  fs.writeFileSync(
    path.join(fixturesDir, "simple.txt"),
    `This Non-Disclosure Agreement (the "Agreement") is entered into as of January 1, 2026. Both parties agree to safeguard proprietary and confidential information.`,
    "utf-8"
  );

  // 2. multi-section.txt
  fs.writeFileSync(
    path.join(fixturesDir, "multi-section.txt"),
    `MASTER SERVICES AGREEMENT

ARTICLE I. DEFINITIONS
"Confidential Information" shall mean all technical, business, and financial information disclosed by one party to the other.

ARTICLE II. SCOPE OF SERVICES
The Provider shall furnish comprehensive document processing and legal review technology as outlined in the Statement of Work.

ARTICLE III. COMPENSATION AND PAYMENT
Client agrees to remit payment within 30 days of receiving a valid tax invoice. Late payments shall incur 1.5% interest per month.

ARTICLE IV. TERM AND TERMINATION
This Agreement commences on the Effective Date and continues for a period of one (1) year unless earlier terminated in accordance with Section 4.2.

ARTICLE V. GOVERNING LAW
This Agreement shall be construed and governed in all respects by the laws of India, and courts in Bengaluru shall have exclusive jurisdiction.`,
    "utf-8"
  );

  // 3. empty.txt
  fs.writeFileSync(path.join(fixturesDir, "empty.txt"), Buffer.alloc(0));

  // 4. corrupt.pdf
  fs.writeFileSync(
    path.join(fixturesDir, "corrupt.pdf"),
    Buffer.from("%PDF-1.4\ncorrupted binary stream with invalid header/xref %%\n", "utf-8")
  );

  // 5. scanned-mock.pdf (PDF containing no extractable text layer)
  const emptyPagePdf = createTestPdf(["", "   "]);
  fs.writeFileSync(path.join(fixturesDir, "scanned-mock.pdf"), emptyPagePdf);

  // 6. sample-agreement.pdf (2 pages with legal clauses)
  const multiPagePdf = createTestPdf([
    "EMPLOYMENT AGREEMENT - PAGE 1\n\n1. Appointment and Term\nAcme Technologies Pvt. Ltd. hereby appoints the Employee.\n\n2. Duties and Responsibilities\nThe Employee agrees to dedicate full business time to the Company.",
    "EMPLOYMENT AGREEMENT - PAGE 2\n\n3. Non-Disclosure and Confidentiality\nThe Employee will not disclose trade secrets during or after employment.\n\n4. Governing Law\nThis Agreement is governed by the laws of India.",
  ]);
  fs.writeFileSync(path.join(fixturesDir, "sample-agreement.pdf"), multiPagePdf);

  // 7. sample-agreement.docx
  const sampleDocx = await createTestDocx([
    {
      heading: "ARTICLE 1. DEFINITIONS",
      text: "In this Agreement, terms shall have their customary meaning in international legal practice.",
    },
    {
      heading: "ARTICLE 2. CONFIDENTIALITY",
      text: "The recipient of proprietary information agrees to hold all such information in strict confidence.",
    },
    {
      heading: "ARTICLE 3. TERMINATION",
      text: "Either party may terminate upon giving thirty days written notice.",
    },
  ]);
  fs.writeFileSync(path.join(fixturesDir, "sample-agreement.docx"), sampleDocx);

  // 8. fake-docx.docx (Generic ZIP without OpenXML markers)
  const zip = new JSZip();
  zip.file("readme.txt", "This is an arbitrary zip archive, not a Word document.");
  const fakeDocxBuffer = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(path.join(fixturesDir, "fake-docx.docx"), fakeDocxBuffer);

  // 9. sample-long-filename.txt
  const longName = "sample-long-filename.txt";
  fs.writeFileSync(
    path.join(fixturesDir, longName),
    "Document with a long filename sample to test filename sanitization and length limits.",
    "utf-8"
  );

  console.log("All test fixtures generated successfully in tests/fixtures/");
}

generateFixtures().catch(console.error);
