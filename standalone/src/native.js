"use strict";
// Native binding for BR08ProDev (Windows .dll / Linux .so) using koffi.
const fs = require("fs");
const path = require("path");
const koffi = require("koffi");

const WIN = process.platform === "win32";
const ARCH = { x64: "x64", ia32: "x86" }[process.arch];
// const DBG = process.env.BR08_DEBUG_LIB === "1"; // use the *D (debug) library build
const DBG = true; // use the *D (debug) library build
const SUF = DBG ? "D" : "";

const SDK_ROOT = path.resolve(
  process.env.BR08_SDK_DIR || path.join(__dirname, "..", "Library"),
);

function findCI(dir, name) {
  // case-insensitive file lookup
  try {
    const hit = fs
      .readdirSync(dir)
      .find((f) => f.toLowerCase() === name.toLowerCase());
    return hit ? path.join(dir, hit) : null;
  } catch {
    return null;
  }
}

function locate() {
  if (!WIN && process.platform !== "linux")
    throw new Error(
      `Unsupported OS "${process.platform}" (Windows and Linux only).`,
    );
  if (!ARCH)
    throw new Error(
      `Unsupported CPU "${process.arch}". The BR08 SDK ships x86/x64 only (arm64 needs the vendor's Toolplus package).`,
    );

  const libDir = WIN
    ? path.join(SDK_ROOT, "Windows", "Dll", ARCH)
    : path.join(SDK_ROOT, "Linux", "Lib", ARCH);
  const libName = WIN ? `BR08ProDev${SUF}.dll` : `libBR08ProDev${SUF}.so`;
  const libPath = process.env.BR08_LIB
    ? path.resolve(process.env.BR08_LIB)
    : findCI(libDir, libName);
  if (!libPath || !fs.existsSync(libPath)) {
    throw new Error(
      `Cannot find ${libName} in ${libDir}\n  Put the vendor "Library" folder next to package.json, or set BR08_SDK_DIR / BR08_LIB.`,
    );
  }

  // Folders that may hold the DevBase dependency libraries (YTZN_DevBase / YTZN_DevDriverLog / UsbWrapper).
  const osDir = WIN ? "Windows" : "Linux";
  const roots = [
    process.env.BR08_DEVBASE_DIR,
    path.join(SDK_ROOT, "YTZN_Devbase_Output"),
    path.join(SDK_ROOT, "..", "YTZN_Devbase_Output"),
    path.join(process.cwd(), "YTZN_Devbase_Output"),
  ].filter(Boolean);
  const depDirs = [path.dirname(libPath)];
  for (const r of roots)
    depDirs.push(path.resolve(r), path.resolve(r, osDir, "Dll", ARCH));
  return {
    libPath,
    depDirs: [...new Set(depDirs)].filter((d) => fs.existsSync(d)),
  };
}

function preloadDependencies(depDirs) {
  const wanted = WIN
    ? [`YTZN_DevDriverLog${SUF}.dll`, `YTZN_DevBase${SUF}.dll`]
    : [
        `libUsbWrapper${SUF}.so`,
        `libYTZN_DevDriverLog${SUF}.so`,
        `libYTZN_DevBase${SUF}.so`,
      ];
  const found = [];
  console.log(wanted);
  for (const name of wanted)
    for (const d of depDirs) {
      const f = findCI(d, name);
      if (f) {
        found.push(f);
        break;
      }
    }

  if (WIN) {
    // let Windows resolve DLL-to-DLL dependencies through PATH
    const dirs = [
      ...new Set(found.map((f) => path.dirname(f)).concat(depDirs[0])),
    ];
    process.env.PATH =
      dirs.join(path.delimiter) + path.delimiter + (process.env.PATH || "");
  }
  // Pre-load by absolute path (Linux ignores LD_LIBRARY_PATH changes made after process start).
  // Several passes, because the libraries depend on each other.
  let pending = [...found];
  for (let pass = 0; pass < 4 && pending.length; pass++) {
    pending = pending.filter((f) => {
      try {
        koffi.load(f);
        return false;
      } catch {
        return true;
      }
    });
  }
  return {
    found,
    missing: wanted.filter(
      (n) =>
        !found.some((f) => path.basename(f).toLowerCase() === n.toLowerCase()),
    ),
  };
}

