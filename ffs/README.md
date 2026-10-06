# ffs

`ffs` recursively scans a folder and writes its complete file/folder structure to a Markdown file.

It does **not** inspect file contents and has **no extension/type allowlist**.

Anything the filesystem exposes is included:

- files
- folders
- hidden entries
- files with extensions
- files without extensions
- unknown/custom extensions
- nested directories

## Install globally

From this project directory:

```bash
npm install -g .
```

## Usage

```bash
ffs "output.md" "target-folder"
```

Example:

```bash
ffs "output.md" "D:\Projects\MyProject"
```

Linux/macOS:

```bash
ffs "output.md" "/home/user/projects/my-project"
```

## Output

The generated Markdown contains a tree such as:

```text
MyProject/
├── .git/
│   ├── HEAD
│   └── config
├── src/
│   ├── app.js
│   └── main.ts
├── image.png
├── video.mp4
├── report.pdf
└── .env
```

No file contents are read.

## Notes

`ffs` scans recursively with no artificial depth limit. Filesystem permission errors are reported at the end while the rest of the scan continues.

If the output Markdown file is inside the target folder, `ffs` excludes that output file from the generated tree so the result does not contain itself.
