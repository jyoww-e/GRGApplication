"use strict";

const fs = require("fs");
const path = require("path");

if (process.platform !== "win32") {
  throw new Error("The standalone Windows package must be built on Windows.");
}

const root = path.resolve(__dirname, "..");
const output = path.join(root, "standalone");

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Required package directory is missing: ${source}`);
  }
  fs.cpSync(source, destination, { recursive: true, force: true });
}

copyDirectory(path.join(root, "src"), path.join(output, "src"));
copyDirectory(path.join(root, "node_modules"), path.join(output, "node_modules"));
copyDirectory(
  path.join(root, "Library", "Include"),
  path.join(output, "Library", "Include"),
);
copyDirectory(
  path.join(root, "Library", "Windows"),
  path.join(output, "Library", "Windows"),
);
copyDirectory(
  path.join(root, "YTZN_Devbase_Output", "Windows"),
  path.join(output, "YTZN_Devbase_Output", "Windows"),
);

const iniDirectory = path.join(root, "YTZN_Devbase_Output", "Ini");
copyDirectory(
  iniDirectory,
  path.join(output, "YTZN_Devbase_Output", "Ini"),
);

const iniFiles = fs
  .readdirSync(iniDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.ini$/i.test(entry.name));

if (!iniFiles.some((entry) => entry.name.toLowerCase() === "grgdtatm_commcfg.ini")) {
  throw new Error(`GRGDTATM_CommCfg.ini is missing from ${iniDirectory}`);
}

// DevBase is called with p_bIsExePath=true, so its INI must sit beside node.exe.
for (const entry of iniFiles) {
  fs.copyFileSync(
    path.join(iniDirectory, entry.name),
    path.join(output, entry.name),
  );
}

fs.copyFileSync(process.execPath, path.join(output, "node.exe"));
fs.writeFileSync(
  path.join(output, "Start BR08.bat"),
  '@echo off\r\n"%~dp0node.exe" "%~dp0src\\index.js" %*\r\nexit /b %errorlevel%\r\n',
  "ascii",
);

console.log(`Standalone app built at ${output}`);