const { libPath, depDirs } = locate();
const dep = preloadDependencies(depDirs);
let lib;
try {
  lib = koffi.load(libPath);
} catch (e) {
  const hint = dep.missing.length
    ? `\n  DevBase dependency libraries NOT found: ${dep.missing.join(", ")}\n  Install the vendor's YTZN_Devbase_Output package (run its install script),\n  or set BR08_DEVBASE_DIR to the folder that contains them.`
    : "";
  throw new Error(
    `Failed to load ${libPath}\n  ${String(e.message).split("\n")[0]}${hint}`,
  );
}

// ---------------------------------------------------------------- structures (all 1-byte packed)
const str8 = koffi.array("char", 8, "String");
const u8 = (n) => koffi.array("uint8_t", n);

const T = {};
T.DevReturn = koffi.struct("tDevReturn", {
  iPhyCode: "int",
  iLogicCode: "int",
});
T.BillData = koffi.pack("stBr08Pro_billData", {
  ucEscrowCode: "uint8_t",
  ucCountryType: "uint8_t",
  ucDenominationData1: "uint8_t",
  ucDenominationData2: "uint8_t",
  cCountryDesc: str8,
  uiDenomination: "uint32_t",
});
T.CurrencyData = koffi.pack("stBr08Pro_currencyData", {
  ucCurrencyType: "uint8_t",
  cCurrencyDesc: str8,
});
T.CurrencyCount = koffi.pack("stBr08Pro_currencyCountData", {
  ucIsValidArrayCount: "uint8_t",
  stCurrencyData: koffi.array(T.CurrencyData, 50),
});
T.DispenseUnit = koffi.pack("stBr08Pro_oper_dispense_data_unit", {
  ucRcUnitNo: "uint8_t",
  ucNeedDispenseNum: "uint8_t",
});
T.Dispense = koffi.pack("stBr08Pro_oper_dispense_data", {
  ucIsValidArrayCount: "uint8_t",
  stDispenseData_unit: koffi.array(T.DispenseUnit, 4),
});
T.CashCountUnit = koffi.pack("stBr08Pro_oper_cashCount_data_unit", {
  ucRcUnitNo: "uint8_t",
  ucNeedCashCountNum: "uint8_t",
});
T.CashCount = koffi.pack("stBr08Pro_oper_cashCount_data", {
  ucIsValidArrayCount: "uint8_t",
  stCashCountData_unit: koffi.array(T.CashCountUnit, 4),
});
T.Enable = koffi.pack("stBr08Pro_set_enable_data", {
  ucIsEnable_escrowCode_bill: u8(8),
  ucIsEnable_escrowCode_bill_reservred: u8(8),
});
T.Inhibit = koffi.pack("stBr08Pro_set_inhibit_data", {
  ucIsInhibit: "uint8_t",
  ucReserved: u8(7),
});
T.Version = koffi.pack("stBr08Pro_set_version_data", {
  cVersion: koffi.array("char", 255, "String"),
});
T.Serial = koffi.pack("stBr08Pro_set_serialNumber_data", {
  cSerial: koffi.array("char", 255, "String"),
});
T.RcRecvUnit = koffi.pack("stBr08Pro_rcUnit_recv_data_unit", {
  ucRcUnitNo: "uint8_t",
  ucEscrowCode: "uint8_t",
  ucCountryType: "uint8_t",
  cCountryDesc: str8,
  uiDenomination_out: "uint32_t",
});
T.RcRecv = koffi.pack("stBr08Pro_set_rcUnit_recv_data", {
  ucIsValidArrayCount: "uint8_t",
  stRcUnit_unit: koffi.array(T.RcRecvUnit, 4),
});
T.RcCountUnit = koffi.pack("stBr08Pro_rcUnit_count_data_unit", {
  ucRcUnitNo: "uint8_t",
  RecycleCurrentCount: "uint16_t",
});
T.RcCount = koffi.pack("stBr08Pro_set_rcUnit_count_data", {
  ucIsValidArrayCount: "uint8_t",
  stRcUnitCount_unit: koffi.array(T.RcCountUnit, 4),
});
T.CurrencyAssign = koffi.pack("stBr08Pro_set_currencyAssign_data", {
  ucBillData_ValiCount: "uint8_t",
  stBillData: koffi.array(T.BillData, 16),
});
T.DevState = koffi.pack("stBr08Pro_devState", {
  ushHwRetrun: "uint16_t",
  stRcUnitCount: T.RcCount,
  stSensor: u8(32),
  ucStatusID: "uint8_t",
  bHasData: "uint8_t",
  uc_union_devState_data_map: u8(32),
});
T.SettingState = koffi.pack("stBr08Pro_settingState", {
  ucSettingID: "uint8_t",
  bHasData: "uint8_t",
  uc_union_devState_data_map: u8(512),
});
T.LogQuery = koffi.pack("stBr08Pro_log_data", {
  cPath: koffi.array("char", 256, "String"),
  ucIsGetAllRecord: "uint8_t",
  uiNoGetAll_startNo: "uint32_t",
  uiNoGetAll_endNo: "uint32_t",
});
T.LogProgress = koffi.pack("stBr08Pro_log_callback_data", {
  cPath: koffi.array("char", 256, "String"),
  uiLogNo_start: "uint32_t",
  uiLogNo_now: "uint32_t",
  uiLogNo_end: "uint32_t",
  ucIsGetLogOK: "uint8_t",
});
T.FirmwareProgress = koffi.pack("stBr08Pro_hw_update_callback_data", {
  cPath: koffi.array("char", 256, "String"),
  uiUpdateNo_start: "uint32_t",
  uiUpdateNo_now: "uint32_t",
  uiUpdateNo_end: "uint32_t",
  ucUpdateStatus: "uint8_t",
  ucIsUpdateOK: "uint8_t",
});

