const { exec } = require("child_process");

// Safe chalk import
let chalk;
try {
    chalk = require("chalk");
} catch (e) {
    console.warn("⚠️  Chalk not installed. Run: npm install -g chalk@4");
    chalk = {
        gray: t => t,
        cyan: t => t,
        green: t => t,
        yellow: t => t,
        white: t => t,
        bold: t => t
    };
}

// Configurable max column width
const MAX_WIDTHS = {
    "#": 4,
    Name: 20,
    IPv4: 15,
    IPv6: 25,
    Gateway: 20,
    Description: 20
};

const wrapText = (text, width) => {
    const words = text.match(new RegExp(`.{1,${width}}`, "g")) || [""];
    return words;
};

exec("ipconfig", (err, stdout) => {
    if (err) return console.error("Error:", err);

    const lines = stdout.split(/\r?\n/);
    const interfaces = [];
    let current = null;

    for (let line of lines) {
        line = line.trim();
        if (/adapter/i.test(line)) {
            if (current) interfaces.push(current);
            current = {
                Name: line.replace("adapter", "").replace(":", "").trim(),
                IPv4: "N/A",
                IPv6: "N/A",
                Gateway: "N/A",
                Description: "Unknown"
            };
        }

        if (current) {
            if (line.startsWith("IPv4 Address")) {
                current.IPv4 = line.split(":").pop().trim();
            } else if (line.startsWith("IPv6 Address") || line.startsWith("Link-local IPv6 Address")) {
                current.IPv6 = line.split(":").pop().trim();
            } else if (line.startsWith("Default Gateway")) {
                const val = line.split(":").pop().trim();
                if (val) current.Gateway = val;
            }
        }
    }
    if (current) interfaces.push(current);

    // Add descriptions
    interfaces.forEach(i => {
        const name = i.Name.toLowerCase();
        if (name.includes("wifi")) i.Description = "WiFi adapter";
        else if (name.includes("ethernet 4")) i.Description = "Main LAN";
        else if (name.includes("ethernet") && i.IPv4 === "N/A") i.Description = "Disconnected";
        else if (name.includes("vethernet")) i.Description = "WSL/VM Virtual";
        else if (name.includes("local area")) i.Description = "Virtual adapter";
    });

    const headers = Object.keys(MAX_WIDTHS);

    const wrapRow = (row, index) => {
        const rowData = { "#": `${index + 1}`, ...row };
        const cells = headers.map(h => wrapText(rowData[h], MAX_WIDTHS[h]));
        const maxLines = Math.max(...cells.map(c => c.length));
        const lines = [];

        for (let i = 0; i < maxLines; i++) {
            lines.push("│ " + cells.map((c, idx) => {
                const val = c[i] || "";
                const padded = val.padEnd(MAX_WIDTHS[headers[idx]], " ");
                return colorText(padded, row.Description);
            }).join(" │ ") + " │");
        }

        return lines;
    };

    const colorText = (text, desc) => {
        if (desc.includes("Disconnected")) return chalk.gray(text);
        if (desc.includes("WiFi")) return chalk.cyan(text);
        if (desc.includes("LAN")) return chalk.green(text);
        if (desc.includes("Virtual")) return chalk.yellow(text);
        return chalk.white(text);
    };

    const borderLine = headers.map(h => "─".repeat(MAX_WIDTHS[h] + 2)).join("─");
    const separatorLine = headers.map(h => "─".repeat(MAX_WIDTHS[h] + 2)).join("┼");

    const drawLine = (left, mid, right) => `${left}${separatorLine}${right}`;
    const top = drawLine("┌", "┬", "┐");
    const mid = drawLine("├", "┼", "┤");
    const rowSep = drawLine("├", "┼", "┤");
    const bottom = drawLine("└", "┴", "┘");

    console.log(top);
    console.log("│ " + headers.map(h => chalk.bold(h.padEnd(MAX_WIDTHS[h]))).join(" │ ") + " │");
    console.log(mid);

    interfaces.forEach((intf, idx) => {
        const wrappedLines = wrapRow(intf, idx);
        wrappedLines.forEach(line => console.log(line));
        if (idx !== interfaces.length - 1) console.log(rowSep);
    });

    console.log(bottom);

    // 📘 Color Legend
    console.log(" " + chalk.cyan("● WiFi adapter") + "   " +
                chalk.green("● Main LAN") + "   " +
                chalk.yellow("● Virtual adapter") + "   " +
                chalk.gray("● Disconnected"));
});
