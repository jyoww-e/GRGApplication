#!/usr/bin/env node
"use strict";
const fs = require("fs");
const readline = require("readline");
const path = require("path");

const workdir =
  process.env.BR08_WORKDIR ||
  path.resolve(__dirname, "..", "YTZN_Devbase_Output", "Ini");
process.chdir(workdir);

// ---------------------------------------------------------------- tiny terminal helpers
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (n) => (s) => (color ? `\x1b[${n}m${s}\x1b[0m` : String(s));
const [bold, dim, red, green, yellow, cyan] = [1, 2, 31, 32, 33, 36].map(paint);
const out = (...a) => console.log(...a);

// ---------------------------------------------------------------- load native pieces (friendly errors)
let native, Br08Device, ST, codes, planPayout, splitRounds;
try {
  native = require("./native");
  ({ Br08Device, ST } = require("./device"));
  codes = require("./codes");
  ({ planPayout, splitRounds } = require("./payout"));
} catch (e) {
  console.error(red("Cannot load the BR08 library.\n") + e.message);
  process.exit(1);
}
codes.load(native.SDK_ROOT);

const argv = process.argv.slice(2);
const nameArg = argv.indexOf("--name");
const dev = new Br08Device({
  name: nameArg >= 0 ? argv[nameArg + 1] : "Br08ProDev",
});

// ---------------------------------------------------------------- line input (works while commands are running)
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: bold("br08> "),
});
const lines = [];
let waiter = null;
let inputClosed = false;
rl.on("line", (l) => {
  if (waiter) {
    const w = waiter;
    waiter = null;
    w(l);
  } else lines.push(l);
});
rl.on("close", () => {
  inputClosed = true;
  if (waiter) {
    const w = waiter;
    waiter = null;
    w(null);
  }
});
const nextLine = () =>
  lines.length
    ? Promise.resolve(lines.shift())
    : inputClosed
      ? Promise.resolve(null)
      : new Promise((r) => {
          waiter = r;
        });
const cancelNextLine = () => {
  waiter = null;
};
async function confirm(q) {
  process.stdout.write(`${q} [y/N] `);
  return /^y(es)?$/i.test(((await nextLine()) || "").trim());
}

let shuttingDown = false;
async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  out("\nClosing device...");
  try {
    await Promise.race([dev.close(), new Promise((r) => setTimeout(r, 8000))]);
  } catch {
    /* ignore */
  }
  process.exit(code);
}
rl.on("SIGINT", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// ---------------------------------------------------------------- formatting
const unitName = (u) => (u === 0 ? "stacker / cash box" : `RC${u}`);
const money = (desc, denom) => `${desc || ""} ${denom}`.trim();
function table(rows) {
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => String(r[i]).length)),
  );
  rows.forEach((r, n) =>
    out(
      "  " +
        r
          .map((c, i) => String(c).padEnd(widths[i]))
          .join("  ")
          .trimEnd() +
        (n === 0 ? "" : ""),
    ),
  );
}

async function recyclerView() {
  const [bills, units, counts] = await Promise.all([
    dev.getBills(),
    dev.getRcUnits(),
    dev.getCounts(),
  ]);
  return [1, 2, 3, 4].map((unit) => {
    const u = units.find((x) => x.unit === unit);
    const b = u && bills.find((x) => x.code === u.code);
    return {
      unit,
      assigned: !!u,
      code: u && u.code,
      desc: (b && b.desc) || (u && u.desc) || "",
      denom: b ? b.denom : 0,
      count: (counts.find((x) => x.unit === unit) || {}).count || 0,
    };
  });
}
function printRecycler(view) {
  table([
    ["UNIT", "RECYCLES", "NOTES"],
    ...view.map((v) => [
      `RC${v.unit}`,
      v.assigned ? money(v.desc, v.denom) : "(not assigned)",
      v.count,
    ]),
  ]);
}

