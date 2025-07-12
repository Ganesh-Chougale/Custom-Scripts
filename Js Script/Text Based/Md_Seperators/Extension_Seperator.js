const fs = require('fs');
const path = require('path');

// ---------------- FULL FEATURE HELP ---------------- //
const cliInfo = {
  description: "📦 Bundles source files by extension/language into grouped markdown files.",
  usage: "node Extension_Seperator.js <file_or_directory_path> [options]",
  options: {
    "--exclude=js,py": "Exclude specific file types (by extension or language name)",
    "--info": "Show this help message with all available options and features",
  },
  defaultBehavior: [
    "✔ Recursively reads the given file or folder",
    "✔ Groups files based on their extensions/languages",
    "✔ Writes output to ./ScriptOutput/SeparatedByExtension",
    "✔ Skips common system/dev folders like node_modules, .git, build, etc.",
    "✔ Adds filename headers and language code blocks using proper syntax highlighting"
  ],
  supportedExtensions: Object.keys({
    ".js": "javascript", ".ts": "typescript", ".py": "python", ".java": "java",
    ".html": "html", ".css": "css", ".cpp": "cpp", ".c": "c", ".rb": "ruby",
    ".go": "go", ".php": "php", ".sh": "bash", ".cs": "csharp", ".txt": "text",
    ".md": "markdown"
  }).join(", "),
  planned: {
    "--include=js,ts": "Only include specific extensions (future)",
    "--output=custom/path": "Save output markdowns to a custom folder (future)",
    "--flatten": "Ignore folder hierarchy, treat all files flatly (future)"
  },
  example: "node Extension_Seperator.js ./project --exclude=js,md"
};
// --------------------------------------------------- //

// Handle --info
if (process.argv.includes('--info')) {
  console.log("\n🧠 Extension_Seperator.js - Feature Overview\n");
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

// ---------------- MAIN LOGIC ---------------- //

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('❌ Usage: node Extension_Seperator.js <file_or_directory_path> [--exclude=js,py,...] [--info]');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);
if (!fs.existsSync(resolvedPath)) {
  console.error('❌ Path not found:', resolvedPath);
  process.exit(1);
}

const targetDir = path.join(__dirname, 'ScriptOutput', 'SeparatedByExtension');
fs.mkdirSync(targetDir, { recursive: true });

const extensionMap = {
  ".js": "javascript", ".ts": "typescript", ".py": "python", ".java": "java",
  ".html": "html", ".css": "css", ".cpp": "cpp", ".c": "c", ".rb": "ruby",
  ".go": "go", ".php": "php", ".sh": "bash", ".cs": "csharp", ".txt": "text",
  ".md": "markdown"
};

const excludeArg = process.argv.find(arg => arg.startsWith('--exclude='));
const excludedExts = excludeArg
  ? excludeArg.split('=')[1].split(',').map(ext => ext.trim().toLowerCase())
  : [];

const ignored = new Set([
    ".metadata", "libraries", "gradle",  ".angular", ".vscode", "node_modules", ".editorconfig", ".gitignore", "Migrations", "Debug",  "test", "libs", "angular.json", "package-lock.json", "package.json", "README.md", "Dependencies",  "Connected Services", "tsconfig.app.json", "tsconfig.json", "tsconfig.spec.json", "CodeSummary.md", ".mvn", ".settings", "build", "codeSummary.js", "CodeSummary.js", "cS.js", "CS.js", ".idea", "DirectorySummary.js", "ErrorExporter.js", "FileAndFolderSummary.js", "Splitter.js", ".dart_tool",
]);

const bundle = {};

function handleInput(filePath) {
  const stats = fs.statSync(filePath);
  const base = path.basename(filePath);

  if (stats.isDirectory()) {
    if (ignored.has(base)) return;
    fs.readdirSync(filePath).forEach(child =>
      handleInput(path.join(filePath, child))
    );
  } else if (stats.isFile()) {
    const ext = path.extname(filePath);
    const lang = extensionMap[ext];
    if (!lang || ignored.has(base)) return;
    if (excludedExts.includes(ext.replace('.', '')) || excludedExts.includes(lang)) return;

    const code = fs.readFileSync(filePath, 'utf8');
    const header = `### ${path.basename(filePath)}\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;

    if (!bundle[lang]) bundle[lang] = [];
    bundle[lang].push(header);
  }
}

handleInput(resolvedPath);

Object.entries(bundle).forEach(([lang, sections]) => {
  const filePath = path.join(targetDir, `${lang}_files.md`);
  fs.writeFileSync(filePath, `# ${lang.toUpperCase()} Files\n\n` + sections.join('\n'));
  console.log(`✅ Created: ${lang}_files.md`);
});