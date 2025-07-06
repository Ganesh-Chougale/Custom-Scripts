const fs = require('fs');
const path = require('path');

let Amount = 700;

async function splitMarkdownFile(filePath, maxLinesPerPart = Amount) {
    try {
        const absoluteFilePath = path.resolve(__dirname, filePath);
        console.log(`Attempting to split file: ${absoluteFilePath}`);

        const fileContent = await fs.promises.readFile(absoluteFilePath, 'utf8');
        const lines = fileContent.split(/\r?\n/);

        // --- Output folder path ---
        const outputDir = path.join(__dirname, 'ScriptOutput', 'Chunked');
        await fs.promises.mkdir(outputDir, { recursive: true }); // ensure folder exists

        const fileNameWithoutExt = path.basename(absoluteFilePath, path.extname(absoluteFilePath));

        let currentPart = [];
        let currentPartLineCount = 0;
        let fileIndex = 1;
        let inSnippet = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            currentPart.push(line);
            currentPartLineCount++;

            if (line.trim().startsWith('```')) {
                inSnippet = !inSnippet;
            }

            if (currentPartLineCount >= maxLinesPerPart) {
                if (inSnippet || line.trim().startsWith('#')) {
                    let j = i + 1;
                    let foundLogicalBreak = false;

                    while (j < lines.length) {
                        const nextLine = lines[j];

                        if (inSnippet && nextLine.trim().startsWith('```')) {
                            currentPart.push(nextLine);
                            currentPartLineCount++;
                            i = j;
                            inSnippet = false;
                            foundLogicalBreak = true;
                            break;
                        } else if (line.trim().startsWith('#') && (!nextLine.trim().startsWith('#')) && nextLine.trim() !== '' && !nextLine.trim().startsWith('```')) {
                            foundLogicalBreak = true;
                            break;
                        } else if (line.trim().startsWith('#') && nextLine.trim() === '') {
                            foundLogicalBreak = true;
                            break;
                        }

                        currentPart.push(nextLine);
                        currentPartLineCount++;
                        j++;
                        i = j - 1;
                    }
                }

                const outputFileName = path.join(outputDir, `${fileNameWithoutExt}_part_${fileIndex}.md`);
                await fs.promises.writeFile(outputFileName, currentPart.join('\n'), 'utf8');
                console.log(`Saved ${outputFileName} with ${currentPartLineCount} lines.`);

                currentPart = [];
                currentPartLineCount = 0;
                fileIndex++;
            }
        }

        if (currentPart.length > 0) {
            const outputFileName = path.join(outputDir, `${fileNameWithoutExt}_part_${fileIndex}.md`);
            await fs.promises.writeFile(outputFileName, currentPart.join('\n'), 'utf8');
            console.log(`Saved ${outputFileName} with ${currentPartLineCount} lines.`);
        }

        console.log('Markdown file splitting complete.');
    } catch (error) {
        console.error('Error splitting markdown file:', error);
        if (error.code === 'ENOENT') {
            console.error('\nEnsure the input file path is correct and the file exists.');
            console.error('Example Usage: node splitter.js "C:\\path\\to\\your_document.md"');
            console.error('Or if the file is in the same directory as this script: node splitter.js "your_document.md"');
        }
    }
}

const inputMarkdownFilePath = process.argv[2];

if (!inputMarkdownFilePath) {
    console.error('Usage: node splitter.js <path_to_markdown_file>');
    process.exit(1);
}

splitMarkdownFile(inputMarkdownFilePath);