#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const readline = require("readline");
const { launchWithLocalRuntime } = require("./src/runtime");

const ROOT = __dirname;
const DEPENDENCIES = path.join(ROOT, "src", "dependencies");
const YTZN_DIR = path.join(DEPENDENCIES, "ytzn");
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
    throw new Error(
      `Could not run the YTZN_DevBase installer: ${result.error.message}`,
    );
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

  node index.js [--name <logical-device-name>] [-trace]
  npm start -trace
  help [COMMAND|flows]
  exit

Use -trace (or --trace) to show BR08 trace logs.
The CLI creates a repository-local Node runtime and adjacent INI files on first run.
Edits to those runtime INIs are preserved.
Use "cashin" for an event-driven receiving session and "cashout <amount>"
for a confirmed recycler payout.

For an API command, pass parameters as a JSON array, for example:
  OpenLogicalDevice ["Br08ProDev"]
  SetCommPara []

For an Electron main process:
  Missing INI files are copied beside the Electron executable on first connection.
  Edit those runtime copies before connecting.
  const { createDevice } = require("br08-console");
  const device = createDevice();
  await device.OpenConnection();

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
    if (item.description) {
      console.log(`  ${item.description}`);
    }
  }
}

function printRecommendedFlows() {
  console.log(`Initialization
  OpenConnection []
  Or call OpenLogicalDevice, RegisterCallback, SetCommPara, and Init [0] separately.
  Wait for GetStatus [] to report idle (status 0x1A).

Cash in
  cashin
  Press Enter (or type "done") when finished. Bills are accepted automatically.
  statusChanged emits STACKING, then STORED for recycler notes or STACKED for
  cash-box notes; value is the bill denomination.

Cash out
  cashout <amount> [-y]
  Review the exact recycler-note plan and confirm before dispensing.
  DISPENSING.value reports observed dispense value; total accumulates per payout.
  payoutValue [amount] is also available for immediate API-driven payout.
  CashCount [cashCountData, 0] can be used to count recycler notes if needed.
`);
}

