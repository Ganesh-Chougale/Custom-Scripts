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
    'tsconfig.app.json', 'tsconfig.json', 'tsconfig.spec.json', 'cS.js', 'zzz.md'
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

// Function to remove excessive empty lines
function removeExcessiveEmptyLines(content) {
    const lines = content.split('\n');
    let newContent = '';
    let emptyLineCount = 0;

    lines.forEach(line => {
        if (line.trim() === '') {
            emptyLineCount++;
            if (emptyLineCount <= 2) {
                newContent += '\n';
            }
        } else {
            emptyLineCount = 0;
            newContent += line + '\n';
        }
    });

    return newContent.trim(); // Remove any leading/trailing spaces
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
        ? selectedDirs.map(folder => path.resolve(folder)).filter(fs.existsSync)
        : [root];

    // First pass to count total files
    targets.forEach((dir) => {
        walkDir(dir, (filePath) => {
            const ext = path.extname(filePath);
            const lang = supportedExtensions[ext];
            const relativeFilePath = path.relative(root, filePath);

            if (!lang || ignoredFiles.some((ignored) => relativeFilePath.includes(ignored))) {
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
            const relativeFilePath = path.relative(root, filePath);

            if (!lang || ignoredFiles.some((ignored) => relativeFilePath.includes(ignored))) {
                return;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            currentDir = path.dirname(relativeFilePath).split(path.sep)[0];

            if (currentDir !== lastDir) {
                if (lastDir) {
                    summary += `\n---\n\nAfter finishing all code summary of ${lastDir}\n\n`;
                }
                lastDir = currentDir;
            }

            console.log(`Processing: ${relativeFilePath}`);

            // Remove excessive empty lines from content
            const cleanedContent = removeExcessiveEmptyLines(content);

            summary += `${relativeFilePath}:\n\`\`\`${lang}\n${cleanedContent}\n\`\`\`\n\n`;

            processedFiles++;
            const progress = Math.round((processedFiles / totalFiles) * 100);
            process.stdout.write(`\rProgress: ${progress}%`);

            if (processedFiles === totalFiles) {
                console.log(`\n💾 Writing to zzz.md...`);
                fs.writeFileSync(path.join(__dirname, 'zzz.md'), summary); // Save in script's folder
                console.log(`✅ Done! Summary saved to zzz.md`);
            }
        });
    });
}

// MAIN
const rootDir = process.cwd();
const selectedDirs = process.argv.slice(2);  // Accepts absolute or relative paths

generateSummary(rootDir, selectedDirs);

// relative path: node .\cs.js .\src\app
// absolute path (pass path as string): node .\cs.js "C:\Users\RaSkull\Desktop\Code"
