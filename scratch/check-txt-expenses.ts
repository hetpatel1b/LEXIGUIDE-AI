import fs from "fs";
const file = "tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt";
let buf = fs.readFileSync(file);
let isUTF16 = buf[0] === 0xff && buf[1] === 0xfe;
let text = buf.toString(isUTF16 ? "utf16le" : "utf8");
console.log(text.match(/.{0,30}expense.{0,30}/gi));
