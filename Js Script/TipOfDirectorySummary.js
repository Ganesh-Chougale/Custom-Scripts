const fs = require('fs');
const path = require('path');

// Ignored folders (only folder names should be listed here)
const ignoredFolders = [
    '.angular', '.vscode', 'node_modules', 'Migrations', 'Debug',
    'Dependencies', 'Connected Services', '.git'
];

// Recursive directory walker (with depth limit)
function walkDir(dir, callback, depth = 0, maxDepth = 2) {
    if (!fs.existsSync(dir) || depth >= maxDepth) return;

    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const dirName = path.basename(filePath);

        if (stats.isDirectory() && !ignoredFolders.includes(dirName)) {
            callback(filePath, depth + 1);
            walkDir(filePath, callback, depth + 1, maxDepth);
        }
    });
}

// Folder structure generator (Tree-like format)
function generateFolderStructure(root, selectedDirs) {
    let structure = "";
    let processedDirs = 0;
    let totalDirs = 0;

    console.log(`🔍 Starting directory scan...`);

    const targets = selectedDirs.length > 0
        ? selectedDirs.map(folder =>
            path.isAbsolute(folder) ? folder : path.join(root, folder)
        ).filter(fs.existsSync)
        : [root];

    // First pass: count total directories
    targets.forEach((dir) => {
        walkDir(dir, (dirPath) => {
            const dirName = path.basename(dirPath);
            if (!ignoredFolders.includes(dirName)) {
                totalDirs++;
            }
        }, 0, 2); // depth = 0, maxDepth = 2
    });

    console.log(`📁 Total directories to process: ${totalDirs}`);

    // Second pass: generate structure
    targets.forEach((dir) => {
        walkDir(dir, (dirPath, depth) => {
            const dirName = path.basename(dirPath);
            if (!ignoredFolders.includes(dirName)) {
                const relativePath = path.relative(root, dirPath);
                const indentLevel = depth - 1;
                const indent = '│   '.repeat(indentLevel);

                const parent = path.dirname(dirPath);
                const siblings = fs.readdirSync(parent).filter(f => {
                    const fullPath = path.join(parent, f);
                    return fs.statSync(fullPath).isDirectory() && !ignoredFolders.includes(f);
                });

                const isLastNode = siblings[siblings.length - 1] === dirName;
                const prefix = isLastNode ? '└── ' : '├── ';

                console.log(`Processing: ${relativePath}`);
                structure += `${indent}${prefix}${dirName}/\n`;

                processedDirs++;
                const progress = Math.round((processedDirs / totalDirs) * 100);
                process.stdout.write(`\rProgress: ${progress}%`);

                if (processedDirs === totalDirs) {
                    console.log(`\n💾 Writing to zzz.md...`);
                    fs.writeFileSync(path.join(root, 'zzz.md'), '```\n' + structure + '```');
                    console.log(`✅ Done! Folder structure saved to zzz.md`);
                }
            }
        }, 0, 2); // depth = 0, maxDepth = 2
    });
}

// MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);

generateFolderStructure(rootDir, selectedDirs);
