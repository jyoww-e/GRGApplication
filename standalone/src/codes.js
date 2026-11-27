"use strict";
// Human-readable names for BR08 error/reject/currency codes, parsed at runtime from the
// vendor header Library/Include/BR08ProDevDef.h (so nothing is hard-coded or out of date).
const fs = require("fs");
const path = require("path");

const tables = {
  sf: new Map(),
  hw: new Map(),
  reject: new Map(),
  currency: new Map(),
};
const PREFIX = {
  BR08_PRO_SF_CODE_: "sf",
  BR08_PRO_HW_CODE_: "hw",
  BR08_PRO_REJECT_ECODE_: "reject",
  BR08_PRO_CUR_CODE_: "currency",
};
const LINE =
  /^\s*#define\s+(BR08_PRO_\w+)\s+(0[xX][0-9A-Fa-f]+|\d+)\s*(?:\/\*\s*(.*?)\s*\*\/|\/\/\s*(.*?))?\s*$/;

function load(sdkRoot) {
  const file = path.join(sdkRoot, "Include", "BR08ProDevDef.h");
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return false;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = LINE.exec(line);
    if (!m) continue;
    const prefix = Object.keys(PREFIX).find((p) => m[1].startsWith(p));
    if (!prefix) continue;
    const value = Number(m[2]);
    const table = tables[PREFIX[prefix]];
    if (!table.has(value))
      table.set(value, {
        name: m[1].slice(prefix.length),
        desc: m[3] || m[4] || "",
      });
  }
  return true;
}

function describe(kind, value) {
  const hex = "0x" + (value >>> 0).toString(16).toUpperCase();
  const e = tables[kind].get(value >>> 0);
  return e ? `${hex} ${e.name}${e.desc ? " - " + e.desc : ""}` : hex;
}

const sf = (v) => describe("sf", v); // iLogicCode / endCode
const hw = (v) => describe("hw", v); // iPhyCode / hardware error code
const reject = (v) => describe("reject", v); // bill reject reason
const currencyName = (code) => tables.currency.get(code)?.name || null;
const currencyCode = (name) => {
  for (const [code, e] of tables.currency)
    if (e.name.toUpperCase() === String(name).toUpperCase()) return code;
  return null;
};

module.exports = { load, sf, hw, reject, currencyName, currencyCode };
