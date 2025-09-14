Features\Scripts\CodeSummary.js:
```js
const fs = require("fs");
const path = require("path");
// ⚙️ Config object for switches
const config = {
  reduceTokensByWhiteSpace: false,
  checkOldOutput: false,    // 🔥 Compare with old summary
  skipLanguages: ["text"], // can be ".css" or "css" or mixed
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
  ".cmd": "batch"
};
// 🔑 Normalize skipLanguages so it can take both extensions (.css) or language names (css)
const normalizedSkipLanguages = config.skipLanguages.map((item) =>
  item.startsWith(".") ? supportedExtensions[item] || item.replace(".", "") : item
);
// Ignored files and folders
const ignoredFiles = [
  "site", ".metadata", "libraries", "gradle", ".angular", ".vscode", "node_modules", ".editorconfig",
  ".gitignore", "Migrations", "Debug", "test", "libs", "angular.json", "package-lock.json",
  "package.json", "README.md", "Dependencies", "Connected Services", "tsconfig.app.json", "next-env.d.ts",
  "tsconfig.json", "tsconfig.spec.json", "CodeSummary.md", ".mvn", ".settings", "build", "next.config.ts",
  "cS.js", "CS.js", ".idea", "DirectorySummary.js", ".next", "ErrorExporter.js", "Splitter.js",
  ".dart_tool", "io", "plugins", "flutter"
  // , "CodeSummer.js", "FileAndFolderSummary.js"
];
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
    case "js": case "ts": case "java": case "c": case "cpp": case "csharp": case "php":
      return content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//gm, "");
    case "python": case "ruby": case "bash": case "shell": case "dockerfile":
      return content.replace(/#.*$/gm, "");
    case "html": case "xml": case "vue": case "svelte":
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
      if (
        !lang ||
        ignoredFiles.some((ignored) => relativeFilePath.includes(ignored)) ||
        normalizedSkipLanguages.includes(lang)
      ) return;
      totalFiles++;
    });
  });
  console.log(`📄 Total files to process: ${totalFiles}`);
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
  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });
  const oldPath = path.join(outputDir, "CodeSummary.md");
  if (config.checkOldOutput) {
    let oldSnippets = {};
    if (fs.existsSync(oldPath)) oldSnippets = parseSummary(fs.readFileSync(oldPath, "utf-8"));
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
    fs.writeFileSync(oldPath, unchangedSection + changedSection);
  } else {
    fs.writeFileSync(oldPath, summary);
  }
  console.log("\n✅ Done! Summary saved to CodeSummary.md");
}
// 🏁 MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);
generateSummary(rootDir, selectedDirs);
```

Features\Scripts\FileAndFolderSummary.js:
```js
const fs = require('fs');
const path = require('path');
const depthLevel = 3; // 👈 change to 'Infinity' if you want full depth
const ignoredFolders = [
    '.angular', '.vscode', 'node_modules', 'Migrations', 'Debug',
    'Dependencies', 'Connected Services', '.git'
];
function walkDir(dir, callback, depth = 0, maxDepth = depthLevel) {
    if (!fs.existsSync(dir) || depth >= maxDepth) return;
    const items = fs.readdirSync(dir).filter(f => !ignoredFolders.includes(f));
    items.forEach((item) => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        callback(itemPath, depth, stats.isDirectory());
        if (stats.isDirectory()) {
            walkDir(itemPath, callback, depth + 1, maxDepth);
        }
    });
}
function generateStructure(root, selectedDirs) {
    let structure = "";
    let entries = [];
    const targets = selectedDirs.length > 0
        ? selectedDirs.map(f => path.isAbsolute(f) ? f : path.join(root, f)).filter(fs.existsSync)
        : [root];
    targets.forEach((dir) => {
        walkDir(dir, (entryPath, depth, isDir) => {
            const name = path.basename(entryPath);
            const relativePath = path.relative(root, entryPath);
            entries.push({ path: relativePath, depth, name, isDir });
        }, 0, depthLevel);
    });
    entries.sort((a, b) => a.path.localeCompare(b.path));
    let lastAtDepth = {};
    // ✅ Add root folder name at top
    const rootName = path.basename(root);
    structure += rootName + '\n';
    entries.forEach((entry) => {
        const { depth, name, isDir } = entry;
        const siblings = entries.filter(e => e.depth === depth && path.dirname(e.path) === path.dirname(entry.path));
        const isLast = siblings[siblings.length - 1].name === name;
        lastAtDepth[depth] = isLast;
        let prefix = '';
        for (let i = 0; i < depth; i++) {
            prefix += lastAtDepth[i] ? '    ' : '│   ';
        }
        prefix += isLast ? '└── ' : '├── ';
        structure += `${prefix}${name}${isDir ? '/' : ''}\n`;
    });
    // New output path: Script's dir + ScriptOutput/FolderStructure
    const scriptDir = path.dirname(__filename);
    const outputDir = path.join(scriptDir, 'ScriptOutput');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'FileAndFolderSummary.md');
    fs.writeFileSync(outputPath, '```\n' + structure + '```');
    console.log(`✅ Folder + File structure saved to: ${outputPath}`);
}
// MAIN
let rootDir;
const args = process.argv.slice(2);
if (args.length > 0) {
    // If user passed a folder, make it the root
    rootDir = path.resolve(args[0]);
    args.shift(); // Remaining args treated as subdirs
} else {
    rootDir = process.cwd();
}
generateStructure(rootDir, args);
```
Features\Scripts\FinalInstruction.js:
```js
const fs = require("fs");
const path = require("path");

function main() {
  const inputFile = path.join(__dirname, "..", "..", "Input", "Instructions.txt");
  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });

  let content = "";
  if (fs.existsSync(inputFile)) {
    content = fs.readFileSync(inputFile, "utf-8").trim();
    if (!content) content = "_Instructions file is empty._";
  } else {
    content = "_No instructions provided (Input/Instructions.txt missing)._";
  }

  const outputFile = path.join(outputDir, "FinalInstruction.md");
  fs.writeFileSync(outputFile, content, "utf-8");
  console.log(`✅ FinalInstruction.md generated from Input/Instructions.txt`);
}

main();
```


