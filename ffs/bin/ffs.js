#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function usage() {
  console.error(`
Usage:
  ffs "output.md" "target-folder"

Example:
  ffs "output.md" "D:\\Projects\\MyProject"
`);
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.length !== 2 || args.includes("--help") || args.includes("-h")) {
  usage();
}

const [outputArg, targetArg] = args;
const outputPath = path.resolve(outputArg);
const targetPath = path.resolve(targetArg);

let targetStat;
try {
  targetStat = fs.lstatSync(targetPath);
} catch {
  console.error(`Error: target folder does not exist or cannot be accessed:\n${targetPath}`);
  process.exit(1);
}

if (!targetStat.isDirectory()) {
  console.error(`Error: target path is not a folder:\n${targetPath}`);
  process.exit(1);
}

// Prevent the generated output file from appearing in the scan when it
// is located inside the target folder.
const samePath = (a, b) => {
  const aa = path.resolve(a);
  const bb = path.resolve(b);
  return process.platform === "win32"
    ? aa.toLowerCase() === bb.toLowerCase()
    : aa === bb;
};

const lines = [];
const errors = [];

function displayName(name) {
  // Markdown tree characters are harmless in filenames, but escaping
  // leading Markdown syntax makes the generated document easier to read.
  return name.replace(/\\/g, "\\\\");
}

function scanDirectory(dir, prefix = "") {
  let entries;

  try {
    // withFileTypes lets us distinguish files/directories without
    // reading file contents. hidden entries are included automatically.
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    errors.push(`${dir}: ${error.code || error.message}`);
    return;
  }

  // Stable alphabetical ordering, folders and files together.
  entries.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const visibleEntries = entries.filter((entry) => {
    const fullPath = path.join(dir, entry.name);
    return !samePath(fullPath, outputPath);
  });

  visibleEntries.forEach((entry, index) => {
    const isLast = index === visibleEntries.length - 1;
    const branch = isLast ? "└── " : "├── ";
    const fullPath = path.join(dir, entry.name);

    lines.push(`${prefix}${branch}${displayName(entry.name)}${entry.isDirectory() ? "/" : ""}`);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, prefix + (isLast ? "    " : "│   "));
    }
  });
}

const rootName = path.basename(targetPath) || targetPath;
lines.push(`${displayName(rootName)}/`);
scanDirectory(targetPath);

const header = [
  "# Folder Inspection",
  "",
  `**Target:** \`${targetPath}\``,
  "",
  "## Structure",
  "",
  "```text",
  ...lines,
  "```",
  ""
];

if (errors.length) {
  header.push(
    "## Inaccessible Entries",
    "",
    "The scanner continued after these filesystem access errors:",
    "",
    ...errors.map((error) => `- \`${error}\``),
    ""
  );
}

try {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, header.join("\n"), "utf8");
} catch (error) {
  console.error(`Error: could not write output file:\n${error.message}`);
  process.exit(1);
}

console.log(`Folder inspection written to:\n${outputPath}`);
if (errors.length) {
  console.log(`Completed with ${errors.length} inaccessible location(s).`);
}
