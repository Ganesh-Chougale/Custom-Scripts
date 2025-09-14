const fs = require("fs");
const path = require("path");

function main() {
  const inputFile = path.join(__dirname, "..", "..", "Input", "TriedSolutions.txt");
  const outputDir = path.join(__dirname, "ScriptOutput");
  const outputFile = path.join(outputDir, "TriedSolutions.md");

  fs.mkdirSync(outputDir, { recursive: true });

  const content = fs.existsSync(inputFile)
    ? fs.readFileSync(inputFile, "utf-8").trim()
    : "_No tried solutions provided._";

  fs.writeFileSync(outputFile, content, "utf-8");
  console.log("✅ TriedSolutions.md generated from Input/TriedSolutions.txt");
}

main();