Features\Scripts\FixedText.js:
```js
const fs = require("fs");
const path = require("path");
function main() {
  const inputFile = path.join(__dirname, "..", "..", "Input", "Fixed.md");
  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });
  let content = "";
  if (fs.existsSync(inputFile)) {
    content = fs.readFileSync(inputFile, "utf-8");
  } else {
    content = "_No fixed text provided._";
  }
  fs.writeFileSync(path.join(outputDir, "FixedText.md"), content);
  console.log("✅ FixedText.md generated from Input/Fixed.md");
}
main();
```

Features\Scripts\TriedSolutions.js:
```js
const fs = require("fs");
const path = require("path");

function main() {
  const args = process.argv.slice(2);
  const codebaseFile = args[0];
  const inputFile = path.join(__dirname, "..", "..", "Input", "Instructions.txt");
  const outputDir = path.join(__dirname, "ScriptOutput");
  fs.mkdirSync(outputDir, { recursive: true });

  if (!codebaseFile || !fs.existsSync(codebaseFile)) {
    console.error("❌ Codebase file not found for FinalInstruction.");
    process.exit(1);
  }

  const instructions = fs.existsSync(inputFile)
    ? fs.readFileSync(inputFile, "utf-8")
    : "_No instructions provided._";

  const codebaseContent = fs.readFileSync(codebaseFile, "utf-8");

  const result =
    `Instruction:\n${instructions}\n\n---\n\n` +
    `Context Preview (first 500 chars):\n${codebaseContent.slice(0, 500)}...`;

  fs.writeFileSync(path.join(outputDir, "RunFinalInstruction.md"), result);
  console.log("✅ RunFinalInstruction.md generated from Input/Instructions.txt");
}

main();
```

After finishing all code summary of Features
Runner.js:
```js
const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");
// ✅ Switches
const config = {
  runCodeSummary: true,
  runFolderStructurer: true,
  runFixedText: true,
  runTriedSolutions: true,
  runFinalInstruction: true,
};
// small helpers (no external PathMaker)
function scriptPath(...parts) {
  return path.join(__dirname, "Features", "Scripts", ...parts);
}
function scriptOutputPath(...parts) {
  return path.join(__dirname, "Features", "Scripts", "ScriptOutput", ...parts);
}
// ✅ Run feature
function runFeature(scriptPathStr, args = []) {
  console.log(`▶ Running ${scriptPathStr} ${args.length ? args.join(" ") : ""}...`);
  const res = spawnSync("node", [scriptPathStr, ...args], { stdio: "inherit" });
  if (res.error) {
    console.error("⚠️ spawnSync error:", res.error);
  } else if (typeof res.status === "number" && res.status !== 0) {
    console.warn(`⚠️ Script exited with code ${res.status} (${scriptPathStr})`);
  }
}
// ✅ Collect outputs (in requested order)
function collectOutputs() {
  const outputDir = path.join(__dirname, "Output");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "output.md");
  let finalOutput = "# Codebase Report\n\n";
  // 1️⃣ Folder Structure
  if (config.runFolderStructurer) {
    const file = scriptOutputPath("FileAndFolderSummary.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Folder Structure\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    }
  }
  // 2️⃣ Fixed Text
  if (config.runFixedText) {
    const file = scriptOutputPath("FixedText.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Fixed Text\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    }
  }
  // 3️⃣ Code Summary
  if (config.runCodeSummary) {
    const file = scriptOutputPath("CodeSummary.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Code Summary\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    } else {
      finalOutput += "## Code Summary\n\n_(no code summary found)_\n\n---\n\n";
    }
  }
  // 4️⃣ Tried Solutions (optional)
  if (config.runTriedSolutions) {
    const file = scriptOutputPath("TriedSolutions.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Solutions Tried\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    }
  }
  fs.writeFileSync(outputPath, finalOutput, "utf-8");
  console.log(`✅ Combined report generated at ${outputPath}`);
  return outputPath;
}
// 🏁 MAIN
function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] ? args[0] : process.cwd();
  console.log(`📂 Running Codex on: ${projectPath}`);
  // run scripts (they accept projectPath where relevant)
  if (config.runFolderStructurer) runFeature(scriptPath("FileAndFolderSummary.js"), [projectPath]);
  if (config.runCodeSummary) runFeature(scriptPath("CodeSummary.js"), [projectPath]);
  if (config.runFixedText) runFeature(scriptPath("FixedText.js"));
  if (config.runTriedSolutions) runFeature(scriptPath("TriedSolutions.js"));
  const outputPath = collectOutputs();
  // Run final instruction after merging
  if (config.runFinalInstruction) {
    runFeature(scriptPath("FinalInstruction.js"));
    const instrFile = scriptOutputPath("FinalInstruction.md"); // ✅ corrected
    if (fs.existsSync(instrFile)) {
      const extra = fs.readFileSync(instrFile, "utf-8");
      const outputContent = fs.readFileSync(outputPath, "utf-8");
      if (!outputContent.includes(extra)) {
        fs.appendFileSync(outputPath, "\n\n## Final Instruction\n" + extra, "utf-8");
        console.log("✅ Final instruction appended.");
      }
    }
  }
}
main();
```

