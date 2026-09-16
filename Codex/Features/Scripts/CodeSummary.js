const fs = require("fs");
const path = require("path");

// ⚙️ Config object for switches
const config = {
  reduceTokensByWhiteSpace: false,
  checkOldOutput: false,    // 🔥 Compare with old summary
  skipLanguages: [], // can be ".css" or "css" or mixed
  removeComments: false     // ✅ true = strip comments, false = keep them
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
  ".env": "env",
  ".reg": "registry",
  ".bat": "batch",
  ".cmd": "batch",
  ".md": "markdown",
  ".json": "json",
  ".xml": "xml",
  ".svg": "svg",
  ".storyboard": "storyboard"
};

// 🔑 Normalize skipLanguages so it can take both extensions (.css) or language names (css)
const normalizedSkipLanguages = config.skipLanguages.map((item) =>
  item.startsWith(".") ? supportedExtensions[item] || item.replace(".", "") : item
);

// Ignored files and folders
const ignoredFiles = [ 
  // 📝 Codex specific outputs
  "Setup.md", "output.md", "CodeSummary.md", "FileAndFolderSummary.md", 
  "FixedText.md", "TriedSolutions.md", "FinalInstruction.md",

  // ⚙️ Version Control & IDEs
  ".git", ".svn", ".vscode", ".idea", ".vs",

  // 📦 Node.js / JavaScript / Frontend
  "node_modules", "bower_components", "dist", "build", "out", ".next", ".nuxt",
  "yarn.lock", "pnpm-lock.yaml",

  // 🔷 .NET / C#
  "bin", "obj", "packages", "Migrations", "TestResults", "project.assets.json",

  // ☕ Java / Python / General Backend
  "target", ".gradle", "venv", ".venv", "__pycache__", "coverage", ".pytest_cache",

  // 🖥️ OS Artifacts
  ".DS_Store", "Thumbs.db"
];

// 🔑 Parse dynamic skip items from the CLI argument
let skipItems = [];
if (process.env.CODEX_SKIP_ARG) {
  const match = process.env.CODEX_SKIP_ARG.match(/skip\[(.*?)\]/);
  if (match && match[1]) {
    skipItems = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
  }
}

function isIgnored(relativeFilePath) {
  const parts = relativeFilePath.split(path.sep);
  return ignoredFiles.some((ignored) => parts.includes(ignored));
}

let processedFiles = 0;
let totalFiles = 0;
let lastDir = "";

// Walk a directory
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    stats.isDirectory() ? walkDir(filePath, callback) : callback(filePath);
  }
}

// ⚙️ Strip comments from code
function stripComments(content, lang) {
  switch (lang) {
    case "js": case "ts": case "java": case "c": case "cpp": case "csharp": case "php": case "dart":
      return content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//gm, "");
    case "python": case "ruby": case "bash": case "shell": case "dockerfile":
      return content.replace(/#.*$/gm, "");
    case "html": case "xml": case "vue": case "svelte": case "svg": case "storyboard":
      return content.replace(/<!--[\s\S]*?-->/gm, "");
    case "css": case "scss": case "less":
      return content.replace(/\/\*[\s\S]*?\*\//gm, "");
    case "yaml": case "yml": case "ini": case "toml":
      return content.replace(/^\s*#.*/gm, "");
    case "sql":
      return content.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//gm, "");
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
    .map((line) => (config.reduceTokensByWhiteSpace ? line.trimStart() : line))
    .join("\n")
    .trim();
}

// 🔎 Parse CodeSummary.md into { filePath: snippet }
function parseSummary(summaryText) {
  const snippetRegex = /([^\n]+):\n```(\w+)\n([\s\S]*?)```/g;
  const snippets = {};
  let match;
  while ((match = snippetRegex.exec(summaryText))) {
    snippets[match[1].trim()] = match[3].trim();
  }
  return snippets;
}

// 📝 Generate summary
function generateSummary(root, selectedDirs) {
  let summary = "";
  processedFiles = 0;
  totalFiles = 0;
  lastDir = "";

  console.log("🔍 Starting scan...");

  const targets =
    selectedDirs.length > 0
      ? selectedDirs.map((folder) => path.resolve(folder)).filter(fs.existsSync)
      : [root];

  // Count total files
  targets.forEach((dir) => {
    walkDir(dir, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const lang = supportedExtensions[ext];
      const relativeFilePath = path.relative(root, filePath);
      const fileName = path.basename(filePath);
      if (
        !lang ||
        isIgnored(relativeFilePath) ||
        normalizedSkipLanguages.includes(lang) ||
        skipItems.includes(ext) ||     // Skips by extension (e.g. '.json')
        skipItems.includes(fileName)   // Skips by file name (e.g. 'doc.md')
      ) return;
    });
  });

  console.log(`📄 Total files to process: ${totalFiles}`);

  const newSnippets = {};
  targets.forEach((dir) => {
    walkDir(dir, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const lang = supportedExtensions[ext];
      const relativeFilePath = path.relative(root, filePath);
      const fileName = path.basename(filePath);
      if (
        !lang ||
        isIgnored(relativeFilePath) ||
        normalizedSkipLanguages.includes(lang) ||
        skipItems.includes(ext) ||     // Skips by extension (e.g. '.json')
        skipItems.includes(fileName)   // Skips by file name (e.g. 'doc.md')
      ) return;

      let content = fs.readFileSync(filePath, "utf-8");
      const currentDir = path.dirname(relativeFilePath).split(path.sep)[0];
      if (currentDir !== lastDir) {
        if (lastDir) summary += `\n---\n\nAfter finishing all code summary of ${lastDir}\n`;
        lastDir = currentDir;
      }

      console.log(`Processing: ${relativeFilePath}`);
      if (config.removeComments) content = stripComments(content, lang);
      content = removeExcessiveEmptyLines(content);

      newSnippets[relativeFilePath] = content;
      summary += `${relativeFilePath}:\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;

      processedFiles++;
      const progress = Math.round((processedFiles / totalFiles) * 100);
      process.stdout.write(`\rProgress: ${progress}%`);
    });
  });

 const outputDir = process.env.CODEX_TEMP_DIR;
  fs.mkdirSync(outputDir, { recursive: true });
  const targetOutput = path.join(outputDir, "CodeSummary.md");

  if (config.checkOldOutput) {
    let oldSnippets = {};
    // Read the diff from the actual user-defined Output.md instead of ScriptOutput!
    const previousOutput = process.env.CODEX_FINAL_OUTPUT_PATH;
    if (previousOutput && fs.existsSync(previousOutput)) {
      oldSnippets = parseSummary(fs.readFileSync(previousOutput, "utf-8"));
    }
    
    let unchangedSection = "# unchanged snippets\n\n";
    let changedSection = "# changed snippets\n\n";
    const allFiles = new Set([...Object.keys(oldSnippets), ...Object.keys(newSnippets)]);
    
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
    fs.writeFileSync(targetOutput, unchangedSection + changedSection);
  } else {
    fs.writeFileSync(targetOutput, summary);
  }
  console.log("\n✅ Done! Summary saved to temp directory");
}

// 🏁 MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);
generateSummary(rootDir, selectedDirs);
