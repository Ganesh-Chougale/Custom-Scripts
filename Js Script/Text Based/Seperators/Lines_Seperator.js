const fs = require('fs');
const path = require('path');

const maxLines = 700;
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Usage: node Lines_Seperator.js <markdown_file_path>');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error('❌ File not found:', resolvedPath);
  process.exit(1);
}

const lines = fs.readFileSync(resolvedPath, 'utf8').split('\n');
const fileName = path.basename(resolvedPath, path.extname(resolvedPath));
const outputDir = path.join(__dirname, 'ScriptOutput', 'SplitByLines');
fs.mkdirSync(outputDir, { recursive: true });

let part = 1;
for (let i = 0; i < lines.length; i += maxLines) {
  const chunk = lines.slice(i, i + maxLines).join('\n');
  fs.writeFileSync(
    path.join(outputDir, `${fileName}_part_${part}.md`),
    chunk
  );
  part++;
}

console.log(`✅ File split into ${part - 1} parts with max ${maxLines} lines.`);
