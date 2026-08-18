#!/usr/bin/env node
const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

// ✅ Switches
const config = require("./codex.config.js");

// small helpers
function scriptPath(...parts) {
  return path.join(__dirname, "Features", "Scripts", ...parts);
}
function scriptOutputPath(...parts) {
  return path.join(__dirname, "Features", "Scripts", "ScriptOutput", ...parts);
}

// ✅ Run feature
function runFeature(scriptPathStr, args = []) {
  console.log(`▶ Running ${scriptPathStr} ${args.length ? args.join(" ") : ""}...`);
  const res = spawnSync("node", [scriptPathStr, ...args], { stdio: "inherit" });
  if (res.error) {
    console.error("⚠️ spawnSync error:", res.error);
  } else if (typeof res.status === "number" && res.status !== 0) {
    console.warn(`⚠️ Script exited with code ${res.status} (${scriptPathStr})`);
  }
}

// ✅ Collect outputs to the DYNAMIC path
function collectOutputs(targetOutputPath) {
  const outputDir = path.dirname(targetOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let finalOutput = "# Codebase Report\n\n";
  
  if (config.runFolderStructurer) {
    const file = scriptOutputPath("FileAndFolderSummary.md");
    if (fs.existsSync(file)) finalOutput += "## Folder Structure\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
  }
  if (config.runFixedText) {
    const file = scriptOutputPath("FixedText.md");
    if (fs.existsSync(file)) finalOutput += "## Fixed Text\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
  }
  if (config.runCodeSummary) {
    const file = scriptOutputPath("CodeSummary.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Code Summary\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    } else {
      finalOutput += "## Code Summary\n\n_(no code summary found)_\n\n---\n\n";
    }
  }
  if (config.runTriedSolutions) {
    const file = scriptOutputPath("TriedSolutions.md");
    if (fs.existsSync(file)) finalOutput += "## Previous Takes\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
  }
  
  // Write to the user-defined path
  fs.writeFileSync(targetOutputPath, finalOutput, "utf-8");
  console.log(`✅ Combined report generated at ${targetOutputPath}`);
}

// 🏁 MAIN
function main() {
  const args = process.argv.slice(2);
  
  // 🔄 SWAPPED LOGIC: codex <output_file_path> <input_directory>
  const outputPathArg = args[0];
  const projectPathArg = args[1];

  // If no input directory is provided, default to current working directory
  const projectPath = projectPathArg ? path.resolve(process.cwd(), projectPathArg) : process.cwd();
  
  // If no output file is provided, default to "output.md" inside the target project directory
  const outputPath = outputPathArg ? path.resolve(process.cwd(), outputPathArg) : path.join(projectPath, "output.md");

  console.log(`📂 Running Codex on: ${projectPath}`);
  console.log(`📝 Output will be saved to: ${outputPath}`);

  // Run scripts and pass the dynamic projectPath to ALL of them
  if (config.runFolderStructurer) runFeature(scriptPath("FileAndFolderSummary.js"), [projectPath]);
  if (config.runCodeSummary) runFeature(scriptPath("CodeSummary.js"), [projectPath]);
  if (config.runFixedText) runFeature(scriptPath("FixedText.js"), [projectPath]);
  if (config.runTriedSolutions) runFeature(scriptPath("TriedSolutions.js"), [projectPath]);
  
  collectOutputs(outputPath);
  
  // Run final instruction after merging
  if (config.runFinalInstruction) {
    runFeature(scriptPath("FinalInstruction.js"), [projectPath]);
    const instrFile = scriptOutputPath("FinalInstruction.md");
    if (fs.existsSync(instrFile)) {
      const extra = fs.readFileSync(instrFile, "utf-8");
      const outputContent = fs.readFileSync(outputPath, "utf-8");
      if (!outputContent.includes(extra)) {
        fs.appendFileSync(outputPath, "\n\n## Final Instruction\n" + extra, "utf-8");
        console.log("✅ Final instruction appended.");
      }
    }
  }
}

main();