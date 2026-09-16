const fs = require("fs");
const path = require("path");

function main() {
  const projectPath = process.argv[2] || process.cwd();
  const inputFile = path.join(projectPath, "Input", "TriedSolutions.txt");
  const outputDir = process.env.CODEX_TEMP_DIR;
  const outputFile = path.join(outputDir, "TriedSolutions.md");
  
  fs.mkdirSync(outputDir, { recursive: true });
  
  const content = fs.existsSync(inputFile)
    ? fs.readFileSync(inputFile, "utf-8").trim()
    : "_No tried solutions provided._";
    
  fs.writeFileSync(outputFile, content, "utf-8");
  console.log("✅ TriedSolutions.md generated");
}
main();