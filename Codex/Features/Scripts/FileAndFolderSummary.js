const fs = require('fs');
const path = require('path');
const depthLevel = 4; // 👈 change to 'Infinity' if you want full depth

const ignoredFolders = [
  // Version Control & IDEs
  '.git', '.svn', '.vscode', '.idea', '.vs',
  
  // Package Managers & Third-Party Libs
  'node_modules', 'bower_components', 'packages', 'venv', '.venv',
  
  // Build / Compiled Output
  'bin', 'obj', 'dist', 'build', 'out', 'target', '.next', '.nuxt',
  
  // Diagnostics / Framework specific
  'Migrations', 'Debug', 'Release', 'TestResults', 'coverage', '__pycache__'
];

function walkDir(dir, callback, depth = 0, maxDepth = depthLevel) {
    if (!fs.existsSync(dir) || depth >= maxDepth) return;
    
    // Only filter out ignored folders, let all files show up in the tree
    const items = fs.readdirSync(dir).filter(f => {
        if (ignoredFolders.includes(f)) return false;
        return true;
    });

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

    // New output path: Temp Session Dir managed by Runner.js
    const outputDir = process.env.CODEX_TEMP_DIR;
    fs.mkdirSync(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'FileAndFolderSummary.md');
    fs.writeFileSync(outputPath, '```\n' + structure + '```');
    
    console.log(`✅ Folder + File structure saved to temp directory`);
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