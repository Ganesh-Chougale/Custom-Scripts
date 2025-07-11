const fs = require('fs');
const path = require('path');

// -------------------- HELP INFO -------------------- //
const cliInfo = {
  description: "📝 Splits files by character limit into multiple parts (default 2500 chars).",
  usage: "node Characters_Seperator.js <file_or_directory_path> [options]",
  options: {
    "--header": "Add a header line at the top of each part (e.g., file_part1:)",
    "--footer": "Add a continuation message at the end of each part",
    "--all": "Enable both --header and --footer together",
    "--info": "Show this help message with all available options and features"
  },
  defaultBehavior: [
    "✔ Splits supported files by 2500 characters (default)",
    "✔ Creates separate part files for each split",
    "✔ Supports both single files and directories",
    "✔ Outputs to: ./ScriptOutput/SplitByCharacters",
    "✔ Skips ignored folders/files like node_modules, .git, etc."
  ],
  supportedExtensions: Object.keys({
    ".js": "js", ".html": "html", ".ts": "typescript", ".java": "java", ".py": "python",
    ".go": "go", ".rb": "ruby", ".cpp": "cpp", ".c": "c", ".php": "php", ".sh": "bash",
    ".cs": "csharp", ".css": "css", ".txt": "text", ".h": "cpp", ".hpp": "cpp", ".md": "markdown"
  }).join(", "),
  planned: {
    "--max=3000": "Custom max character length per chunk (not implemented)",
    "--ext=.md": "Custom extension for output files (not implemented)"
  },
  example: "node Characters_Seperator.js ./docs --all"
};
// -------------------------------------------------- //

// Show info if --info passed
if (process.argv.includes('--info')) {
  console.log("\n🧠 Characters_Seperator.js - Feature Overview\n");
  console.log("🔧 Description:\n " + cliInfo.description);
  console.log("\n📘 Usage:\n " + cliInfo.usage);

  console.log("\n🔹 Options:");
  for (const [flag, desc] of Object.entries(cliInfo.options)) {
    console.log(` ${flag.padEnd(25)} → ${desc}`);
  }

  console.log("\n✅ Default Behavior:");
  cliInfo.defaultBehavior.forEach(line => console.log(" " + line));

  console.log("\n🧩 Supported Extensions:\n " + cliInfo.supportedExtensions);

  console.log("\n🧪 Planned Features:");
  for (const [flag, desc] of Object.entries(cliInfo.planned)) {
    console.log(` ${flag.padEnd(25)} → ${desc}`);
  }

  console.log("\n📦 Example:\n " + cliInfo.example + "\n");
  process.exit(0);
}

// ------------------- MAIN LOGIC ------------------- //

const maxChars = 2500;
const inputPath = process.argv[2];

const enableAll = process.argv.includes('--all');
const addHeaderLine = enableAll || process.argv.includes('--header');
const addContinuationLine = enableAll || process.argv.includes('--footer');

const supportedExtensions = {
  ".js": "js", ".html": "html", ".ts": "typescript", ".java": "java", ".py": "python",
  ".go": "go", ".rb": "ruby", ".cpp": "cpp", ".c": "c", ".php": "php", ".sh": "bash",
  ".cs": "csharp", ".css": "css", ".txt": "text", ".h": "cpp", ".hpp": "cpp", ".md": "markdown"
};

const ignoredFiles = [
  ".angular", ".vscode", "node_modules", ".editorconfig", ".gitignore", "Migrations", "Debug",
  "test", "libs", "angular.json", "package-lock.json", "package.json", "README.md", "Dependencies",
  "Connected Services", "tsconfig.app.json", "tsconfig.json", "tsconfig.spec.json", "CodeSummary.md",
  ".mvn", ".settings", "build", "codeSummary.js", "CodeSummary.js", "cS.js", "CS.js", "DirectorySummary.js",
  "ErrorExporter.js", "FileAndFolderSummary.js", "Splitter.js"
];

if (!inputPath) {
  console.error('❌ Usage: node Characters_Seperator.js <file_or_directory_path> [--header] [--footer] [--all] [--info]');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error('❌ File or directory not found:', resolvedPath);
  process.exit(1);
}

const outputDir = path.join(__dirname, 'ScriptOutput', 'SplitByCharacters');
fs.mkdirSync(outputDir, { recursive: true });

function splitFile(filePath) {
  const ext = path.extname(filePath);
  if (!supportedExtensions[ext]) return;

  const baseName = path.basename(filePath, ext);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  let chunk = '';
  const chunks = [];

  lines.forEach((line) => {
    if ((chunk + line + '\n').length > maxChars) {
      chunks.push(chunk);
      chunk = '';
    }
    chunk += line + '\n';
  });

  if (chunk.trim()) chunks.push(chunk);

  chunks.forEach((text, idx) => {
    const partNum = idx + 1;
    const isLast = idx === chunks.length - 1;

    const startLine = addHeaderLine ? `${baseName}_part${partNum}:\n\n` : '';
    const endLine = addContinuationLine
      ? (isLast
          ? `\n\n${baseName} ✅ End of file.`
          : `\n\n${baseName} ➡ Continued in part ${partNum + 1}...`)
      : '';

    const finalText = startLine + text + endLine;

    fs.writeFileSync(
      path.join(outputDir, `${baseName}_part_${partNum}${ext}`),
      finalText
    );
  });

  console.log(`✅ ${baseName}${ext} split into ${chunks.length} parts.`);
}

function isIgnored(name) {
  return ignoredFiles.includes(name) || ignoredFiles.includes(path.basename(name));
}

const stats = fs.statSync(resolvedPath);

if (stats.isFile()) {
  const ext = path.extname(resolvedPath);
  if (supportedExtensions[ext] && !isIgnored(path.basename(resolvedPath))) {
    splitFile(resolvedPath);
  } else {
    console.error('❌ File is either unsupported or ignored.');
  }
} else if (stats.isDirectory()) {
  const allFiles = fs.readdirSync(resolvedPath);
  const validFiles = allFiles.filter(file => {
    const fullPath = path.join(resolvedPath, file);
    const ext = path.extname(file);
    return (
      supportedExtensions[ext] &&
      !isIgnored(file) &&
      fs.statSync(fullPath).isFile()
    );
  });

  if (validFiles.length === 0) {
    console.error('❌ No supported files found in directory.');
    process.exit(1);
  }

  validFiles.forEach(file => {
    splitFile(path.join(resolvedPath, file));
  });
} else {
  console.error('❌ Input must be a file or a directory.');
  process.exit(1);
}