// ---------------------------------------------------------------- persistent device messages
let verbose = false;
const KEY = {
  [ST.RETURNING]: () => dim("  returning bill..."),
  [ST.PAYING]: () => dim("  dispensing..."),
  [ST.PAY_STAY]: () => yellow("  notes are at the outlet - please take them"),
  [ST.COLLECTING]: () => dim("  moving notes to the cash box..."),
  [ST.COLLECTED]: (s) => dim(`  settled ${unitName(s.data[0])}`),
  [ST.CASH_BOX_FULL]: () => yellow("  cash box is full"),
  [ST.CASH_BOX_OUT]: () => yellow("  cash box was removed"),
  [ST.ACK_FAIL]: () => yellow("  device reported ACK failure"),
};
function attachLogging() {
  dev.on("status", (s) => {
    if (verbose) out(dim(`  [status] ${s.name}`));
    else if (KEY[s.id]) out(KEY[s.id](s));
  });
  dev.on("payoutInventory", ({ status, changes, counts }) => {
    if (changes.length) {
      const details = changes
        .map(({ unit, before, after, count, denom, desc }) => {
          const value = denom
            ? `${count} x ${money(desc, denom)}`
            : `${count} note(s)`;
          return `RC${unit}: ${before} -> ${after} (${value})`;
        })
        .join("; ");
      out(dim(`  ${status} recycler count change: ${details}`));
    } else {
      const snapshot = counts.map(({ unit, count }) => `RC${unit}=${count}`).join(" ");
      out(
        dim(
          `  ${status}: no recycler count decrease in this snapshot (${snapshot || "counts unavailable"})`,
        ),
      );
    }
  });
  dev.on("failure", (f) => out(red(`  DEVICE FAILURE: ${f.desc}`)));
  dev.on("complete", (c) => {
    if (c.result !== 0) out(red(`  operation reported an error: ${c.endDesc}`));
  });
  dev.on("disconnected", () => out(red("  device disconnected")));
  dev.on("hwLogProgress", (p) =>
    out(dim(`  hardware log: ${p.uiLogNo_now}/${p.uiLogNo_end}`)),
  );
  dev.on("firmwareProgress", (p) =>
    out(
      dim(
        `  firmware update: ${p.uiUpdateNo_now}/${p.uiUpdateNo_end} ` +
          `(status 0x${p.ucUpdateStatus.toString(16).toUpperCase()}, ` +
          `${
            p.ucIsUpdateOK
              ? "success"
              : p.ucUpdateStatus === 0xd5
                ? "failed"
                : "in progress"
          })`,
      ),
    ),
  );
  dev.on("warn", (e) => out(yellow(`  warning: ${e.message}`)));
}

// ---------------------------------------------------------------- commands
async function cmdCashin() {
  await dev.startReceiving();
  const t = { total: 0, notes: 0, by: new Map(), desc: "" };
  let boxFull;
  const stop = new Promise((r) => {
    boxFull = r;
  });

  const onEscrow = (b) => {
    out(
      cyan(
        `  bill detected: ${money(b.cCountryDesc, b.uiDenomination)} - accepting`,
      ),
    );
    dev.acceptEscrow().catch(async (e) => {
      out(red(`  could not accept bill: ${e.message}`));
      try {
        await dev.returnEscrow();
      } catch {
        /* ignore */
      }
    });
  };
  const onVend = (b) => {
    if (!b) return;
    t.total += b.uiDenomination;
    t.notes++;
    t.desc = b.cCountryDesc;
    t.by.set(b.uiDenomination, (t.by.get(b.uiDenomination) || 0) + 1);
    out(
      green(`  + ${money(b.cCountryDesc, b.uiDenomination)}`) +
        dim(`   (session total ${t.total})`),
    );
  };
  const onStacked = ({ unit }) => out(dim(`    stored in ${unitName(unit)}`));
  const onReject = ({ desc }) => out(yellow(`  bill rejected: ${desc}`));
  const onStatus = (s) => {
    if (s.id === ST.CASH_BOX_FULL) boxFull();
  };
  dev.on("escrow", onEscrow);
  dev.on("vend", onVend);
  dev.on("stacked", onStacked);
  dev.on("rejecting", onReject);
  dev.on("status", onStatus);

  out(
    bold("Receiving - insert bills now.") +
      dim("  Press Enter (or type 'done') to finish."),
  );
  const winner = await Promise.race([
    nextLine().then(() => "user"),
    stop.then(() => "full"),
  ]);
  if (winner === "full") {
    cancelNextLine();
    out(red("Cash box full - ending session."));
  }
  try {
    await dev.stopReceiving();
  } finally {
    dev.off("escrow", onEscrow);
    dev.off("vend", onVend);
    dev.off("stacked", onStacked);
    dev.off("rejecting", onReject);
    dev.off("status", onStatus);
  }
  out(
    bold(
      `Session finished: ${t.notes} note(s), total ${money(t.desc, t.total)}`,
    ),
  );
  for (const [d, n] of [...t.by].sort((a, b) => b[0] - a[0]))
    out(`  ${n} x ${d}`);
}

