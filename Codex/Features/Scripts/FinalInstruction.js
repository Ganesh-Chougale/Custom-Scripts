const fs = require("fs");
const path = require("path");

function main() {
  // Grab the project path passed from Runner.js
  const projectPath = process.argv[2] || process.cwd();
  const inputFile = path.join(projectPath, "Input", "Instructions.txt");
  const outputDir = process.env.CODEX_TEMP_DIR;
  
  fs.mkdirSync(outputDir, { recursive: true });
  let content = "";
  
  if (fs.existsSync(inputFile)) {
    content = fs.readFileSync(inputFile, "utf-8").trim();
    if (!content) content = "_Instructions file is empty._";
  } else {
    content = "_No instructions provided (Input/Instructions.txt missing in target project)._";
  }
  
  const outputFile = path.join(outputDir, "FinalInstruction.md");
  
  fs.writeFileSync(outputFile, content, "utf-8");
  console.log(`✅ FinalInstruction.md generated`);
}
main();