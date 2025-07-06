const fs = require("fs");
const path = require("path");

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
  ".hpp": "cpp",
};

// Ignored files and folders
const ignoredFiles = [
  ".angular",
  ".vscode",
  "node_modules",
  ".editorconfig",
  ".gitignore",
  "Migrations",
  "Debug",
  "test",
  "libs",
  "angular.json",
  "package-lock.json",
  "package.json",
  "README.md",
  "Dependencies",
  "Connected Services",
  "tsconfig.app.json",
  "tsconfig.json",
  "tsconfig.spec.json",
  "CodeSummary.md",
  ".mvn",
  ".settings",
  "build",
  "codeSummary.js",
  "CodeSummary.js",
  "cS.js",
  "CS.js",
];

let processedFiles = 0;
let totalFiles = 0;
let lastDir = "";
let currentDir = "";

// Recursive directory walker
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

// One line Allowed
// function removeExcessiveEmptyLines(content) {
//     return content
//         .replace(/\r\n/g, '\n')                     // Normalize Windows line endings
//         .split('\n')
//         .reduce((acc, line) => {
//             const isEmpty = line.trim() === '';
//             const lastLineEmpty = acc.length > 0 && acc[acc.length - 1].trim() === '';
//             if (isEmpty && lastLineEmpty) return acc; // skip multiple empties
//             acc.push(line);
//             return acc;
//         }, [])
//         .join('\n')
//         .trim();
// }

// No Line Allowed
function removeExcessiveEmptyLines(content) {
  return content
    .replace(/\r\n/g, "\n") // Normalize line endings
    .split("\n")
    .filter((line) => line.trim() !== "") // Remove all blank or whitespace-only lines
    .join("\n")
    .trim();
}

// Strip comments from code based on language
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
      return content
        .replace(/\/\/.*$/gm, "") // single-line //
        .replace(/\/\*[\s\S]*?\*\//gm, ""); // multi-line /* */

    case "python":
    case "ruby":
    case "bash":
    case "shell":
    case "dockerfile":
      return content.replace(/#.*$/gm, ""); // single-line #

    case "html":
    case "xml":
    case "vue":
    case "svelte":
      return content.replace(/<!--[\s\S]*?-->/gm, ""); // <!-- comment -->

    case "css":
    case "scss":
    case "less":
      return content.replace(/\/\*[\s\S]*?\*\//gm, ""); // /* comment */

    case "yaml":
    case "yml":
    case "ini":
    case "toml":
      return content.replace(/^\s*#.*/gm, ""); // # comment

    case "sql":
      return content
        .replace(/--.*$/gm, "") // -- comment
        .replace(/\/\*[\s\S]*?\*\//gm, ""); // /* comment */

    case "json":
    case "markdown":
    case "md":
    case "txt":
      return content; // No comment removal

    default:
      return content;
  }
}

// Summary generator
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

  // First pass: count valid files
  targets.forEach((dir) => {
    walkDir(dir, (filePath) => {
      const ext = path.extname(filePath);
      const lang = supportedExtensions[ext];
      const relativeFilePath = path.relative(root, filePath);
      if (
        !lang ||
        ignoredFiles.some((ignored) => relativeFilePath.includes(ignored))
      )
        return;
      totalFiles++;
    });
  });

  console.log(`📄 Total files to process: ${totalFiles}`);

  // Second pass: process each file
  targets.forEach((dir) => {
    walkDir(dir, (filePath) => {
      const ext = path.extname(filePath);
      const lang = supportedExtensions[ext];
      const relativeFilePath = path.relative(root, filePath);
      if (
        !lang ||
        ignoredFiles.some((ignored) => relativeFilePath.includes(ignored))
      )
        return;

      const content = fs.readFileSync(filePath, "utf-8");
      currentDir = path.dirname(relativeFilePath).split(path.sep)[0];

      if (currentDir !== lastDir) {
        if (lastDir) {
          summary += `\n---\n\nAfter finishing all code summary of ${lastDir}\n\n`;
        }
        lastDir = currentDir;
      }

      console.log(`Processing: ${relativeFilePath}`);

      // Strip comments then clean blank lines
      let cleanedContent = stripComments(content, lang);
      cleanedContent = removeExcessiveEmptyLines(cleanedContent);

      summary += `${relativeFilePath}:\n\`\`\`${lang}\n${cleanedContent}\n\`\`\`\n\n`;

      processedFiles++;
      const progress = Math.round((processedFiles / totalFiles) * 100);
      process.stdout.write(`\rProgress: ${progress}%`);

      if (processedFiles === totalFiles) {
        console.log(`\n💾 Writing to CodeSummary.md...`);
        const outputDir = path.join(__dirname, "ScriptOutput", "CodeSummary");
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, "CodeSummary.md"), summary);
        console.log(`✅ Done! Summary saved to CodeSummary.md`);
      }
    });
  });
}

// MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);
generateSummary(rootDir, selectedDirs);
