const fs = require('fs');
const path = require('path');

async function splitMarkdownFile(filePath, maxLinesPerPart = 700) {
    try {
        // Resolve the absolute path to ensure correctness
        const absoluteFilePath = path.resolve(__dirname, filePath);
        console.log(`Attempting to split file: ${absoluteFilePath}`);

        const fileContent = await fs.promises.readFile(absoluteFilePath, 'utf8');
        const lines = fileContent.split(/\r?\n/); // Split by lines, handling Windows/Unix newlines

        // This is the key change: outputDir is now always the script's directory
        const outputDir = __dirname; // Directory where this script is located
        const fileNameWithoutExt = path.basename(absoluteFilePath, path.extname(absoluteFilePath));
        
        let currentPart = [];
        let currentPartLineCount = 0;
        let fileIndex = 1;
        let inSnippet = false; // Flag to track if we are inside a code snippet

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            currentPart.push(line);
            currentPartLineCount++;

            // Toggle inSnippet flag
            if (line.trim().startsWith('```')) {
                inSnippet = !inSnippet;
            }

            // Check if we need to split
            if (currentPartLineCount >= maxLinesPerPart) {
                // If we are inside a snippet, or the current line is a heading,
                // find the end of the snippet/heading before splitting.
                if (inSnippet || line.trim().startsWith('#')) {
                    let j = i + 1;
                    let foundLogicalBreak = false; // Flag to indicate if a logical break for splitting is found

                    while (j < lines.length) {
                        const nextLine = lines[j];

                        // If it's a snippet, keep adding until the closing ```
                        if (inSnippet && nextLine.trim().startsWith('```')) {
                            currentPart.push(nextLine);
                            currentPartLineCount++;
                            i = j; // Update main loop index
                            inSnippet = false; // Snippet ended
                            foundLogicalBreak = true;
                            break; // Break from inner loop, ready to split
                        }
                        // If it's a heading, keep adding until a non-heading line, an empty line, or starts a new block
                        else if (line.trim().startsWith('#') && !nextLine.trim().startsWith('#') && !nextLine.trim().startsWith('```') && nextLine.trim() !== '') {
                            // If the next line clearly breaks the heading section, then break
                            foundLogicalBreak = true;
                            break; // Break from inner loop, ready to split
                        }
                        // If it's a heading and we've reached an empty line, or a new section starts
                        else if (line.trim().startsWith('#') && nextLine.trim() === '') {
                             foundLogicalBreak = true;
                             break;
                        }

                        // If it's still part of the current logical block (snippet or heading)
                        currentPart.push(nextLine);
                        currentPartLineCount++;
                        j++;
                        i = j - 1; // Update main loop index to avoid re-processing lines
                    }
                    // If no logical break was found by the end of the file within the current block,
                    // it means the block extends to the end of the file, so we'll save it.
                    if (!foundLogicalBreak && j === lines.length) {
                        // All remaining lines added, so it's ready to save.
                    }
                }
                
                // Save the current part to a file in the script's directory
                const outputFileName = path.join(outputDir, `${fileNameWithoutExt}_part_${fileIndex}.md`);
                await fs.promises.writeFile(outputFileName, currentPart.join('\n'), 'utf8');
                console.log(`Saved ${outputFileName} with ${currentPartLineCount} lines.`);

                // Reset for the next part
                currentPart = [];
                currentPartLineCount = 0;
                fileIndex++;
            }
        }

        // Save any remaining lines in the last part
        if (currentPart.length > 0) {
            const outputFileName = path.join(outputDir, `${fileNameWithoutExt}_part_${fileIndex}.md`);
            await fs.promises.writeFile(outputFileName, currentPart.join('\n'), 'utf8');
            console.log(`Saved ${outputFileName} with ${currentPartLineCount} lines.`);
        }

        console.log('Markdown file splitting complete.');

    } catch (error) {
        console.error('Error splitting markdown file:', error);
        // Provide more user-friendly guidance for ENOENT error
        if (error.code === 'ENOENT') {
            console.error('\nEnsure the input file path is correct and the file exists.');
            console.error('Example Usage: node splitter.js "C:\\path\\to\\your_document.md"');
            console.error('Or if the file is in the same directory as this script: node splitter.js "your_document.md"');
        }
    }
}

// --- How to use the script ---

// Get the file path from command line arguments
const inputMarkdownFilePath = process.argv[2];

if (!inputMarkdownFilePath) {
    console.error('Usage: node splitter.js <path_to_markdown_file>');
    console.error('Example: node splitter.js "C:\\Users\\YourUser\\Documents\\my_long_doc.md"');
    console.error('Example: node splitter.js "my_local_doc.md" (if the document is in the same directory as this script)');
    process.exit(1); // Exit with an error code
}

// Call the function to split the file
splitMarkdownFile(inputMarkdownFilePath);
