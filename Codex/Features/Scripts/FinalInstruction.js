const fs = require("fs");
const path = require("path");

function main() {
  const inputFile = path.join(__dirname, "..", "..", "Input", "Instructions.txt");
  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });

  let content = "";
  if (fs.existsSync(inputFile)) {
    content = fs.readFileSync(inputFile, "utf-8").trim();
    if (!content) content = "_Instructions file is empty._";
  } else {
    content = "_No instructions provided (Input/Instructions.txt missing)._";
  }

  const outputFile = path.join(outputDir, "FinalInstruction.md");
  fs.writeFileSync(outputFile, content, "utf-8");
  console.log(`✅ FinalInstruction.md generated from Input/Instructions.txt`);
}

main();
