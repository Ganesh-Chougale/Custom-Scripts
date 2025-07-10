const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Step 1: Read and validate input file
const inputArg = process.argv[2];
if (!inputArg) {
  console.error('❌ Usage: node ErrorExporter.js <file-path>');
  process.exit(1);
}
const inputPath = path.resolve(inputArg);
if (!fs.existsSync(inputPath)) {
  console.error(`❌ File not found: ${inputPath}`);
  process.exit(1);
}

// Step 2: Create output/Error folder
const scriptDir = __dirname;
const outputDir = path.join(scriptDir, 'ScriptOutput', 'Errors');
fs.mkdirSync(outputDir, { recursive: true });

// Step 3: Setup command based on file type
const ext = path.extname(inputPath).toLowerCase();
const fileNameSafe = path.basename(inputPath).replace(/\./g, '_');
const outputFile = path.join(outputDir, `${fileNameSafe}_export.md`);

const cmdMap = {
  '.cpp': `g++ "${inputPath}" -Wall -fmax-errors=0 -o nul`,
  '.c': `gcc "${inputPath}" -Wall -fmax-errors=0 -o nul`,
  '.java': `javac "${inputPath}"`,
  '.js': `node "${inputPath}"`,
  '.ts': `tsc "${inputPath}"`,
  '.py': `python3 "${inputPath}"`,
  '.cs': `csc "${inputPath}"`,
  '.rb': `ruby "${inputPath}"`,
  '.go': `go build "${inputPath}"`,
  '.rs': `rustc "${inputPath}"`,
  '.php': `php -l "${inputPath}"`, // -l = syntax check
  '.kt': `kotlinc "${inputPath}" -d /tmp`, // Kotlin
  '.swift': `swiftc "${inputPath}"`,
  '.sh': `bash -n "${inputPath}"`, // syntax check
  '.lua': `luac -p "${inputPath}"`, // syntax check
  '.r': `Rscript "${inputPath}"`,
  '.pl': `perl -c "${inputPath}"`,
};


const cmd = cmdMap[ext];
if (!cmd) {
  console.error(`❌ Unsupported file type: ${ext}`);
  process.exit(1);
}

// Step 4: Run command and write all stderr to file
exec(cmd, (error, stdout, stderr) => {
  const content = `# Errors for ${inputPath}\n\n\`\`\`\n${stderr || '✅ No errors'}\n\`\`\``;
  fs.writeFileSync(outputFile, content);
  console.log(`✅ Exported to: ${outputFile}`);
});
