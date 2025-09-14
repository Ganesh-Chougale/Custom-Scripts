const fs = require("fs");
const path = require("path");

function main() {
  const inputFile = path.join(__dirname, "..", "..", "Input", "Fixed.md");
  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });

  let content = "";
  if (fs.existsSync(inputFile)) {
    content = fs.readFileSync(inputFile, "utf-8");
  } else {
    content = "_No fixed text provided._";
  }

  fs.writeFileSync(path.join(outputDir, "FixedText.md"), content);
  console.log("✅ FixedText.md generated from Input/Fixed.md");
}

main();