function findCurrency(supported, query) {
  const q = query.toUpperCase();
  return supported.find(
    (c) =>
      c.desc.toUpperCase() === q ||
      String(c.type) === q ||
      "0X" + c.type.toString(16).toUpperCase().padStart(2, "0") === q,
  );
}

async function cmdBills(args = []) {
  if (args.length > 1)
    throw new Error("Usage: bills [currency]");
  if (args.length === 1) {
    const supported = await dev.getSupportedCurrencies();
    const currency = findCurrency(supported, args[0]);
    if (!currency)
      throw new Error(
        `Unsupported currency "${args[0]}". Run "currency" to list supported currencies.`,
      );
    const bills = await dev.getBillsForCurrency(currency);
    out(`Denominations assigned for ${currency.desc}:`);
    table([
      ["CODE", "VALUE"],
      ...bills.map((b) => [
        "0x" + b.code.toString(16).toUpperCase(),
        money(b.desc, b.denom),
      ]),
    ]);
    return;
  }
  const [bills, en, units] = await Promise.all([
    dev.getBills(),
    dev.getEnabled(),
    dev.getRcUnits(),
  ]);
  table([
    ["CODE", "VALUE", "ACCEPTED", "RECYCLES IN"],
    ...bills.map((b) => {
      const i = b.code - 0x61;
      const rc = units
        .filter((u) => u.code === b.code)
        .map((u) => `RC${u.unit}`)
        .join(", ");
      return [
        "0x" + b.code.toString(16).toUpperCase(),
        money(b.desc, b.denom),
        i >= 0 && i < 8 ? (en.flags[i] ? "yes" : "no") : "?",
        rc || "cash box",
      ];
    }),
  ]);
}

async function cmdEnable(args, on) {
  const bills = await dev.getBills();
  const en = await dev.getEnabled();
  const targets =
    args[0] === "all"
      ? bills
      : args.map((a) => {
          const b = bills.find((x) => x.denom === Number(a));
          if (!b)
            throw new Error(
              `No such denomination: ${a}   (run "bills" to see them)`,
            );
          return b;
        });
  if (!targets.length)
    throw new Error(`Usage: ${on ? "enable" : "disable"} <value ...|all>`);
  for (const b of targets) {
    const i = b.code - 0x61;
    if (i < 0 || i > 7)
      throw new Error(
        `Escrow code 0x${b.code.toString(16)} is outside the supported range 0x61-0x68`,
      );
    en.flags[i] = on ? 1 : 0;
  }
  await dev.setEnabled(en);
  await cmdBills();
}

