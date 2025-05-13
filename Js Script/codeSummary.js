// cS.js = codeSummary.js
const fs = require('fs');
const path = require('path');

// Supported file extensions and languages
const supportedExtensions = {
    '.js': 'js',
    '.html': 'html',
    '.ts': 'typescript',
    '.java': 'java',
    '.py': 'python',
    '.go': 'go',
    '.rb': 'ruby',
    '.cpp': 'cpp',
    '.c': 'c',
    '.php': 'php',
    '.sh': 'bash',
    '.cs': 'csharp'
};

// Ignored files and folders
const ignoredFiles = [
    '.angular', '.vscode', 'node_modules', '.editorconfig', '.gitignore', 'Migrations', 'Debug',
    'angular.json', 'package-lock.json', 'package.json', 'README.md', 'Dependencies', 'Connected Services',
    'tsconfig.app.json', 'tsconfig.json', 'tsconfig.spec.json', 'cS.js', 'zzzC.md', 'codeSummary.js'
];

let processedFiles = 0;
let totalFiles = 0;
let lastDir = '';
let currentDir = '';

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

// Summary generator
function generateSummary(root, selectedDirs) {
    let summary = "";
    processedFiles = 0;
    totalFiles = 0;
    lastDir = '';

    console.log(`🔍 Starting scan...`);

    // Determine target directories to scan
    const targets = selectedDirs.length > 0
        ? selectedDirs.map(folder => path.join(root, folder)).filter(fs.existsSync)
        : [root];

    // First pass to count total files
    targets.forEach((dir) => {
        walkDir(dir, (filePath) => {
            const ext = path.extname(filePath);
            const lang = supportedExtensions[ext];

            if (!lang || ignoredFiles.some((ignored) => filePath.includes(ignored))) {
                return;
            }

            totalFiles++;
        });
    });

    console.log(`📄 Total files to process: ${totalFiles}`);

    // Second pass to process files
    targets.forEach((dir) => {
        walkDir(dir, (filePath) => {
            const ext = path.extname(filePath);
            const lang = supportedExtensions[ext];

            if (!lang || ignoredFiles.some((ignored) => filePath.includes(ignored))) {
                return;
            }

            const relativePath = path.relative(root, filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            currentDir = path.dirname(relativePath).split(path.sep)[0];

            if (currentDir !== lastDir) {
                if (lastDir) {
                    summary += `\n---\n\nAfter finishing all code summary of ${lastDir}\n\n`;
                }
                lastDir = currentDir;
            }

            console.log(`Processing: ${relativePath}`);
            summary += `${relativePath}:\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;

            processedFiles++;
            const progress = Math.round((processedFiles / totalFiles) * 100);
            process.stdout.write(`\rProgress: ${progress}%`);

            if (processedFiles === totalFiles) {
                console.log(`\n💾 Writing to zzzC.md...`);
                fs.writeFileSync(path.join(root, 'zzzC.md'), summary);
                console.log(`✅ Done! Summary saved to zzzC.md`);
            }
        });
    });
}

// MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);  // Command-line folders

generateSummary(rootDir, selectedDirs);


// node cd.js: for all codebase
// node cS.js src/app/modules/dashboard: for specific folder 
