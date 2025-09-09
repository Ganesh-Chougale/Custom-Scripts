const fs = require("fs");
const path = require("path");

// ⚙️ Config object for switches
const config = {
  reduceTokensByWhiteSpace: false,
  checkOldOutput: false,    // 🔥 Compare with old summary
  useFixedSnippets: true,  // 🔥 Use fixed.md as fallback
  skipLanguages: ["text"], // can be ".css" or "css" or mixed
  removeComments: false     // ✅ new switch (true = strip comments, false = keep them)
};

// Supported file extensions and languages
const supportedExtensions = {
  ".js": "js",
  ".gs": "gs",
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
const normalizedSkipLanguages = config.skipLanguages.map((item) => {
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
      config.reduceTokensByWhiteSpace ? line.trimStart() : line
    )
    .join("\n")
    .trim();
}

// 🔎 Parse CodeSummary.md or fixed.md into { filePath: snippet }
function parseSummary(summaryText) {
  const snippetRegex = /([^\n]+):\n```(\w+)\n([\s\S]*?)```/g;
  const snippets = {};
  let match;
  while ((match = snippetRegex.exec(summaryText)) !== null) {
    const filePath = match[1].trim();
    const code = match[3].trim();
    snippets[filePath] = code;
  }
  return snippets;
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

  // Collect snippets
  const newSnippets = {};

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

      let cleanedContent = content;
      if (config.removeComments) {
        cleanedContent = stripComments(content, lang);
      }
      cleanedContent = removeExcessiveEmptyLines(cleanedContent);

      newSnippets[relativeFilePath] = cleanedContent;

      summary += `${relativeFilePath}:\n\`\`\`${lang}\n${cleanedContent}\n\`\`\`\n\n`;

      processedFiles++;
      const progress = Math.round((processedFiles / totalFiles) * 100);
      process.stdout.write(`\rProgress: ${progress}%`);
    });
  });

  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });
  const oldPath = path.join(outputDir, "CodeSummary.md");
  const fixedPath = path.join(outputDir, "fixed.md");

  // 🔥 Merge fixed.md snippets if enabled
  if (config.useFixedSnippets) {
    if (fs.existsSync(fixedPath)) {
      console.log("\n📌 Merging fixed.md snippets...");
      const fixedText = fs.readFileSync(fixedPath, "utf-8");
      const fixedSnippets = parseSummary(fixedText);
      for (const [file, code] of Object.entries(fixedSnippets)) {
        if (!newSnippets[file]) {
          newSnippets[file] = code; // only add missing ones
        }
      }
    } else {
      console.log("⚠️ fixed.md not found, skipping...");
    }
  }

  // 🚀 NEW LOGIC: Compare with old output
  if (config.checkOldOutput) {
    let oldSnippets = {};
    if (fs.existsSync(oldPath)) {
      const oldText = fs.readFileSync(oldPath, "utf-8");
      oldSnippets = parseSummary(oldText);
    }

    let unchangedSection = "# unchanged snippets\n\n";
    let changedSection = "# changed snippets\n\n";

    const allFiles = new Set([
      ...Object.keys(oldSnippets),
      ...Object.keys(newSnippets),
    ]);

    allFiles.forEach((file) => {
      const oldCode = oldSnippets[file];
      const newCode = newSnippets[file];
      const ext = path.extname(file).toLowerCase();
      const lang = supportedExtensions[ext] || "";

      if (oldCode && newCode) {
        if (oldCode === newCode) {
          unchangedSection += `${file}:\n\`\`\`${lang}\n${newCode}\n\`\`\`\n\n`;
        } else {
          changedSection += `${file} (snippet changed):\n\`\`\`${lang}\n${newCode}\n\`\`\`\n\n`;
        }
      } else if (!oldCode && newCode) {
        changedSection += `${file} (new file):\n\`\`\`${lang}\n${newCode}\n\`\`\`\n\n`;
      } else if (oldCode && !newCode) {
        changedSection += `${file} (removed file)\n\n`;
      }
    });

    fs.writeFileSync(oldPath, unchangedSection + changedSection);
  } else {
    fs.writeFileSync(oldPath, summary);
  }

  console.log(`\n✅ Done! Summary saved to CodeSummary.md`);
}

// 🏁 MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);
generateSummary(rootDir, selectedDirs);