// Sizes taken from the vendor headers (verified with a C compiler). Fail fast if a layout is wrong.
const EXPECT = {
  BillData: 16,
  DevState: 81,
  RcCount: 13,
  Dispense: 9,
  CashCount: 9,
  Enable: 16,
  Inhibit: 8,
  RcRecv: 61,
  CurrencyAssign: 257,
  CurrencyData: 9,
  CurrencyCount: 451,
  SettingState: 514,
  LogQuery: 265,
  LogProgress: 269,
  FirmwareProgress: 270,
  Version: 255,
  DevReturn: 8,
};
for (const [k, v] of Object.entries(EXPECT)) {
  if (koffi.sizeof(T[k]) !== v)
    throw new Error(
      `Struct layout mismatch for ${k}: ${koffi.sizeof(T[k])} != ${v}`,
    );
}
const SIZE = Object.fromEntries(
  Object.keys(EXPECT).map((k) => [k, koffi.sizeof(T[k])]),
);

// ---------------------------------------------------------------- callback + functions
const Callback = koffi.proto(
  "intptr_t Br08Callback(void* user, uint32_t msg, const void* data, uint32_t len, uint32_t result, uint32_t endCode)",
);

const decl = (s) => lib.func(s);
const fn = {
  open: decl(
    "void* Br08Pro_hOpenLogicalDevice(const char* name, _Out_ tDevReturn* st)",
  ),
  close: decl("void Br08Pro_vCloseLogicalDevice(void* h)"),
  dllVersion: decl(
    "void Br08Pro_vGetDllVersion(void* h, _Out_ uint8_t* buf, int len)",
  ),
  regCb: decl(
    "int Br08Pro_iRegisterCallback(void* h, Br08Callback* cb, void* user)",
  ),
  unregCb: decl("int Br08Pro_iUnRegisterCallback(void* h)"),
  setComm: decl("int Br08Pro_iSetCommPara(void* h, _Out_ tDevReturn* st)"),
  closeComm: decl("int Br08Pro_iCloseComm(void* h, _Out_ tDevReturn* st)"),
  getStatus: decl(
    "int Br08Pro_iGetStatus(void* h, _Out_ stBr08Pro_devState* out, _Out_ tDevReturn* st)",
  ),
  getVersion: decl(
    "int Br08Pro_iGetVersion(void* h, _Out_ stBr08Pro_set_version_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getSerial: decl(
    "int Br08Pro_iGetSecretNumber(void* h, _Out_ stBr08Pro_set_serialNumber_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  init: decl("int Br08Pro_iInit(void* h, uint8_t cb, _Out_ tDevReturn* st)"),
  cashIn: decl(
    "int Br08Pro_iCashIn(void* h, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  cashOut: decl(
    "int Br08Pro_iCashOut(void* h, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  dispense: decl(
    "int Br08Pro_iDispense(void* h, stBr08Pro_oper_dispense_data* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  cashCount: decl(
    "int Br08Pro_iCashCount(void* h, stBr08Pro_oper_cashCount_data* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getCurrencyAssign: decl(
    "int Br08Pro_iGetCurrencyAssign(void* h, _Out_ stBr08Pro_set_currencyAssign_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  setEnable: decl(
    "int Br08Pro_iSetBill_escrowCode_enable(void* h, stBr08Pro_set_enable_data* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getEnable: decl(
    "int Br08Pro_iGetBill_escrowCode_enable(void* h, _Out_ stBr08Pro_set_enable_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  setInhibit: decl(
    "int Br08Pro_iSetRecvInhibit(void* h, stBr08Pro_set_inhibit_data* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getInhibit: decl(
    "int Br08Pro_iGetRecvInhibit(void* h, _Out_ stBr08Pro_set_inhibit_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  setRcRecv: decl(
    "int Br08Pro_iSetRcUnitRecv(void* h, stBr08Pro_set_rcUnit_recv_data* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getRcRecv: decl(
    "int Br08Pro_iGetRcUnitRecv(void* h, _Out_ stBr08Pro_set_rcUnit_recv_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  setRcCount: decl(
    "int Br08Pro_iSetRcUnitCount(void* h, stBr08Pro_set_rcUnit_count_data* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getRcCount: decl(
    "int Br08Pro_iGetRcUnitCount(void* h, _Out_ stBr08Pro_set_rcUnit_count_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  ack: decl("int Br08Pro_iSendAckResponse(void* h, _Out_ tDevReturn* st)"),
  getSupportedCur: decl(
    "int Br08Pro_iGetSuppostRecvCurrency(void* h, _Out_ stBr08Pro_currencyCountData* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  setCurrentCur: decl(
    "int Br08Pro_iSetCurrentRecvCurrency(void* h, stBr08Pro_currencyData* in, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getCurrentCur: decl(
    "int Br08Pro_iGetCurrentRecvCurrency(void* h, _Out_ stBr08Pro_currencyData* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getCurrencyAssignWithCurrency: decl(
    "int Br08Pro_iGetCurrencyAssign_withCurrency(void* h, stBr08Pro_currencyData* in, _Out_ stBr08Pro_set_currencyAssign_data* out, uint8_t cb, _Out_ tDevReturn* st)",
  ),
  getNominalValueCount: decl(
    "int Br08Pro_iGetSuppost_nominalValueListNum(void* h, _Out_ int* out, _Out_ tDevReturn* st)",
  ),
  getNominalValueData: decl(
    "int Br08Pro_iGetSuppost_nominalValueListData(void* h, int count, _Out_ stBr08Pro_billData* out, _Out_ tDevReturn* st)",
  ),
  getHwLog: decl(
    "int Br08Pro_iGetHwLog(void* h, _Inout_ stBr08Pro_log_data* query, _Out_ tDevReturn* st)",
  ),
  updateRcFirmware: decl(
    "int Br08Pro_iHwUpdate_rcUnitModule(void* h, uint8_t module, char* path, _Out_ tDevReturn* st)",
  ),
  updateMainFirmware: decl(
    "int Br08Pro_iHwUpdate_mainctrl(void* h, char* path, _Out_ tDevReturn* st)",
  ),
};

/** Run a native function on a worker thread so the Node event loop (and SDK callbacks) keep flowing. */
function callAsync(f, ...args) {
  return new Promise((resolve, reject) =>
    f.async(...args, (err, res) => (err ? reject(err) : resolve(res))),
  );
}

module.exports = { koffi, T, SIZE, Callback, fn, callAsync, libPath, SDK_ROOT };