async function cmdCurrency(args) {
  if (args.length > 1)
    throw new Error("Usage: currency [CODE]");
  const [sup, cur] = await Promise.all([
    dev.getSupportedCurrencies(),
    dev.getCurrentCurrency(),
  ]);
  if (!args[0]) {
    table([
      ["CODE", "CURRENCY", ""],
      ...sup.map((c) => [
        "0x" + c.type.toString(16).toUpperCase().padStart(2, "0"),
        c.desc,
        c.type === cur.type ? "<- accepting" : "",
      ]),
    ]);
    return;
  }
  const q = args[0].toUpperCase();
  const m = findCurrency(sup, q);
  if (!m)
    throw new Error(
      `Unsupported currency "${args[0]}". Run "currency" to list them.`,
    );
  await dev.setCurrentCurrency(m);
  out(
    green(`Now accepting ${m.desc}.`) +
      dim("  Re-assign the recycler units next:  recycle set <rc> <value>"),
  );
}

async function cmdRecycle(args) {
  if (args[0] === "set") {
    const unit = Number(args[1]);
    const denom = Number(args[2]);
    if (!(unit >= 1 && unit <= 4) || !(denom > 0))
      throw new Error(
        "Usage: recycle set <1-4> <value>   e.g.  recycle set 1 100",
      );
    const [bills, units, counts, en] = await Promise.all([
      dev.getBills(),
      dev.getRcUnits(),
      dev.getCounts(),
      dev.getEnabled(),
    ]);
    const bill = bills.find((b) => b.denom === denom);
    if (!bill)
      throw new Error(
        `Unknown denomination ${denom}. Run "bills" to see the list (the right currency must be selected).`,
      );
    const held = (counts.find((c) => c.unit === unit) || {}).count || 0;
    if (held > 0)
      throw new Error(
        `RC${unit} still holds ${held} note(s) and the device ignores changes while a unit has notes.\n  Move them to the cash box first:  settle ${unit}=${held}`,
      );
    const next = units
      .filter((u) => u.unit !== unit)
      .concat({ unit, code: bill.code, country: bill.country, desc: bill.desc })
      .sort((a, b) => a.unit - b.unit);
    await dev.setRcUnits(next);
    out(green(`RC${unit} will now recycle ${money(bill.desc, bill.denom)}.`));
    if (!en.flags[bill.code - 0x61])
      out(
        yellow(
          `  note: ${denom} is not enabled for acceptance - run:  enable ${denom}`,
        ),
      );
  } else if (args.length) {
    throw new Error("Usage: recycle   |   recycle set <1-4> <value>");
  }
  printRecycler(await recyclerView());
}

function parseUnitCounts(args, max) {
  const plan = args.map((a) => {
    const m = /^([1-4])=(\d+)$/.exec(a);
    if (!m)
      throw new Error(
        `Bad argument "${a}" - expected <unit>=<count>, e.g. 1=10`,
      );
    return { unit: Number(m[1]), count: Number(m[2]) };
  });
  if (new Set(plan.map((p) => p.unit)).size !== plan.length)
    throw new Error("Each unit may be listed only once.");
  for (const p of plan)
    if (p.count < 1 || p.count > max)
      throw new Error(`RC${p.unit}: count must be 1-${max}`);
  return plan;
}

async function cmdDispense(args) {
  if (!args.length)
    throw new Error(
      "Usage: dispense <unit>=<count> ...   e.g.  dispense 1=10 2=5   (max 35 per unit)",
    );
  await dev.dispense(parseUnitCounts(args, 35));
  out(green("Dispense finished."));
}

async function cmdCashout(args) {
  const skipConfirm = args.includes("-y");
  const amount = Number(args.find((a) => a !== "-y"));
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error("Usage: cashout <amount> [-y]   e.g.  cashout 1700");
  const view = await recyclerView();
  const plan = planPayout(
    amount,
    view
      .filter((v) => v.assigned)
      .map((v) => ({ unit: v.unit, denom: v.denom, count: v.count })),
  );
  if (!plan) {
    printRecycler(view);
    throw new Error(
      `Cannot pay exactly ${amount} with the notes currently in the recycler.`,
    );
  }
  const desc = (view.find((v) => v.desc) || {}).desc || "";
  out(
    bold(`Pay out ${money(desc, amount)}:`) +
      " " +
      plan.map((p) => `${p.count} x ${p.denom} (RC${p.unit})`).join(", "),
  );
  if (!skipConfirm && !(await confirm("Proceed?"))) {
    out("Cancelled.");
    return;
  }
  const rounds = splitRounds(plan);
  for (let i = 0; i < rounds.length; i++) {
    if (rounds.length > 1) out(dim(`  round ${i + 1}/${rounds.length}`));
    await dev.dispense(
      rounds[i].map((r) => ({ unit: r.unit, count: r.count })),
    );
  }
  out(green("Cash out complete."));
  printRecycler(await recyclerView());
}