function createDevice(options) {
  const { Br08Device } = require("./src/device");
  return new Br08Device(options);
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

  const runtimeExitCode = launchWithLocalRuntime(__filename, argv);
  if (runtimeExitCode !== null) {
    process.exitCode = runtimeExitCode;
    return;
  }

  installDevBase();
  process.chdir(path.dirname(process.execPath));

  const { Br08Device, API_HELP } = require("./src/device");
  const commandHelp = {
    OpenConnection: { parameters: "[]", sample: [] },
    cashin: {
      parameters: "",
      sample: [],
      description: "Accept bills until Enter or done is entered.",
    },
    cashout: {
      parameters: "<amount> [-y]",
      sample: [1700],
      description:
        "Preview an exact recycler payout, then confirm; -y skips confirmation.",
    },
    ...API_HELP,
  };
  const device = new Br08Device({ name: deviceName });
  const money = (currency, amount) => `${currency || ""} ${amount}`.trim();
  device.on("statusChanged", (state) => console.dir(state, { depth: null }));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "br08> ",
  });
  const queuedLines = [];
  let lineWaiter = null;
  let inputClosed = false;
  rl.on("line", (line) => {
    if (lineWaiter) {
      const resolve = lineWaiter;
      lineWaiter = null;
      resolve(line);
    } else {
      queuedLines.push(line);
    }
  });
  rl.on("close", () => {
    inputClosed = true;
    if (lineWaiter) {
      const resolve = lineWaiter;
      lineWaiter = null;
      resolve(null);
    }
  });
  const nextLine = () =>
    queuedLines.length
      ? Promise.resolve(queuedLines.shift())
      : inputClosed
        ? Promise.resolve(null)
        : new Promise((resolve) => {
            lineWaiter = resolve;
          });
  const cancelNextLine = () => {
    lineWaiter = null;
  };
  const confirm = async (question) => {
    process.stdout.write(`${question} [y/N] `);
    return /^y(es)?$/i.test(((await nextLine()) || "").trim());
  };

  const runCashin = async () => {
    const session = await device.startCashInSession();
    let needsStop = true;
    try {
      console.log(
        "Receiving - insert bills now.  Press Enter (or type 'done') to finish.",
      );
      const winner = await Promise.race([
        nextLine().then((line) => (line === null ? "eof" : "user")),
        session.ended,
      ]);
      if (winner === "full") {
        cancelNextLine();
        console.log("Cash box full - ending session.");
      }
      const summary = await device.stopCashInSession();
      needsStop = false;
      console.log(
        `Session finished: ${summary.notes} note(s), total ${money(summary.currency, summary.total)}`,
      );
      for (const [denomination, count] of summary.by) {
        console.log(`  ${count} x ${denomination}`);
      }
    } finally {
      if (needsStop) await device.stopCashInSession();
    }
  };

  const getRecyclerView = async () => {
    const [billResult, unitResult, countResult] = await Promise.all([
      device.GetCurrencyAssign(),
      device.GetRcUnitRecv(),
      device.GetRcUnitCount(),
    ]);
    const bills = billResult.data.stBillData
      .slice(0, billResult.data.ucBillData_ValiCount)
      .map((bill) => ({
        code: bill.ucEscrowCode,
        desc: bill.cCountryDesc,
        denomination: bill.uiDenomination,
      }));
    const units = unitResult.data.stRcUnit_unit.slice(
      0,
      unitResult.data.ucIsValidArrayCount,
    );
    const counts = countResult.data.stRcUnitCount_unit.slice(
      0,
      countResult.data.ucIsValidArrayCount,
    );
    return [1, 2, 3, 4].map((unit) => {
      const assignment = units.find((item) => item.ucRcUnitNo === unit);
      const bill = assignment
        ? bills.find((item) => item.code === assignment.ucEscrowCode)
        : null;
      const stock = counts.find((item) => item.ucRcUnitNo === unit);
      return {
        unit,
        assigned: Boolean(assignment),
        currency:
          (bill && bill.desc) || (assignment && assignment.cCountryDesc) || "",
        denomination: bill ? bill.denomination : 0,
        count: stock ? stock.RecycleCurrentCount : 0,
      };
    });
  };
  const printRecycler = (view) => {
    const rows = [
      ["UNIT", "RECYCLES", "NOTES"],
      ...view.map((unit) => [
        `RC${unit.unit}`,
        unit.assigned
          ? money(unit.currency, unit.denomination)
          : "(not assigned)",
        unit.count,
      ]),
    ];
    const widths = rows[0].map((_, index) =>
      Math.max(...rows.map((row) => String(row[index]).length)),
    );
    for (const row of rows) {
      console.log(
        "  " +
          row
            .map((cell, column) => String(cell).padEnd(widths[column]))
            .join("  ")
            .trimEnd(),
      );
    }
  };
  const runCashout = async (rawArguments) => {
    const args = rawArguments.split(/\s+/).filter(Boolean);
    const skipConfirm = args.includes("-y");
    const amounts = args.filter((argument) => argument !== "-y");
    const amount = Number(amounts[0]);
    if (amounts.length !== 1 || !Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("Usage: cashout <amount> [-y]   e.g. cashout 1700");
    }
    const preview = await device.previewPayout(amount);
    console.log(
      `Pay out ${money(preview.currency, amount)}: ` +
        preview.plan
          .map((item) => `${item.count} x ${item.denom} (RC${item.unit})`)
          .join(", "),
    );
    if (!skipConfirm && !(await confirm("Proceed?"))) {
      console.log("Cancelled.");
      return;
    }
    await device.payoutValue(amount, preview.plan);
    console.log("Cash out complete.");
    printRecycler(await getRecyclerView());
  };

  console.log("BR08 API console");
  console.log(
    'Type "help" to list APIs, "cashin" to accept bills, or "exit" to quit.',
  );

  for (;;) {
    rl.prompt();
    const line = await nextLine();
    if (line === null) break;
    const input = line.trim();
    if (!input) continue;
    const separator = input.search(/\s/);
    const command = separator < 0 ? input : input.slice(0, separator);
    const rawArguments = separator < 0 ? "" : input.slice(separator).trim();

    if (command === "exit" || command === "quit") {
      break;
    }
    if (command === "help") {
      if (rawArguments.toLowerCase() === "flows") {
        printRecommendedFlows();
      } else if (!rawArguments) {
        printApiHelp(commandHelp);
      } else {
        printApiHelp(commandHelp, rawArguments);
      }
      continue;
    }
    if (command === "cashin") {
      try {
        if (rawArguments) throw new Error("Usage: cashin");
        await runCashin();
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
      continue;
    }
    if (command === "cashout") {
      try {
        await runCashout(rawArguments);
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
      continue;
    }
    if (!Object.hasOwn(commandHelp, command)) {
      console.error(`Unknown command "${command}". Type "help".`);
      continue;
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
  }
  rl.close();
  process.exit(0);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { createDevice };
