#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const readline = require("readline");

const ROOT = __dirname;
const DEPENDENCIES = path.join(ROOT, "src", "dependencies");
const YTZN_DIR = path.join(DEPENDENCIES, "ytzn");
const INI_DIR = path.join(DEPENDENCIES, "ini");
const INSTALLERS = {
  win32: path.join(YTZN_DIR, "windows_YTZN_DevBase_install.bat"),
  linux: path.join(YTZN_DIR, "linux_YTZN_DevBase_install.sh"),
};
const argv = process.argv.slice(2);
const nameIndex = argv.indexOf("--name");
const deviceName =
  nameIndex >= 0 && argv[nameIndex + 1] ? argv[nameIndex + 1] : "Br08ProDev";

function isInstalled() {
  const arch = process.arch === "ia32" ? "x86" : "x64";
  const libraryNames =
    process.platform === "win32"
      ? ["YTZN_DevBaseD.dll", "YTZN_DevDriverLogD.dll"]
      : [
          "libYTZN_DevBaseD.so",
          "libYTZN_DevDriverLogD.so",
          "libUsbWrapperD.so",
        ];
  const searchDirs =
    process.platform === "win32"
      ? [
          path.join(
            "C:\\ProgramData",
            "Grgbanking",
            "ytzn_devbase",
            "Dll",
            arch,
          ),
          "C:\\Windows\\System32",
          "C:\\Windows\\SysWOW64",
        ]
      : [
          "/usr/lib",
          "/usr/local/lib",
          "/lib",
          `/usr/lib/${process.arch === "x64" ? "x86_64-linux-gnu" : "i386-linux-gnu"}`,
          `/lib/${process.arch === "x64" ? "x86_64-linux-gnu" : "i386-linux-gnu"}`,
        ];
  return libraryNames.every((name) =>
    searchDirs.some((directory) => fs.existsSync(path.join(directory, name))),
  );
}

function installDevBase() {
  const installer = INSTALLERS[process.platform];
  if (!installer) {
    throw new Error(
      `Unsupported operating system "${process.platform}"; only Debian/Linux and Windows are supported.`,
    );
  }
  if (isInstalled()) return;

  console.log("YTZN_DevBase is not installed; running the bundled installer.");
  const result =
    process.platform === "win32"
      ? spawnSync(
          "C:\\Windows\\System32\\cmd.exe",
          ["/d", "/s", "/c", `"${installer}"`],
          { cwd: YTZN_DIR, stdio: "inherit", windowsHide: true },
        )
      : spawnSync("/bin/bash", [installer], {
          cwd: YTZN_DIR,
          stdio: "inherit",
        });
  if (result.error) {
    throw new Error(`Could not run the YTZN_DevBase installer: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `The YTZN_DevBase installer failed with exit code ${result.status}.`,
    );
  }
  if (!isInstalled()) {
    throw new Error(
      "The installer completed but the required YTZN_DevBase debug libraries are still unavailable.",
    );
  }
}

function usage() {
  console.log(`BR08 API console

Start without connecting to a device. Enter API method names at the prompt;
open and configure the device by calling the APIs in the order you need.

  node index.js [--name <logical-device-name>]
  help [COMMAND|flows]
  exit

For an API command, pass parameters as a JSON array, for example:
  OpenLogicalDevice ["Br08ProDev"]
  SetCommPara []

`);
}

function printApiHelp(apiHelp, name) {
  const names = name ? [name] : Object.keys(apiHelp);
  for (const apiName of names) {
    const item = apiHelp[apiName];
    if (!item) {
      console.error(`Unknown API: ${apiName}`);
      continue;
    }
    console.log(
      `${apiName} ${item.parameters}\n  Sample: ${JSON.stringify(item.sample)}`,
    );
  }
}

function printRecommendedFlows() {
  console.log(`Initialization
  OpenConnection []
  Or call OpenLogicalDevice, RegisterCallback, SetCommPara, and Init [0] separately.
  Wait for GetStatus [] to report idle (status 0x1A).

Cash in
  CashIn [0]
  Poll GetStatus [] for status and bill information. If the device requires an
  acknowledgement, call SendAckResponse [].

Cash out
  Dispense [dispenseData, 0] to pay selected recycler notes, or CashOut [0] for
  the device's cash-out/refund operation. Poll GetStatus [] for the result.
  CashCount [cashCountData, 0] can be used to count recycler notes if needed.
`);
}

async function main() {
  if (argv.includes("--help") || argv.includes("-h")) {
    const { API_HELP } = require("./src/device");
    usage();
    printApiHelp({
      OpenConnection: { parameters: "[]", sample: [] },
      ...API_HELP,
    });
    printRecommendedFlows();
    return;
  }

  installDevBase();
  if (!fs.existsSync(INI_DIR)) {
    throw new Error(`Device configuration directory does not exist: ${INI_DIR}`);
  }
  process.chdir(INI_DIR);

  const { Br08Device, API_HELP } = require("./src/device");
  const commandHelp = {
    OpenConnection: { parameters: "[]", sample: [] },
    ...API_HELP,
  };
  const device = new Br08Device({ name: deviceName });
  device.on("callback", (data) => {
    console.log(`Callback: ${JSON.stringify(data)}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "br08> ",
  });
  console.log("BR08 API console. No device connection is made automatically.");
  console.log('Type "help" to list APIs, or "exit" to quit.');

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }
    const separator = input.search(/\s/);
    const command = separator < 0 ? input : input.slice(0, separator);
    const rawArguments = separator < 0 ? "" : input.slice(separator).trim();

    if (command === "exit" || command === "quit") {
      rl.close();
      return;
    }
    if (command === "help") {
      if (rawArguments.toLowerCase() === "flows") {
        printRecommendedFlows();
      } else if (!rawArguments) {
        printApiHelp(commandHelp);
      } else {
        printApiHelp(commandHelp, rawArguments);
      }
      rl.prompt();
      return;
    }
    if (!Object.hasOwn(commandHelp, command)) {
      console.error(`Unknown command "${command}". Type "help".`);
      rl.prompt();
      return;
    }

    let parameters = [];
    try {
      if (rawArguments) {
        parameters = JSON.parse(rawArguments);
      }
      if (!Array.isArray(parameters)) {
        throw new Error("API parameters must be supplied as a JSON array.");
      }
      const result = await device[command](...parameters);
      console.log(JSON.stringify(result));
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    rl.prompt();
  });
  rl.on("close", () => process.exit(0));
  rl.prompt();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