async function cmdSettle(args) {
  let plan;
  if (!args.length || args[0] === "all") {
    plan = (await recyclerView())
      .filter((v) => v.count > 0)
      .map((v) => ({ unit: v.unit, count: v.count }));
    if (!plan.length) {
      out("Recycler is empty - nothing to settle.");
      return;
    }
    out(
      bold("Move to cash box: ") +
        plan.map((p) => `RC${p.unit}=${p.count}`).join(", "),
    );
    if (!(await confirm("Proceed?"))) {
      out("Cancelled.");
      return;
    }
  } else {
    plan = parseUnitCounts(args, 255);
  }
  await dev.settle(plan);
  out(green("Settlement finished."));
  printRecycler(await recyclerView());
}

async function cmdSetCount(args) {
  const unit = Number(args[0]);
  const n = Number(args[1]);
  if (!(unit >= 1 && unit <= 4) || !Number.isInteger(n) || n < 0 || n > 255)
    throw new Error("Usage: setcount <1-4> <notes>");
  await dev.setCount(unit, n);
  printRecycler(await recyclerView());
}

async function cmdStatus() {
  const s = await dev.refresh();
  out(
    `Status: ${bold(s.name)}` +
      (s.hwReturn ? `   hardware return code: ${codes.hw(s.hwReturn)}` : ""),
  );
  printRecycler(await recyclerView());
}

async function cmdInfo() {
  const [fw, sn] = await Promise.all([dev.getVersion(), dev.getSerial()]);
  out(
    `Library : ${native.libPath}\nDLL     : ${dev.getDllVersion()}\nFirmware: ${fw}\nSerial  : ${sn}`,
  );
}

async function cmdDenominations(args) {
  if (args.length) throw new Error("Usage: denominations");
  const bills = await dev.getSupportedDenominations();
  table([
    ["CODE", "CURRENCY", "VALUE"],
    ...bills.map((b) => [
      "0x" + b.ucEscrowCode.toString(16).toUpperCase(),
      b.cCountryDesc,
      b.uiDenomination,
    ]),
  ]);
}

async function cmdHardwareLog(args) {
  let outputPath = path.resolve("br08_hw_log.txt");
  let allRecords = true;
  let startNo = 0;
  let endNo = 0;

  if (args.length === 1 && args[0].toLowerCase() !== "all") {
    outputPath = path.resolve(args[0]);
  } else if (args.length === 2 && args[1].toLowerCase() === "all") {
    outputPath = path.resolve(args[0]);
  } else if (args.length === 3) {
    outputPath = path.resolve(args[0]);
    startNo = Number(args[1]);
    endNo = Number(args[2]);
    if (
      !Number.isSafeInteger(startNo) ||
      !Number.isSafeInteger(endNo) ||
      startNo < 0 ||
      endNo < startNo ||
      endNo > 0xffffffff
    ) {
      throw new Error(
        "Hardware log range must be non-negative start/end numbers.",
      );
    }
    allRecords = false;
  } else if (args.length !== 0 && !(args.length === 1 && args[0] === "all")) {
    throw new Error("Usage: hwlog [absolute-file [all | <start> <end>]]");
  }

  if (Buffer.byteLength(outputPath, "utf8") >= 256)
    throw new Error("Hardware log output path must be shorter than 256 bytes.");
  const parent = path.dirname(outputPath);
  if (!fs.statSync(parent).isDirectory())
    throw new Error(`Hardware log directory does not exist: ${parent}`);
  if (fs.existsSync(outputPath)) {
    if (!fs.statSync(outputPath).isFile())
      throw new Error(`Hardware log path is not a file: ${outputPath}`);
    if (!(await confirm(`Overwrite ${outputPath}?`))) {
      out("Cancelled.");
      return;
    }
  }

  const query = {
    cPath: outputPath,
    ucIsGetAllRecord: allRecords ? 1 : 0,
    uiNoGetAll_startNo: startNo,
    uiNoGetAll_endNo: endNo,
  };
  await dev.getHardwareLog(query);
  if (!fs.existsSync(outputPath))
    throw new Error(`The device API returned without creating ${outputPath}.`);
  out(green(`Hardware log saved to ${outputPath}`));
}

