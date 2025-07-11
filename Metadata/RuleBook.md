1. Script runnings:  
- Can pass file directly.  
example  
```bash
node script.js file.extension
```  
- can pass absolute path
```bash
node script.js "C:\app"
```  
or  
```bash
node script.js "C:\app\file.extension"
```  
- Or can pass relative path
```bash
node script.js "\file.extension"
```  
2. Extension supports:  
```javascript
const supportedExtensions = {
  ".js": "js", ".html": "html", ".ts": "typescript", ".java": "java", ".py": "python",
  ".go": "go", ".rb": "ruby", ".cpp": "cpp", ".c": "c", ".php": "php", ".sh": "bash",
  ".cs": "csharp", ".css": "css", ".txt": "text", ".h": "cpp", ".hpp": "cpp", ".md": "markdown",
};
```  
3. Ignored file & folder  
```javascript
const ignoredFiles = [
  ".angular", ".vscode", "node_modules", ".editorconfig", ".gitignore", "Migrations", "Debug",
  "test", "libs", "angular.json", "package-lock.json", "package.json", "README.md", "Dependencies",
  "Connected Services", "tsconfig.app.json", "tsconfig.json", "tsconfig.spec.json", "CodeSummary.md",
  ".mvn", ".settings", "build", "codeSummary.js", "CodeSummary.js", "cS.js", "CS.js", "DirectorySummary.js",
  "ErrorExporter.js", "FileAndFolderSummary.js", "Splitter.js",
];
```  
4. Adding CLI switches to turn features on/off or regulate/limit   
- On/Off  
```bash
# on/off header & footer lines
node Lines_Seperator.js folder --header --footer
```  
- regulate/limiter  
```bash
# With custom line count
node Lines_Seperator.js file.txt --max-lines=300
```  
5. Add brief discription in object (not visibly default but accessible with --info flag)  
```javascript
// -------------------- HELP INFO -------------------- //
const cliInfo = {
  description: "📚 Splits text/code files by number of lines (default: 700 lines per file).",
  usage: "node Lines_Seperator.js <file_or_directory_path> [options]",
  options: {
    "--header": "Add a header line at the top of each part (e.g., file_part1:)",
    "--footer": "Add a continuation message at the end of each part",
    "--all": "Enable both --header and --footer together",
    "--max-lines=700": "Set custom number of max lines per part",
    "--info": "Show this help message with all available options and features"
  },
  defaultBehavior: [
    "✔ Splits files into parts of max 700 lines (or user-defined)",
    "✔ Creates separate part files in ./ScriptOutput/SplitByLines/",
    "✔ Works with both single files and folders",
    "✔ Ignores common dev/system files and folders like node_modules, .git, build, etc."
  ],
  supportedExtensions: Object.keys({
    ".js": "js", ".html": "html", ".ts": "typescript", ".java": "java", ".py": "python",
    ".go": "go", ".rb": "ruby", ".cpp": "cpp", ".c": "c", ".php": "php", ".sh": "bash",
    ".cs": "csharp", ".css": "css", ".txt": "text", ".h": "cpp", ".hpp": "cpp", ".md": "markdown"
  }).join(", "),
  planned: {
    "--ext=.md": "Custom extension for output files (not implemented)",
    "--summary": "Show part count per file after splitting (not implemented)"
  },
  example: "node Lines_Seperator.js ./notes --max-lines=500 --all"
};
// -------------------------------------------------- //

// Show info if --info is passed
if (process.argv.includes('--info')) {
  console.log("\n📘 Lines_Seperator.js - Feature Overview\n");
  console.log("🔧 Description:\n " + cliInfo.description);
  console.log("\n🧾 Usage:\n " + cliInfo.usage);

  console.log("\n🔹 Options:");
  for (const [flag, desc] of Object.entries(cliInfo.options)) {
    console.log(` ${flag.padEnd(25)} → ${desc}`);
  }

  console.log("\n✅ Default Behavior:");
  cliInfo.defaultBehavior.forEach(line => console.log(" " + line));

  console.log("\n🧩 Supported Extensions:\n " + cliInfo.supportedExtensions);

  console.log("\n🧪 Planned Features:");
  for (const [flag, desc] of Object.entries(cliInfo.planned)) {
    console.log(` ${flag.padEnd(25)} → ${desc}`);
  }

  console.log("\n📦 Example:\n " + cliInfo.example + "\n");
  process.exit(0);
}
```  