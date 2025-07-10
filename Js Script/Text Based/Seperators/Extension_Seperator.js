const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('❌ Usage: node Extension_Seperator.js <file_or_directory_path>');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error('❌ Path not found:', resolvedPath);
  process.exit(1);
}

const targetDir = path.join(__dirname, 'ScriptOutput', 'SeparatedByExtension');
fs.mkdirSync(targetDir, { recursive: true });

function moveFile(filePath) {
  const ext = path.extname(filePath).slice(1) || 'no_ext';
  const extFolder = path.join(targetDir, ext);
  fs.mkdirSync(extFolder, { recursive: true });
  const fileName = path.basename(filePath);
  const dest = path.join(extFolder, fileName);
  fs.copyFileSync(filePath, dest);
  console.log(`✅ ${fileName} → ${ext}/`);
}

function handleInput(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    moveFile(filePath);
  } else if (stats.isDirectory()) {
    fs.readdirSync(filePath).forEach((f) =>
      handleInput(path.join(filePath, f))
    );
  }
}

handleInput(resolvedPath);
