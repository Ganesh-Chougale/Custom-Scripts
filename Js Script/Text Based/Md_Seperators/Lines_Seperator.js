const fs = require('fs');
const path = require('path');

// -------------------- HELP INFO -------------------- //
const cliInfo = {
  description: "📚 Splits text/code files by number of lines (default: 700 lines per file).",
  usage: "node Lines_Seperator.js <file_or_directory_path> [options]",
  options: {
    "--header": "Add a header line at the top of each part (e.g., file_part1:)",
    "--footer": "Add a continuation message at the end of each part",
    "--all": "Enable both --header and --footer together",
    "--max-lines=700": "Set custom number of max lines per part",
    "--info": "Show this help message with all available options and features"
  },
  defaultBehavior: [
    "✔ Splits files into parts of max 700 lines (or user-defined)",
    "✔ Creates separate part files in ./ScriptOutput/SplitByLines/",
    "✔ Works with both single files and folders",
    "✔ Ignores common dev/system files and folders like node_modules, .git, build, etc."
  ],
  supportedExtensions: Object.keys({
    ".js": "js", ".html": "html", ".ts": "typescript", ".java": "java", ".py": "python",
    ".go": "go", ".rb": "ruby", ".cpp": "cpp", ".c": "c", ".php": "php", ".sh": "bash",
    ".cs": "csharp", ".css": "css", ".txt": "text", ".h": "cpp", ".hpp": "cpp", ".md": "markdown"
  }).join(", "),
  planned: {
    "--ext=.md": "Custom extension for output files (not implemented)",
    "--summary": "Show part count per file after splitting (not implemented)"
  },
  example: "node Lines_Seperator.js ./notes --max-lines=500 --all"
};
// -------------------------------------------------- //

// Show info if --info is passed
if (process.argv.includes('--info')) {
  console.log("\n📘 Lines_Seperator.js - Feature Overview\n");
  console.log("🔧 Description:\n " + cliInfo.description);
  console.log("\n🧾 Usage:\n " + cliInfo.usage);

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

// -------------------- MAIN LOGIC -------------------- //

// Default max lines
let maxLines = 700;

// CLI flags
const inputPath = process.argv[2];
const enableAll = process.argv.includes('--all');
const addHeaderLine = enableAll || process.argv.includes('--header');
const addContinuationLine = enableAll || process.argv.includes('--footer');

// Check for --max-lines=<value>
const maxLineArg = process.argv.find(arg => arg.startsWith('--max-lines='));
if (maxLineArg) {
  const parsed = parseInt(maxLineArg.split('=')[1]);
  if (!isNaN(parsed) && parsed > 0) maxLines = parsed;
}

const supportedExtensions = {
  ".js": "js", ".html": "html", ".ts": "typescript", ".java": "java", ".py": "python",
  ".go": "go", ".rb": "ruby", ".cpp": "cpp", ".c": "c", ".php": "php", ".sh": "bash",
  ".cs": "csharp", ".css": "css", ".txt": "text", ".h": "cpp", ".hpp": "cpp", ".md": "markdown"
};

const ignoredFiles = [
    ".metadata", "libraries", "gradle",  ".angular", ".vscode", "node_modules", ".editorconfig", ".gitignore", "Migrations", "Debug",  "test", "libs", "angular.json", "package-lock.json", "package.json", "README.md", "Dependencies",  "Connected Services", "tsconfig.app.json", "tsconfig.json", "tsconfig.spec.json", "CodeSummary.md", ".mvn", ".settings", "build", "codeSummary.js", "CodeSummary.js", "cS.js", "CS.js", ".idea", "DirectorySummary.js", "ErrorExporter.js", "FileAndFolderSummary.js", "Splitter.js", ".dart_tool",
];

if (!inputPath) {
  console.error('❌ Usage: node Lines_Seperator.js <file_or_directory_path> [--header] [--footer] [--all] [--max-lines=700] [--info]');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error('❌ File or directory not found:', resolvedPath);
  process.exit(1);
}

const outputDir = path.join(__dirname, 'ScriptOutput', 'SplitByLines');
fs.mkdirSync(outputDir, { recursive: true });

function splitByLines(filePath) {
  const ext = path.extname(filePath);
  if (!supportedExtensions[ext]) return;

  const baseName = path.basename(filePath, ext);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');

  let part = 1;
  const chunks = [];

  for (let i = 0; i < lines.length; i += maxLines) {
    const chunkLines = lines.slice(i, i + maxLines);
    chunks.push(chunkLines);
  }

  chunks.forEach((chunkLines, idx) => {
    const partNum = idx + 1;
    const isLast = idx === chunks.length - 1;

    const startLine = addHeaderLine ? `${baseName}_part${partNum}:\n\n` : '';
    const endLine = addContinuationLine
      ? (isLast
          ? `\n\n${baseName} ✅ End of file.`
          : `\n\n${baseName} ➡ Continued in part ${partNum + 1}...`)
      : '';

    const finalText = startLine + chunkLines.join('\n') + endLine;

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
    splitByLines(resolvedPath);
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
    splitByLines(path.join(resolvedPath, file));
  });
} else {
  console.error('❌ Input must be a file or a directory.');
  process.exit(1);
}
