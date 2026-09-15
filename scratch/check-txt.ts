import fs from "fs";
const v2 = fs.readFileSync("tests/fixtures/LexiGuide_AI_Comprehensive_Legal_Test_Contract_v2.txt", "utf-16le");
console.log("15:", v2.match(/.{0,30}15.{0,30}/gi));
console.log("60:", v2.match(/.{0,30}60.{0,30}/gi));
console.log("750,000:", v2.match(/.{0,30}750,000.{0,30}/gi));
