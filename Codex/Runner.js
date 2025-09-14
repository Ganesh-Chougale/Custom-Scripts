const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");

// ✅ Switches
const config = {
  runCodeSummary: true,
  runFolderStructurer: true,
  runFixedText: true,
  runTriedSolutions: true,
  runFinalInstruction: true,
};

// small helpers (no external PathMaker)
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

// ✅ Collect outputs (in requested order)
function collectOutputs() {
  const outputDir = path.join(__dirname, "Output");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "output.md");

  let finalOutput = "# Codebase Report\n\n";

  // 1️⃣ Folder Structure
  if (config.runFolderStructurer) {
    const file = scriptOutputPath("FileAndFolderSummary.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Folder Structure\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    }
  }

  // 2️⃣ Fixed Text
  if (config.runFixedText) {
    const file = scriptOutputPath("FixedText.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Fixed Text\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    }
  }

  // 3️⃣ Code Summary
  if (config.runCodeSummary) {
    const file = scriptOutputPath("CodeSummary.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Code Summary\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    } else {
      finalOutput += "## Code Summary\n\n_(no code summary found)_\n\n---\n\n";
    }
  }

  // 4️⃣ Tried Solutions (optional)
  if (config.runTriedSolutions) {
    const file = scriptOutputPath("TriedSolutions.md");
    if (fs.existsSync(file)) {
      finalOutput += "## Previous Takes\n" + fs.readFileSync(file, "utf-8") + "\n\n---\n\n";
    }
  }

  fs.writeFileSync(outputPath, finalOutput, "utf-8");
  console.log(`✅ Combined report generated at ${outputPath}`);
  return outputPath;
}

// 🏁 MAIN
function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] ? args[0] : process.cwd();
  console.log(`📂 Running Codex on: ${projectPath}`);

  // run scripts (they accept projectPath where relevant)
  if (config.runFolderStructurer) runFeature(scriptPath("FileAndFolderSummary.js"), [projectPath]);
  if (config.runCodeSummary) runFeature(scriptPath("CodeSummary.js"), [projectPath]);
  if (config.runFixedText) runFeature(scriptPath("FixedText.js"));
  if (config.runTriedSolutions) runFeature(scriptPath("TriedSolutions.js"));

  const outputPath = collectOutputs();

  // Run final instruction after merging
  if (config.runFinalInstruction) {
    runFeature(scriptPath("FinalInstruction.js"));
    const instrFile = scriptOutputPath("FinalInstruction.md"); // ✅ corrected
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
