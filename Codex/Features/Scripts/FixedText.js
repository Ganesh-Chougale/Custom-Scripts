const fs = require("fs");
const path = require("path");

function main() {
  const projectPath = process.argv[2] || process.cwd();
  const inputFile = path.join(projectPath, "Input", "Fixed.md");
  const outputDir = path.join(__dirname, "ScriptOutput");
  
  fs.mkdirSync(outputDir, { recursive: true });
  let content = "";
  
  if (fs.existsSync(inputFile)) {
    content = fs.readFileSync(inputFile, "utf-8");
  } else {
    content = "_No fixed text provided._";
  }
  
  fs.writeFileSync(path.join(outputDir, "FixedText.md"), content);
  console.log("✅ FixedText.md generated");
}
main();