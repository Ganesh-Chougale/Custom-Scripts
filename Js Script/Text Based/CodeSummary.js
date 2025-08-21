const fs = require("fs");
const path = require("path");

// Toggle this to control formatting whitespace/tabs
const removeWhitespaceFormatting = true;

// List of languages/extensions to skip
const skipLanguages = ["text"]; // can be ".css" or "css" or mixed

// Supported file extensions and languages
const supportedExtensions = {
  ".js": "js",
  ".html": "html",
  ".ts": "typescript",
  ".java": "java",
  ".py": "python",
  ".go": "go",
  ".rb": "ruby",
  ".cpp": "cpp",
  ".c": "c",
  ".php": "php",
  ".sh": "bash",
  ".cs": "csharp",
  ".css": "css",
  ".txt": "text",
  ".h": "cpp",
  ".yaml": "yaml",
  ".dart": "dart",
  ".tsx": "typescript",
  ".mjs": "javascript",
  ".env": "env"
};

// 🔑 Normalize skipLanguages so it can take both extensions (.css) or language names (css)
const normalizedSkipLanguages = skipLanguages.map((item) => {
  if (item.startsWith(".")) {
    return supportedExtensions[item] || item.replace(".", "");
  }
  return item;
});

// Ignored files and folders
const ignoredFiles = [
  "site",
  ".metadata", "libraries", "gradle", ".angular", ".vscode", "node_modules", ".editorconfig",
  ".gitignore", "Migrations", "Debug", "test", "libs", "angular.json", "package-lock.json",
  "package.json", "README.md", "Dependencies", "Connected Services", "tsconfig.app.json", "next-env.d.ts",
  "tsconfig.json", "tsconfig.spec.json", "CodeSummary.md", ".mvn", ".settings", "build", "next.config.ts",
  "codeSummary.js", "CodeSummary.js", "cS.js", "CS.js", ".idea", "DirectorySummary.js", ".next",
  "ErrorExporter.js", "FileAndFolderSummary.js", "Splitter.js", ".dart_tool", "io", "plugins", "flutter", "windows"
];

let processedFiles = 0;
let totalFiles = 0;
let lastDir = "";
let currentDir = "";

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

// ⚙️ Strip comments from code
function stripComments(content, lang) {
  switch (lang) {
    case "js":
    case "ts":
    case "java":
    case "c":
    case "cpp":
    case "csharp":
    case "php":
    case "swift":
    case "scala":
    case "kotlin":
      return content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//gm, "");
    case "python":
    case "ruby":
    case "bash":
    case "shell":
    case "dockerfile":
      return content.replace(/#.*$/gm, "");
    case "html":
    case "xml":
    case "vue":
    case "svelte":
      return content.replace(/<!--[\s\S]*?-->/gm, "");
    case "css":
    case "scss":
    case "less":
      return content.replace(/\/\*[\s\S]*?\*\//gm, "");
    case "yaml":
    case "yml":
    case "ini":
    case "toml":
      return content.replace(/^\s*#.*/gm, "");
    case "sql":
      return content.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//gm, "");
    case "json":
    case "markdown":
    case "md":
    case "text":
      return content;
    default:
      return content;
  }
}

// ✅ Clean empty lines + optional whitespace formatting
function removeExcessiveEmptyLines(content) {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) =>
      removeWhitespaceFormatting ? line.trimStart() : line
    )
    .join("\n")
    .trim();
}

// 📝 Generate summary
function generateSummary(root, selectedDirs) {
  let summary = "";
  processedFiles = 0;
  totalFiles = 0;
  lastDir = "";

  console.log(`🔍 Starting scan...`);

  const targets =
    selectedDirs.length > 0
      ? selectedDirs.map((folder) => path.resolve(folder)).filter(fs.existsSync)
      : [root];

  // Count total
  targets.forEach((dir) => {
    walkDir(dir, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const lang = supportedExtensions[ext];
      const relativeFilePath = path.relative(root, filePath);
      if (
        !lang ||
        ignoredFiles.some((ignored) => relativeFilePath.includes(ignored)) ||
        normalizedSkipLanguages.includes(lang)
      )
        return;
      totalFiles++;
    });
  });

  console.log(`📄 Total files to process: ${totalFiles}`);

  // Process files
  targets.forEach((dir) => {
    walkDir(dir, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const lang = supportedExtensions[ext];
      const relativeFilePath = path.relative(root, filePath);
      if (
        !lang ||
        ignoredFiles.some((ignored) => relativeFilePath.includes(ignored)) ||
        normalizedSkipLanguages.includes(lang)
      )
        return;

      const content = fs.readFileSync(filePath, "utf-8");
      currentDir = path.dirname(relativeFilePath).split(path.sep)[0];

      if (currentDir !== lastDir) {
        if (lastDir) {
          summary += `\n---\n\nAfter finishing all code summary of ${lastDir}\n`;
        }
        lastDir = currentDir;
      }

      console.log(`Processing: ${relativeFilePath}`);

      let cleanedContent = stripComments(content, lang);
      cleanedContent = removeExcessiveEmptyLines(cleanedContent);

      summary += `${relativeFilePath}:\n\`\`\`${lang}\n${cleanedContent}\n\`\`\`\n\n`;

      processedFiles++;
      const progress = Math.round((processedFiles / totalFiles) * 100);
      process.stdout.write(`\rProgress: ${progress}%`);

      if (processedFiles === totalFiles) {
        console.log(`\n💾 Writing to CodeSummary.md...`);
        const outputDir = path.join(__dirname, "ScriptOutput");
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, "CodeSummary.md"), summary);
        console.log(`✅ Done! Summary saved to CodeSummary.md`);
      }
    });
  });
}

// 🏁 MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);
generateSummary(rootDir, selectedDirs);
