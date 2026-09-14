import JSZip from "jszip";

/**
 * Creates a valid multi-page PDF buffer with selectable text.
 * Strictly compliant with PDF 1.4 specification without external dependencies.
 */
export function createTestPdf(pages: string[]): Buffer {
  let objectCount = 0;
  const offsets: number[] = [];
  const parts: string[] = [];

  function addPart(str: string) {
    parts.push(str);
  }

  function startObject() {
    objectCount++;
    const currentLength = parts.reduce((acc, p) => acc + Buffer.byteLength(p, "utf-8"), 0);
    offsets[objectCount] = currentLength;
    addPart(`${objectCount} 0 obj\n`);
    return objectCount;
  }

  function endObject() {
    addPart("endobj\n");
  }

  // Header
  addPart("%PDF-1.4\n");

  const catalogId = 1;
  const pagesParentId = 2;
  const fontId = 3;

  // Object 1: Catalog
  startObject();
  addPart(`<< /Type /Catalog /Pages ${pagesParentId} 0 R >>\n`);
  endObject();

  // Object 2: Pages (will be written with references to each page object)
  const pageObjectIds: number[] = [];
  // Each page will have: Page Object, Content Stream Object
  let nextObjId = 4;
  for (let i = 0; i < pages.length; i++) {
    pageObjectIds.push(nextObjId);
    nextObjId += 2; // page obj + content stream obj
  }

  startObject();
  addPart(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\n`
  );
  endObject();

  // Object 3: Font
  startObject();
  addPart("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n");
  endObject();

  // For each page, create Page object and Stream object
  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];
    const streamObjId = pageObjectIds[i] + 1;

    // Page object
    startObject();
    addPart(
      `<< /Type /Page /Parent ${pagesParentId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamObjId} 0 R >>\n`
    );
    endObject();

    // Stream object
    // Escape parentheses in text for PDF string literal: (Text)
    const lines = pageText.split("\n");
    let streamOps = "BT\n/F1 12 Tf\n72 720 Td\n";
    for (let l = 0; l < lines.length; l++) {
      const escaped = lines[l].replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      if (l === 0) {
        streamOps += `(${escaped}) Tj\n`;
      } else {
        streamOps += `0 -18 Td\n(${escaped}) Tj\n`;
      }
    }
    streamOps += "ET\n";

    const streamLength = Buffer.byteLength(streamOps, "utf-8");

    startObject();
    addPart(`<< /Length ${streamLength} >>\nstream\n${streamOps}endstream\n`);
    endObject();
  }

  // Cross-reference table
  const startXref = parts.reduce((acc, p) => acc + Buffer.byteLength(p, "utf-8"), 0);
  addPart(`xref\n0 ${objectCount + 1}\n`);
  addPart("0000000000 65535 f \n");

  for (let i = 1; i <= objectCount; i++) {
    const offsetStr = String(offsets[i]).padStart(10, "0");
    addPart(`${offsetStr} 00000 n \n`);
  }

  // Trailer
  addPart(
    `trailer\n<< /Size ${objectCount + 1} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
  );

  return Buffer.from(parts.join(""), "utf-8");
}

/**
 * Creates a valid DOCX buffer containing structural headings and paragraphs.
 */
export async function createTestDocx(
  sections: Array<{ heading?: string; text: string }>
): Promise<Buffer> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/document.xml with paragraphs and headings
  let paragraphsXml = "";
  for (const sec of sections) {
    if (sec.heading) {
      paragraphsXml += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>${escapeXml(sec.heading)}</w:t>
      </w:r>
    </w:p>`;
    }

    paragraphsXml += `
    <w:p>
      <w:r>
        <w:t>${escapeXml(sec.text)}</w:t>
      </w:r>
    </w:p>`;
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`;

  zip.file("word/document.xml", documentXml);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
