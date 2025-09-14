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