async function cmdFirmware(args) {
  const target = args[0] && args[0].toLowerCase();
  let module;
  let firmwareArg;
  if (target === "main" && args.length === 2) {
    firmwareArg = args[1];
  } else if (
    target === "rc" &&
    args.length === 3 &&
    /^[12]$/.test(args[1])
  ) {
    module = Number(args[1]);
    firmwareArg = args[2];
  } else {
    throw new Error("Usage: firmware main <file> | firmware rc <1|2> <file>");
  }

  const firmwarePath = path.resolve(firmwareArg);
  let stat;
  try {
    stat = fs.statSync(firmwarePath);
  } catch (e) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR")
      throw new Error(`Firmware file does not exist: ${firmwarePath}`);
    throw e;
  }
  if (!stat.isFile())
    throw new Error(`Firmware path is not a file: ${firmwarePath}`);

  const targetName = module ? `RC module ${module}` : "main controller";
  out(
    yellow(
      `Firmware update for ${targetName} can make the device unusable if the image is wrong.`,
    ),
  );
  if (!(await confirm(`Update from ${firmwarePath}?`))) {
    out("Cancelled.");
    return;
  }

  if (module) await dev.updateRcFirmware(module, firmwarePath);
  else await dev.updateMainFirmware(firmwarePath);
  out(green(`Firmware update call completed for ${targetName}.`));
}

async function cmdComm(args) {
  if (
    args.length !== 1 ||
    !["open", "close"].includes(args[0].toLowerCase())
  ) {
    throw new Error("Usage: comm <open|close>");
  }
  if (args[0].toLowerCase() === "open") {
    await dev.openComm();
    out(green("Communication link opened."));
  } else {
    await dev.closeComm();
    out(green("Communication link closed."));
  }
}

async function cmdReceive(args) {
  if (
    args.length > 1 ||
    (args[0] && !["on", "off"].includes(args[0].toLowerCase()))
  )
    throw new Error("Usage: receive [on|off]");
  if (!args.length) {
    const inhibited = await dev.getReceiveInhibited();
    out(inhibited ? "Bill receiving is stopped." : "Bill receiving is enabled.");
  } else if (args[0].toLowerCase() === "on") {
    await dev.startReceiving();
    out(green("Bill receiving is ready."));
  } else {
    await dev.stopReceiving();
    out(green("Bill receiving stopped."));
  }
}

async function cmdRefund(args) {
  if (args.length) throw new Error("Usage: refund");
  if (!(await confirm("Return the bill currently held in escrow?"))) {
    out("Cancelled.");
    return;
  }
  await dev.returnEscrow();
  out(green("Bill refund requested."));
}

function parseCommandLine(line) {
  const tokens = [];
  let token = "";
  let quote = null;
  let started = false;
  for (const char of line) {
    if (quote) {
      if (char === quote) quote = null;
      else token += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) tokens.push(token);
      token = "";
      started = false;
    } else {
      token += char;
      started = true;
    }
  }
  if (quote) throw new Error("Unclosed quote in command.");
  if (started) tokens.push(token);
  return tokens;
}

