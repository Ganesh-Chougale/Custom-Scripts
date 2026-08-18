# 📚 Codex: AI Context Aggregation CLI

Codex is a globally installed command-line tool designed to instantly scan any codebase and generate a token-optimized, consolidated Markdown report. It maps folder structures, strips unnecessary whitespace/comments, and bundles your local project instructions so you can feed massive codebases to an AI without losing context.

## 🛠️ Prerequisites
Before installing Codex on a new machine, ensure you have **Node.js** installed.
* Check if Node is installed by opening a terminal and running: `node -v`
* If not, download and install it from [nodejs.org](https://nodejs.org/).

---

## 🚀 Installation Setup

1. **Unzip the Codex Folder** Extract the Codex folder anywhere on your new machine (e.g., `C:\Tools\Codex`).

2. **Open Terminal in the Codex Folder**
   Navigate *inside* the extracted folder where `package.json` and `Runner.js` live.

3. **Install Globally**
   Run the following command to register Codex as a native system command:
```bash
npm install -g .
```

*Note: On Mac/Linux, you might need to use `sudo npm install -g .` depending on your permissions.*

You can now safely close this terminal. Codex is installed and ready to use from anywhere.

---

## 💻 How to Use Codex

Because Codex is installed globally, you use it by opening a terminal inside the project you are actively working on (not inside the Codex tool folder).

### Basic Usage (Defaults)

To scan your current directory and generate an `output.md` file in the same folder, run:

```bash
codex
```

### Advanced Usage (Custom Paths)

The command signature accepts an output file path first, and an optional input directory second:

```bash
codex <output_file_path> <input_directory>
```

**Examples:**

1. Name the output file something specific (scans current directory):
```bash
codex frontend-report.md
```


2. Name the output file AND specify a different folder to scan:
```bash
codex ./docs/backend-report.md ./src/backend
```



---

## 📂 Project-Specific Instructions (The Input Folder)

Codex allows you to append custom instructions, fixed text, or tried solutions to your final report. These are kept **local to the project you are scanning**, meaning different projects can have different instructions without overwriting each other.

To add custom instructions to a project:

1. Create a folder named `Input` at the root of your target project.
2. Inside `Input`, you can create the following text files:
* `Instructions.txt` - (Appended to the bottom as "Final Instruction")
* `Fixed.md` - (Injected into the report as "Fixed Text")
* `TriedSolutions.txt` - (Injected as "Previous Takes")



If these files do not exist in the target project, Codex will simply skip them and generate the rest of the report.

---

## ⚙️ Configuration (codex.config.js)

If you want to turn specific Codex features on or off globally, edit the `codex.config.js` file located in your **original, unzipped Codex folder**.

```javascript
module.exports = {
  runCodeSummary: true,
  runFolderStructurer: true,
  runFixedText: false,
  runTriedSolutions: false,
  runFinalInstruction: true,
};
```

*Note: Any changes made to `codex.config.js` take effect immediately the next time you run `codex` on any project.*