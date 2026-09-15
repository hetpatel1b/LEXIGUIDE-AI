import fs from "fs";

async function main() {
  const file = "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt";
  let buf = fs.readFileSync(file);
  let isUTF16 = buf[0] === 0xff && buf[1] === 0xfe;
  let txt = buf.toString(isUTF16 ? "utf16le" : "utf8");

  // Revert all the false changes so they match the PDF:
  txt = txt.replace(/INR 2,800,000/g, "INR 2,400,000"); // Base salary
  txt = txt.replace(/within 90 days after the expense is incurred/g, "within 30 days after the expense is incurred"); // Expenses
  txt = txt.replace(/resign within 90 days after written notice/g, "resign within 30 days after written notice"); // Change-in-control
  
  // Revert Schedule D differences
  txt = txt.replace(/Expense submission\s*Within 90 days/g, "Expense submission\tWithin 30 days"); 
  
  // Revert Transition Obligations
  txt = txt.replace(/for up to 60 days after\r?\ntermination/g, "for up to 30 days after\ntermination");

  // Apply the 4 substantive changes the user asked for:
  // 1. Invoice payment: 30 -> 15 days (Schedule B already has 15 days in TXT)
  // 2. Termination notice: 30 -> 60 days (Probation)
  txt = txt.replace(/30 calendar days' written notice/g, "60 calendar days' written notice");
  // 3. Retention award: 600,000 -> 750,000
  txt = txt.replace(/INR 600,000/g, "INR 750,000");
  // 4. Confidentiality: 5 -> 3 years (already has 3 years in TXT)

  fs.writeFileSync(file, txt, isUTF16 ? "utf16le" : "utf8");
}
main().catch(console.error);