const HELP = `
${bold("Receiving")}
  cashin                      accept bills until you press Enter (bills go to a recycler unit or the cash box)
  bills [currency]            list the current assignment or one currency's assignment
  enable <value...|all>       accept these denominations        e.g. enable 100 500
  disable <value...|all>      reject these denominations
  currency [CODE]             list supported currencies / select the one to accept (e.g. currency PHP)
  denominations               list supported denominations across currencies
  receive [on|off]            read or change bill receiving state
  refund                      return the bill currently held in escrow
${bold("Recycler")}
  recycle                     show which denomination each unit recycles and how many notes it holds
  recycle set <1-4> <value>   make a unit recycle a denomination  e.g. recycle set 1 100  (unit must be empty)
  setcount <1-4> <notes>      tell the device how many notes a unit holds (after manual refill)
  settle [all|<unit>=<n>...]  move notes from the recycler into the cash box
${bold("Paying out")}
  cashout <amount> [-y]       pay an amount using the recycler (asks to confirm unless -y)
  dispense <unit>=<n> ...     pay specific notes, e.g. dispense 1=10 2=5   (max 35 per unit)
  payout status snapshots report recycler count changes by denomination
${bold("Maintenance")}
  hwlog [file [all | start end]] export all or a sequence range to an absolute path
  firmware main <file>        update main-controller firmware (requires confirmation)
  firmware rc <1|2> <file>    update recycler-module firmware (requires confirmation)
  comm <open|close>           open or close the communication link
${bold("Device")}
  status | info | init | verbose [on|off] | help | exit
`;

const COMMANDS = {
  help: async () => out(HELP),
  status: cmdStatus,
  info: cmdInfo,
  cashin: cmdCashin,
  bills: cmdBills,
  receive: cmdReceive,
  refund: cmdRefund,
  denominations: cmdDenominations,
  hwlog: cmdHardwareLog,
  firmware: cmdFirmware,
  comm: cmdComm,
  enable: (a) => cmdEnable(a, true),
  disable: (a) => cmdEnable(a, false),
  currency: cmdCurrency,
  recycle: cmdRecycle,
  setcount: cmdSetCount,
  settle: cmdSettle,
  cashout: cmdCashout,
  dispense: cmdDispense,
  init: async () => {
    await dev.reinit();
    out(green("Initialized."));
  },
  verbose: async (a) => {
    verbose = a[0] ? a[0] === "on" : !verbose;
    out(`verbose ${verbose ? "on" : "off"}`);
  },
};

if (argv.includes("--help") || argv.includes("-h")) {
  out(
    "Usage: node src/index.js [--name <logical device name>]\n" +
      HELP,
  );
  process.exit(0);
}

// ---------------------------------------------------------------- main
(async () => {
  out(bold("BR08 cash recycler console") + dim(`   (${native.libPath})`));
  attachLogging();
  try {
    out(
      `Opening "${dev.name}" and initializing (this can take a few seconds)...`,
    );
    await dev.connect();
  } catch (e) {
    console.error(red("Startup failed: ") + e.message);
    await shutdown(1);
    return;
  }
  out(
    green("Ready.") +
      dim('  Type "help" for commands, "cashin" to accept bills.'),
  );

  for (;;) {
    rl.prompt();
    const line = await nextLine();
    if (line === null) break;
    let tokens;
    try {
      tokens = parseCommandLine(line);
    } catch (e) {
      out(red("Error: ") + e.message);
      continue;
    }
    const [cmd, ...args] = tokens;
    if (!cmd) continue;
    const name = cmd.toLowerCase();
    if (name === "exit" || name === "quit") break;
    const handler = COMMANDS[name];
    if (!handler) {
      out(red(`Unknown command "${cmd}".`) + ' Type "help".');
      continue;
    }
    try {
      await handler(args);
    } catch (e) {
      out(red("Error: ") + e.message);
    }
  }
  await shutdown(0);
})();
