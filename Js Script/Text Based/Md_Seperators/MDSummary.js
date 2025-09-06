// mergeDocs.js
const fs = require("fs");
const path = require("path");

const config = {
  outputDirName: "ScriptOutput",   // output folder relative to script
  outputFileName: "AllDocs.md",
  includeExtensions: [".md", ".txt"],
  ignoreDirs: ["node_modules", ".git", "dist", "build", ".next"],
  includeFileHeader: true,         // add header with file path before each file
  headerLevelForFile: 1            // 1 => "# File: path", 2 => "## File: path"
};

function walkDir(dir, cb) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (config.ignoreDirs.includes(e.name)) continue;
      walkDir(full, cb);
    } else if (e.isFile()) {
      cb(full);
    }
  }
}

function mergeDocs(root, selectedDirs) {
  const targets =
    selectedDirs.length > 0
      ? selectedDirs.map((p) => path.isAbsolute(p) ? p : path.resolve(root, p)).filter(fs.existsSync)
      : [root];

  const files = [];
  for (const t of targets) {
    walkDir(t, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!config.includeExtensions.includes(ext)) return;
      files.push(filePath);
    });
  }

  files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  if (files.length === 0) {
    console.log("⚠️  No .md or .txt files found.");
    return;
  }

  // ⬇️ ScriptOutput relative to script file
  const outputDir = path.join(__dirname, config.outputDirName);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, config.outputFileName);

  const headerPrefix = "#".repeat(Math.max(1, config.headerLevelForFile));
  let merged = "";

  for (const filePath of files) {
    const rel = path.relative(root, filePath);
    console.log(`📄 Adding: ${rel}`);
    const content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
    if (config.includeFileHeader) {
      merged += `${headerPrefix} File: ${rel}\n\n`;
    }
    merged += content.trim() + "\n\n---\n\n";
  }

  fs.writeFileSync(outputPath, merged.trim() + "\n", "utf8");
  console.log(`✅ Done — merged ${files.length} files into: ${outputPath}`);
}

// 🏁 MAIN
const rootDir = process.cwd();
const selected = process.argv.slice(2);
mergeDocs(rootDir, selected);
