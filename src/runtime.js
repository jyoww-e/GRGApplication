"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { trace } = require("./trace");

const DEPENDENCIES_DIR = path.join(__dirname, "dependencies");
const INI_DIRECTORY = path.join(DEPENDENCIES_DIR, "ini");
const INI_FILES = ["GRGDTATM_CommCfg.ini", "Br08ProDevCfg.ini"];

function platformDirectory(platform) {
  if (platform === "win32") return "Windows";
  if (platform === "linux") return "Linux";
  throw new Error(
    `Unsupported operating system "${platform}"; BR08 supports Linux and Windows.`,
  );
}

function runtimeDirectory() {
  const platform = platformDirectory(process.platform).toLowerCase();
  return path.join(
    DEPENDENCIES_DIR,
    "runtime",
    platform,
    process.arch,
    `node-${process.versions.node}`,
  );
}

function executableName(platform = process.platform) {
  return platform === "win32" ? "node.exe" : "node";
}

function configSource(name, platform = process.platform) {
  const platformSource = path.join(
    INI_DIRECTORY,
    platformDirectory(platform),
    name,
  );
  return fs.existsSync(platformSource)
    ? platformSource
    : path.join(INI_DIRECTORY, name);
}

function copyIfMissing(source, destination) {
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Required runtime file is missing: ${source}`);
  }
  if (fs.existsSync(destination)) {
    if (!fs.statSync(destination).isFile()) {
      throw new Error(`Expected a file but found another type at ${destination}`);
    }
    return false;
  }

  try {
    fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
    return true;
  } catch (error) {
    if (error.code === "EEXIST" && fs.statSync(destination).isFile()) {
      return false;
    }
    throw new Error(
      `Could not copy ${source} to ${destination}: ${error.message}`,
    );
  }
}

function normalizeDefaultLogDirectory(configPath, platform) {
  const previousDirectory =
    platform === "linux" ? ".\\DevDriverLog\\" : "./DevDriverLog/";
  const runtimeDirectory =
    platform === "linux" ? "./DevDriverLog/" : ".\\DevDriverLog\\";
  const contents = fs.readFileSync(configPath, "utf8");
  const linePattern = /^([ \t]*LOGDir[ \t]*=[ \t]*)([^\r\n]*?)([ \t]*)(\r?)$/im;
  const match = linePattern.exec(contents);
  if (!match || match[2].trim() !== previousDirectory) return false;

  const updated = contents.replace(
    linePattern,
    `${match[1]}${runtimeDirectory}${match[3]}${match[4]}`,
  );
  fs.writeFileSync(configPath, updated, "utf8");
  return true;
}

function migrateSerialPort(configPath, platform) {
  const contents = fs.readFileSync(configPath, "utf8");
  const lines = contents.split(/\r?\n/);
  let section = "";
  let portSettings;
  for (const line of lines) {
    const sectionMatch = /^\s*\[([^\]]+)\]/.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1].trim().toLowerCase();
    } else if (section === "br08prodev") {
      const portMatch = /^\s*ComID\s*=\s*(.*?)\s*$/i.exec(line);
      if (!portMatch) continue;

      if (platform === "linux") {
        const usbPort = /^\/dev\/ttyUSB(\d+)$/i.exec(portMatch[1]);
        const serialPort = /^\/dev\/ttyS(\d+)$/i.exec(portMatch[1]);
        if (usbPort) {
          portSettings = {
            ComID: usbPort[1],
            USBToSerial: "1",
            SerialToUSB: "1",
          };
        } else if (serialPort) {
          portSettings = {
            ComID: String(Number(serialPort[1]) + 1),
            USBToSerial: "0",
            SerialToUSB: "0",
          };
        }
      } else if (platform === "win32" && /^\/dev\/ttyUSB0$/i.test(portMatch[1])) {
        portSettings = {
          ComID: "3",
          USBToSerial: "0",
          SerialToUSB: "0",
        };
      }
      break;
    }
  }
  if (!portSettings) return false;

  const newline = contents.includes("\r\n") ? "\r\n" : "\n";
  const updatedLines = [];
  const foundSettings = new Set();
  section = "";
  for (const line of lines) {
    const sectionMatch = /^\s*\[([^\]]+)\]/.exec(line);
    if (sectionMatch) {
      if (section === "br08prodev") {
        for (const [key, value] of Object.entries(portSettings)) {
          if (!foundSettings.has(key)) updatedLines.push(`${key}=${value}`);
        }
      }
      section = sectionMatch[1].trim().toLowerCase();
      updatedLines.push(line);
      continue;
    }
    if (section === "br08prodev") {
      const settingMatch =
        /^([ \t]*)(ComID|USBToSerial|SerialToUSB)([ \t]*=[ \t]*)(.*?)([ \t]*)$/i.exec(
          line,
        );
      if (settingMatch) {
        const key = {
          comid: "ComID",
          serialtousb: "SerialToUSB",
          usbtoserial: "USBToSerial",
        }[settingMatch[2].toLowerCase()];
        const value = portSettings[key];
        updatedLines.push(
          `${settingMatch[1]}${key}${settingMatch[3]}${value}${settingMatch[5]}`,
        );
        foundSettings.add(key);
        continue;
      }
    }
    updatedLines.push(line);
  }
  if (section === "br08prodev") {
    for (const [key, value] of Object.entries(portSettings)) {
      if (!foundSettings.has(key)) updatedLines.push(`${key}=${value}`);
    }
  }
  fs.writeFileSync(configPath, updatedLines.join(newline), "utf8");
  return true;
}

function linuxSerialPortFromIni(configPath, deviceName) {
  const contents = fs.readFileSync(configPath, "utf8");
  let inDeviceSection = false;
  const settings = {};
  for (const line of contents.split(/\r?\n/)) {
    const section = /^\s*\[([^\]]+)\]/.exec(line);
    if (section) {
      inDeviceSection =
        section[1].trim().toLowerCase() === deviceName.toLowerCase();
      continue;
    }
    if (!inDeviceSection || /^\s*[;#]/.test(line)) continue;
    const delimiter = line.indexOf("=");
    if (delimiter < 0) continue;
    settings[line.slice(0, delimiter).trim().toLowerCase()] = line
      .slice(delimiter + 1)
      .trim();
  }

  if (Number(settings.commtype) !== 1) return null;
  const comId = Number(settings.comid);
  if (!Number.isInteger(comId)) return null;

  const usbToSerial =
    settings.usbtoserial === undefined ? 0 : Number(settings.usbtoserial);
  const serialToUsb =
    settings.serialtousb === undefined
      ? usbToSerial
      : Number(settings.serialtousb);
  if (usbToSerial !== serialToUsb) {
    throw new Error("USBToSerial and SerialToUSB must have the same value.");
  }
  if (usbToSerial === 0 && comId >= 1) {
    return `/dev/ttyS${comId - 1}`;
  }
  if (usbToSerial === 1 && comId >= 0) {
    return `/dev/ttyUSB${comId}`;
  }
  if (usbToSerial === 2 && settings.extendstr) {
    return path.posix.join("/dev", settings.extendstr);
  }
  return null;
}

function prepareRuntimeFiles(executableDirectory, platform = process.platform) {
  platformDirectory(platform);
  fs.mkdirSync(executableDirectory, { recursive: true });

  const iniFiles = INI_FILES.map((name) => {
    const source = configSource(name, platform);
    const destination = path.join(executableDirectory, name);
    const copied = copyIfMissing(source, destination);
    const migratedLogDirectory =
      name === "Br08ProDevCfg.ini"
        ? normalizeDefaultLogDirectory(destination, platform)
        : false;
    const migratedSerialPort =
      name === "GRGDTATM_CommCfg.ini"
        ? migrateSerialPort(destination, platform)
        : false;
    return {
      name,
      source,
      path: destination,
      copied,
      migrated: migratedLogDirectory || migratedSerialPort,
      migratedLogDirectory,
      migratedSerialPort,
    };
  });

  const logDirectory = path.join(executableDirectory, "DevDriverLog");
  fs.mkdirSync(logDirectory, { recursive: true });

  return { iniFiles, logDirectory };
}

function localRuntimePaths(directory = runtimeDirectory()) {
  return {
    directory,
    executable: path.join(directory, executableName()),
  };
}

function samePath(left, right) {
  const resolvedLeft = path.resolve(left);
  const resolvedRight = path.resolve(right);
  return process.platform === "win32"
    ? resolvedLeft.toLowerCase() === resolvedRight.toLowerCase()
    : resolvedLeft === resolvedRight;
}

function ensureLocalRuntime(directory = runtimeDirectory()) {
  fs.mkdirSync(directory, { recursive: true });
  const paths = localRuntimePaths(directory);
  if (!samePath(process.execPath, paths.executable)) {
    copyIfMissing(process.execPath, paths.executable);
  }
  if (process.platform !== "win32") {
    fs.chmodSync(paths.executable, 0o755);
  }
  const files = prepareRuntimeFiles(directory);
  return { ...paths, ...files };
}

function launchWithLocalRuntime(scriptPath, args) {
  const executableDirectory = path.dirname(process.execPath);
  const hasExecutableIniFiles = INI_FILES.every((name) =>
    fs.existsSync(path.join(executableDirectory, name)),
  );
  const paths = localRuntimePaths();

  if (hasExecutableIniFiles && !samePath(process.execPath, paths.executable)) {
    return null;
  }

  const runtime = ensureLocalRuntime();
  if (samePath(process.execPath, runtime.executable)) {
    return null;
  }

  trace(
    "Starting repository-local Node runtime",
    {
      executable: runtime.executable,
      iniFiles: runtime.iniFiles.map(({ path: filePath, copied, migrated }) => ({
        path: filePath,
        copied,
        migrated,
      })),
    },
    args,
  );

  const result = spawnSync(runtime.executable, [scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) {
    throw new Error(
      `Could not start repository-local Node runtime ${runtime.executable}: ${result.error.message}`,
    );
  }
  if (result.signal) {
    throw new Error(
      `Repository-local Node runtime stopped by signal ${result.signal}.`,
    );
  }
  return result.status ?? 1;
}

module.exports = {
  ensureLocalRuntime,
  INI_FILES,
  linuxSerialPortFromIni,
  launchWithLocalRuntime,
  prepareRuntimeFiles,
};
