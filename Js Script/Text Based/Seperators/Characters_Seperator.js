const fs = require('fs');
const path = require('path');

const maxChars = 2500;
const inputPath = process.argv[2];

if (!inputPath) {
  console.error('❌ Usage: node Characters_Seperator.js <markdown_file_path>');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error('❌ File not found:', resolvedPath);
  process.exit(1);
}

const fileName = path.basename(resolvedPath, path.extname(resolvedPath));
const lines = fs.readFileSync(resolvedPath, 'utf8').split('\n');

let chunk = '';
let part = 1;
const outputDir = path.join(__dirname, 'ScriptOutput', 'SplitByCharacters');
fs.mkdirSync(outputDir, { recursive: true });

lines.forEach((line) => {
  if ((chunk + line + '\n').length > maxChars) {
    fs.writeFileSync(
      path.join(outputDir, `${fileName}_part_${part}.md`),
      chunk
    );
    part++;
    chunk = '';
  }
  chunk += line + '\n';
});

if (chunk.trim()) {
  fs.writeFileSync(
    path.join(outputDir, `${fileName}_part_${part}.md`),
    chunk
  );
}

console.log(`✅ File split into ${part} parts with max ${maxChars} characters.`);
