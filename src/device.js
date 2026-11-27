"use strict";

const { EventEmitter } = require("events");
const fs = require("fs");
const path = require("path");
const { trace } = require("./trace");
const {
  INI_FILES,
  linuxSerialPortFromIni,
  prepareRuntimeFiles,
} = require("./runtime");
const { koffi, T, SIZE, Callback, fn, callAsync } = require("./native");
const codes = require("./codes");
codes.load(path.join(__dirname, "dependencies", "library"));

const NATIVE_API_DEFINITIONS = {
  Br08Pro_hOpenLogicalDevice: {
    parameters: "[logicalDeviceName]",
    sample: ["Br08ProDev"],
    invoke: (device, [name] = []) => device._open(name),
  },
  Br08Pro_vCloseLogicalDevice: {
    parameters: "[]",
    sample: [],
    invoke: (device) => device._close(),
  },
  Br08Pro_vGetDllVersion: {
    parameters: "[bufferLength]",
    sample: [128],
    invoke: (device, [length = 128] = []) => device._getDllVersion(length),
  },
  Br08Pro_iRegisterCallback: {
    parameters: "[]",
    sample: [],
    invoke: (device) => device._registerCallback(),
  },
  Br08Pro_iUnRegisterCallback: {
    parameters: "[]",
    sample: [],
    invoke: (device) => device._unregisterCallback(),
  },
  Br08Pro_iSetCommPara: {
    parameters: "[]",
    sample: [],
    invoke: (device) => device._call("setComm"),
  },
  Br08Pro_iCloseComm: {
    parameters: "[]",
    sample: [],
    invoke: (device) => device._call("closeComm"),
  },
  Br08Pro_iGetStatus: {
    parameters: "[]",
    sample: [],
    invoke: async (device) => {
      const data = {};
      const result = await device._call("getStatus", data);
      return { ...result, data };
    },
  },
  Br08Pro_iGetVersion: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getVersion", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iGetSecretNumber: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getSerial", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iInit: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: (device, [callbackFlag = 0] = []) =>
      device._call("init", callbackFlag),
  },
  Br08Pro_iCashIn: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: (device, [callbackFlag = 0] = []) =>
      device._call("cashIn", callbackFlag),
  },
  Br08Pro_iCashOut: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: (device, [callbackFlag = 0] = []) =>
      device._call("cashOut", callbackFlag),
  },
  Br08Pro_iDispense: {
    parameters: "[dispenseData, callbackFlag]",
    sample: [
      {
        ucIsValidArrayCount: 1,
        stDispenseData_unit: [
          { ucRcUnitNo: 1, ucNeedDispenseNum: 1 },
          { ucRcUnitNo: 0, ucNeedDispenseNum: 0 },
          { ucRcUnitNo: 0, ucNeedDispenseNum: 0 },
          { ucRcUnitNo: 0, ucNeedDispenseNum: 0 },
        ],
      },
      1,
    ],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("dispense", data, callbackFlag),
  },
  Br08Pro_iCashCount: {
    parameters: "[cashCountData, callbackFlag]",
    sample: [
      {
        ucIsValidArrayCount: 1,
        stCashCountData_unit: [
          { ucRcUnitNo: 1, ucNeedCashCountNum: 1 },
          { ucRcUnitNo: 0, ucNeedCashCountNum: 0 },
          { ucRcUnitNo: 0, ucNeedCashCountNum: 0 },
          { ucRcUnitNo: 0, ucNeedCashCountNum: 0 },
        ],
      },
      1,
    ],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("cashCount", data, callbackFlag),
  },
  Br08Pro_iGetCurrencyAssign: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call(
        "getCurrencyAssign",
        data,
        callbackFlag,
      );
      return { ...result, data };
    },
  },
  Br08Pro_iGetCurrencyAssign_withCurrency: {
    parameters: "[currencyData, callbackFlag]",
    sample: [{ ucCurrencyType: 1, cCurrencyDesc: "PHP" }, 0],
    invoke: async (device, [currency, callbackFlag = 0]) => {
      const data = {};
      const result = await device._call(
        "getCurrencyAssignWithCurrency",
        currency,
        data,
        callbackFlag,
      );
      return { ...result, data };
    },
  },
  Br08Pro_iGetSuppost_nominalValueListNum: {
    parameters: "[]",
    sample: [],
    invoke: async (device) => {
      const data = [0];
      const result = await device._call("getNominalValueCount", data);
      return { ...result, count: data[0] };
    },
  },
  Br08Pro_iGetSuppost_nominalValueListData: {
    parameters: "[count]",
    sample: [1],
    invoke: async (device, [count]) => {
      if (!Number.isInteger(count) || count < 0 || count > 64) {
        throw new Error("count must be an integer between 0 and 64.");
      }
      const output = Buffer.alloc(count * SIZE.BillData);
      const result = await device._call("getNominalValueData", count, output);
      const data = Array.from({ length: count }, (_, index) =>
        koffi.decode(
          output.subarray(index * SIZE.BillData, (index + 1) * SIZE.BillData),
          T.BillData,
        ),
      );
      return { ...result, data };
    },
  },
  Br08Pro_iGetHwLog: {
    parameters: "[queryData]",
    sample: [
      {
        cPath: "/tmp/br08-hw-log.txt",
        ucIsGetAllRecord: 1,
        uiNoGetAll_startNo: 0,
        uiNoGetAll_endNo: 0,
      },
    ],
    invoke: async (device, [query]) => {
      const result = await device._call("getHwLog", query);
      return { ...result, data: query };
    },
  },
  Br08Pro_iHwUpdate_rcUnitModule: {
    parameters: "[moduleNumber, firmwarePath]",
    sample: [1, "/path/to/rc-firmware.bin"],
    invoke: (device, [module, firmwarePath]) =>
      device._call("updateRcFirmware", module, firmwarePath),
  },
  Br08Pro_iHwUpdate_mainctrl: {
    parameters: "[firmwarePath]",
    sample: ["/path/to/main-firmware.bin"],
    invoke: (device, [firmwarePath]) =>
      device._call("updateMainFirmware", firmwarePath),
  },
  Br08Pro_iSetBill_escrowCode_enable: {
    parameters: "[enableData, callbackFlag]",
    sample: [
      {
        ucIsEnable_escrowCode_bill: [1, 1, 1, 1, 1, 1, 1, 1],
        ucIsEnable_escrowCode_bill_reservred: [0, 0, 0, 0, 0, 0, 0, 0],
      },
      0,
    ],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("setEnable", data, callbackFlag),
  },
  Br08Pro_iGetBill_escrowCode_enable: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getEnable", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iSetRecvInhibit: {
    parameters: "[inhibitData, callbackFlag]",
    sample: [{ ucIsInhibit: 1, ucReserved: [0, 0, 0, 0, 0, 0, 0] }, 0],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("setInhibit", data, callbackFlag),
  },
  Br08Pro_iGetRecvInhibit: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getInhibit", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iSetRcUnitRecv: {
    parameters: "[recyclerAssignmentData, callbackFlag]",
    sample: [
      {
        ucIsValidArrayCount: 1,
        stRcUnit_unit: [
          {
            ucRcUnitNo: 1,
            ucEscrowCode: 0x61,
            ucCountryType: 1,
            cCountryDesc: "PHP",
            uiDenomination_out: 0,
          },
          {
            ucRcUnitNo: 0,
            ucEscrowCode: 0,
            ucCountryType: 0,
            cCountryDesc: "",
            uiDenomination_out: 0,
          },
          {
            ucRcUnitNo: 0,
            ucEscrowCode: 0,
            ucCountryType: 0,
            cCountryDesc: "",
            uiDenomination_out: 0,
          },
          {
            ucRcUnitNo: 0,
            ucEscrowCode: 0,
            ucCountryType: 0,
            cCountryDesc: "",
            uiDenomination_out: 0,
          },
        ],
      },
      0,
    ],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("setRcRecv", data, callbackFlag),
  },
  Br08Pro_iGetRcUnitRecv: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getRcRecv", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iSetRcUnitCount: {
    parameters: "[recyclerCountData, callbackFlag]",
    sample: [
      {
        ucIsValidArrayCount: 1,
        stRcUnitCount_unit: [
          { ucRcUnitNo: 1, RecycleCurrentCount: 10 },
          { ucRcUnitNo: 0, RecycleCurrentCount: 0 },
          { ucRcUnitNo: 0, RecycleCurrentCount: 0 },
          { ucRcUnitNo: 0, RecycleCurrentCount: 0 },
        ],
      },
      0,
    ],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("setRcCount", data, callbackFlag),
  },
  Br08Pro_iGetRcUnitCount: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getRcCount", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iSendAckResponse: {
    parameters: "[]",
    sample: [],
    invoke: (device) => device._call("ack"),
  },
  Br08Pro_iGetSuppostRecvCurrency: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getSupportedCur", data, callbackFlag);
      return { ...result, data };
    },
  },
  Br08Pro_iSetCurrentRecvCurrency: {
    parameters: "[currencyData, callbackFlag]",
    sample: [{ ucCurrencyType: 1, cCurrencyDesc: "PHP" }, 0],
    invoke: (device, [data, callbackFlag = 0]) =>
      device._call("setCurrentCur", data, callbackFlag),
  },
  Br08Pro_iGetCurrentRecvCurrency: {
    parameters: "[callbackFlag]",
    sample: [0],
    invoke: async (device, [callbackFlag = 0] = []) => {
      const data = {};
      const result = await device._call("getCurrentCur", data, callbackFlag);
      return { ...result, data };
    },
  },
};

const API_DEFINITIONS = Object.fromEntries(
  Object.entries(NATIVE_API_DEFINITIONS).map(([nativeName, definition]) => {
    const commandName = nativeName.replace(/^Br08Pro_[hvi]/, "");
    if (commandName === nativeName) {
      throw new Error(
        `Cannot derive command name from native API ${nativeName}.`,
      );
    }
    return [commandName, definition];
  }),
);

const DEVICE_STATUS = {
  WAITING: 0x11,
  ACCEPTING: 0x12,
  ESCROW: 0x13,
  STACKING: 0x14,
  VEND_VALID: 0x15,
  STACKED: 0x16,
  REJECTING: 0x17,
  RETURNING: 0x18,
  IDLE: 0x1a,
  INITIALIZING: 0x1b,
  PAYING: 0x20,
  COLLECTING: 0x21,
  COLLECTED: 0x22,
  PAY_VALID: 0x23,
  PAY_STAY: 0x24,
  POWER_UP: 0x40,
  POWER_UP_BILL_IN_ACCEPTOR: 0x41,
  POWER_UP_BILL_IN_STACKER: 0x42,
  CASH_BOX_FULL: 0x43,
  CASH_BOX_OUT: 0x44,
  DEV_FAILURE: 0x45,
  ACK_FAIL: 0x4b,
  ACK_OK: 0x50,
  BILL_IN_CHANNEL: 0x71,
};
const CALLBACK_MESSAGE = {
  DISCONNECTED: 1,
  COMPLETE: 2,
  STATUS_CHANGED: 3,
  HW_LOG_GET: 4,
  HW_UPDATE: 5,
};
const STATUS_NAMES = Object.fromEntries(
  Object.entries(DEVICE_STATUS).map(([name, id]) => [id, name]),
);

function statusName(id) {
  return `${STATUS_NAMES[id] || "UNKNOWN"} (0x${id.toString(16).toUpperCase().padStart(2, "0")})`;
}

function statusEventName(id) {
  if (id === DEVICE_STATUS.ESCROW) return "STACKING";
  if (id === DEVICE_STATUS.PAYING) return "DISPENSING";
  if (id === DEVICE_STATUS.DEV_FAILURE) return "DEVICE_FAILURE";
  return STATUS_NAMES[id] || "UNKNOWN";
}

function planPayout(amount, units) {
  const list = units
    .filter((unit) => unit.denom > 0 && unit.count > 0)
    .sort((a, b) => b.denom - a.denom);
  const memo = new Map();
  function solve(index, remaining) {
    if (remaining === 0) return [];
    if (index >= list.length) return null;
    const key = `${index}:${remaining}`;
    if (memo.has(key)) return memo.get(key);
    const unit = list[index];
    let result = null;
    for (
      let count = Math.min(unit.count, Math.floor(remaining / unit.denom));
      count >= 0;
      count--
    ) {
      const rest = solve(index + 1, remaining - count * unit.denom);
      if (rest) {
        result =
          count > 0
            ? [{ unit: unit.unit, denom: unit.denom, count }, ...rest]
            : rest;
        break;
      }
    }
    memo.set(key, result);
    return result;
  }
  return solve(0, amount);
}

function splitPayoutRounds(plan, maxPerUnit = 35) {
  const remaining = plan.map((item) => ({ ...item }));
  const rounds = [];
  while (remaining.some((item) => item.count > 0)) {
    rounds.push(
      remaining
        .filter((item) => item.count > 0)
        .map((item) => {
          const count = Math.min(item.count, maxPerUnit);
          item.count -= count;
          return { unit: item.unit, denom: item.denom, count };
        }),
    );
  }
  return rounds;
}

function payoutPlanMatches(expected, actual) {
  return (
    Array.isArray(expected) &&
    expected.length === actual.length &&
    expected.every(
      (item, index) =>
        item &&
        item.unit === actual[index].unit &&
        item.denom === actual[index].denom &&
        item.count === actual[index].count,
    )
  );
}

class Br08Device extends EventEmitter {
  static statusEventName(id) {
    return statusEventName(id);
  }

  constructor({ name = "Br08ProDev" } = {}) {
    super();
    this.name = name;
    this.h = null;
    this.status = null;
    this._queue = Promise.resolve();
    this._callback = null;
    this._pendingAck = Promise.resolve();
    this.escrow = null;
    this._activePayout = null;
    this._cashInSession = null;
  }

  async OpenConnection(...args) {
    if (args.length) throw new Error("OpenConnection expects 0 parameters.");
    const executableDirectory = path.dirname(process.execPath);
    const getIniFiles = () =>
      INI_FILES.map((name) => ({
        name,
        executablePath: path.join(executableDirectory, name),
        existsBesideExecutable: fs.existsSync(
          path.join(executableDirectory, name),
        ),
        existsInCurrentDirectory: fs.existsSync(path.join(process.cwd(), name)),
      }));
    this._trace("OpenConnection start", {
      logicalDeviceName: this.name,
      platform: process.platform,
      architecture: process.arch,
      execPath: process.execPath,
      cwd: process.cwd(),
      iniFiles: getIniFiles(),
    });

    const runStage = async (stage, action) => {
      const startedAt = Date.now();
      this._trace("stage start", { stage });
      try {
        const result = await action();
        this._trace("stage complete", {
          stage,
          durationMs: Date.now() - startedAt,
        });
        return result;
      } catch (error) {
        this._trace("stage failed", {
          stage,
          durationMs: Date.now() - startedAt,
          error: error.message,
        });
        throw error;
      }
    };

    let opened = false;
    let callbackRegistered = false;
    let communicationAttempted = false;
    let readiness;
    try {
      await runStage("PrepareRuntimeFiles", () => {
        const prepared = prepareRuntimeFiles(executableDirectory);
        this._trace("Runtime files ready", prepared);
      });
      const missingIniFiles = getIniFiles()
        .filter((file) => !file.existsBesideExecutable)
        .map((file) => file.name);
      await runStage("VerifyIniFiles", async () => {
        if (missingIniFiles.length) {
          throw new Error(
            `DevBase reads its INI files beside the executable (${process.execPath}). Missing: ${missingIniFiles.join(", ")}.`,
          );
        }
      });
      if (process.platform === "linux") {
        await runStage("VerifyCommunicationPort", () => {
          const port = linuxSerialPortFromIni(
            path.join(executableDirectory, "GRGDTATM_CommCfg.ini"),
            this.name,
          );
          if (!port) return;
          if (!fs.existsSync(port)) {
            throw new Error(
              `Configured serial device ${port} is not present. For USB serial ports, attach the device to Linux first (WSL2 requires USB passthrough) and set ComID/USBToSerial/SerialToUSB for that port.`,
            );
          }
          try {
            fs.accessSync(port, fs.constants.R_OK | fs.constants.W_OK);
          } catch (error) {
            throw new Error(
              `Cannot access serial device ${port}: ${error.message}. Check the device permissions and dialout group membership.`,
            );
          }
        });
      }
      await runStage("OpenLogicalDevice", () =>
        this.OpenLogicalDevice(this.name),
      );
      opened = true;
      await runStage("RegisterCallback", () => this.RegisterCallback());
      callbackRegistered = true;
      communicationAttempted = true;
      await runStage("SetCommPara", () => this.SetCommPara());
      readiness = this._waitForReady();
      try {
        await runStage("Init", () => this.Init(0));
        const state = await runStage("WaitForReady", () => readiness.promise);
        await runStage("DisableReceiving", () =>
          this.SetRecvInhibit(
            { ucIsInhibit: 1, ucReserved: [0, 0, 0, 0, 0, 0, 0] },
            0,
          ),
        );
        return { connected: true, statusId: state.ucStatusID };
      } finally {
        readiness.cancel();
      }
    } catch (error) {
      this._trace("OpenConnection failed", { error: error.message });
      if (readiness) readiness.cancel();
      const cleanupErrors = [];
      if (communicationAttempted) {
        try {
          await this.CloseComm();
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      if (callbackRegistered) {
        try {
          await this.UnRegisterCallback();
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      if (opened) {
        try {
          await this.CloseLogicalDevice();
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      if (cleanupErrors.length) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          `OpenConnection failed and cleanup reported ${cleanupErrors.length} error(s).`,
        );
      }
      throw error;
    }
  }

  async enableDevice(...args) {
    if (args.length) throw new Error("enableDevice expects 0 parameters.");
    await this.SetRecvInhibit(
      { ucIsInhibit: 0, ucReserved: [0, 0, 0, 0, 0, 0, 0] },
      0,
    );
    const state = await this._waitForDeviceStatus(
      [DEVICE_STATUS.WAITING, DEVICE_STATUS.ACCEPTING],
      { timeout: 15000, interval: 500, label: "ready to receive bills" },
    );
    return { enabled: true, statusId: state.ucStatusID };
  }

  async startCashInSession(...args) {
    if (args.length) {
      throw new Error("startCashInSession expects 0 parameters.");
    }
    if (this._cashInSession) {
      throw new Error("A cash-in session is already running.");
    }

    let resolveEnded;
    const ended = new Promise((resolve) => {
      resolveEnded = resolve;
    });
    const session = {
      total: 0,
      notes: 0,
      by: new Map(),
      currency: "",
      ended,
      resolveEnded,
    };
    this._cashInSession = session;
    try {
      const result = await this.enableDevice();
      return { ...result, ended: session.ended };
    } catch (error) {
      this._cashInSession = null;
      throw error;
    }
  }

  async stopCashInSession(...args) {
    if (args.length) {
      throw new Error("stopCashInSession expects 0 parameters.");
    }
    const session = this._cashInSession;
    if (!session) throw new Error("No cash-in session is running.");

    await this._waitForDeviceStatus(
      [DEVICE_STATUS.WAITING, DEVICE_STATUS.IDLE, DEVICE_STATUS.CASH_BOX_FULL],
      { timeout: 30000, interval: 500, label: "the current bill to finish" },
    );
    await this.SetRecvInhibit(
      { ucIsInhibit: 1, ucReserved: [0, 0, 0, 0, 0, 0, 0] },
      0,
    );
    this._cashInSession = null;
    return {
      total: session.total,
      notes: session.notes,
      currency: session.currency,
      by: [...session.by.entries()].sort((a, b) => b[0] - a[0]),
    };
  }

  async previewPayout(amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("amount must be a positive safe integer.");
    }
    await this._ensurePayoutIdle();
    const { plan, currency } = await this._getPayoutPlan(amount);
    return { amount, currency, plan };
  }

  async payoutValue(amount, expectedPlan) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error("amount must be a positive safe integer.");
    }
    await this._ensurePayoutIdle();
    const { plan, availableUnits, currency } =
      await this._getPayoutPlan(amount);
    if (expectedPlan !== undefined && !payoutPlanMatches(expectedPlan, plan)) {
      throw new Error(
        "Recycler inventory changed after planning; review the payout before retrying.",
      );
    }

    const rounds = splitPayoutRounds(plan);
    const payout = {
      counts: new Map(availableUnits.map(({ unit, count }) => [unit, count])),
      assignments: new Map(
        availableUnits.map(({ unit, denom, desc }) => [
          unit,
          { denom: denom || null, desc },
        ]),
      ),
      dispensedTotal: 0,
      currentDispensedValue: 0,
    };
    this._activePayout = payout;
    try {
      for (const round of rounds) {
        await this._dispenseRound(round);
      }
      return { paid: amount, currency, plan, rounds: rounds.length };
    } finally {
      if (this._activePayout === payout) this._activePayout = null;
    }
  }

  async _getPayoutPlan(amount) {
    const [billResult, unitResult, countResult] = await Promise.all([
      this.GetCurrencyAssign(),
      this.GetRcUnitRecv(),
      this.GetRcUnitCount(),
    ]);
    const bills = billResult.data.stBillData
      .slice(0, billResult.data.ucBillData_ValiCount)
      .map((bill) => ({
        code: bill.ucEscrowCode,
        denom: bill.uiDenomination,
        desc: bill.cCountryDesc,
      }));
    const units = unitResult.data.stRcUnit_unit.slice(
      0,
      unitResult.data.ucIsValidArrayCount,
    );
    const counts = countResult.data.stRcUnitCount_unit.slice(
      0,
      countResult.data.ucIsValidArrayCount,
    );
    const availableUnits = [1, 2, 3, 4].map((unit) => {
      const assignment = units.find((item) => item.ucRcUnitNo === unit);
      const bill = assignment
        ? bills.find((item) => item.code === assignment.ucEscrowCode)
        : null;
      const stock = counts.find((item) => item.ucRcUnitNo === unit);
      return {
        unit,
        denom: bill ? bill.denom : 0,
        desc:
          (bill && bill.desc) || (assignment && assignment.cCountryDesc) || "",
        count: stock ? stock.RecycleCurrentCount : 0,
      };
    });
    const plan = planPayout(amount, availableUnits);
    if (!plan) {
      throw new Error(
        `Cannot pay exactly ${amount} with the notes currently in the recycler.`,
      );
    }
    const currency = availableUnits.find((unit) => unit.desc)?.desc || "";
    return { plan, availableUnits, currency };
  }

  async _ensurePayoutIdle() {
    const { data } = await this.GetStatus();
    if (data.ucStatusID === DEVICE_STATUS.IDLE) return;
    if (data.ucStatusID !== DEVICE_STATUS.WAITING) {
      throw new Error(
        `payoutValue requires an idle device; current status is 0x${data.ucStatusID.toString(16).toUpperCase()}.`,
      );
    }
    await this.SetRecvInhibit(
      { ucIsInhibit: 1, ucReserved: [0, 0, 0, 0, 0, 0, 0] },
      0,
    );
    await this._waitForDeviceStatus([DEVICE_STATUS.IDLE], {
      timeout: 30000,
      interval: 500,
      label: "device to become idle",
    });
  }

  async _waitForDeviceStatus(statusIds, { timeout, interval, label }) {
    const accepted = new Set(statusIds);
    const deadline = Date.now() + timeout;
    let lastStatusId;
    while (Date.now() < deadline) {
      const { data } = await this.GetStatus();
      const statusId = data.ucStatusID;
      if (statusId !== lastStatusId) {
        this._trace("device status", {
          statusId: `0x${statusId.toString(16).toUpperCase()}`,
        });
        lastStatusId = statusId;
      }
      if (accepted.has(statusId)) return data;
      if (statusId === DEVICE_STATUS.DEV_FAILURE) {
        throw new Error(
          `Device failure while waiting for ${label}: ${codes.hw(data.ushHwRetrun)}.`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Timed out waiting for ${label}.`);
  }

  async _dispenseRound(round) {
    const completion = this._waitForPayoutCompletion();
    const units = round.map((item) => ({
      ucRcUnitNo: item.unit,
      ucNeedDispenseNum: item.count,
    }));
    try {
      await this.Dispense(
        {
          ucIsValidArrayCount: units.length,
          stDispenseData_unit: [
            ...units,
            ...Array.from({ length: 4 - units.length }, () => ({
              ucRcUnitNo: 0,
              ucNeedDispenseNum: 0,
            })),
          ],
        },
        1,
      );
      await completion.promise;
      await this._pendingAck;
    } finally {
      completion.cancel();
    }
  }

  _waitForPayoutCompletion(timeout = 180000) {
    let active = false;
    let timer;
    const onStatus = (state) => {
      if (
        state.event === "DISPENSING" ||
        state.event === "PAY_STAY" ||
        state.event === "PAY_VALID"
      ) {
        active = true;
      }
      if (state.event === "DEVICE_FAILURE") {
        rejectCompletion(
          new Error(
            `Payout failed: ${state.value?.description || state.value?.code || "device failure"}.`,
          ),
        );
      } else if (state.event === "IDLE" && active) {
        resolveCompletion(state);
      }
    };
    let resolveCompletion;
    let rejectCompletion;
    const promise = new Promise((resolve, reject) => {
      resolveCompletion = resolve;
      rejectCompletion = reject;
      this.on("statusChanged", onStatus);
      timer = setTimeout(
        () => reject(new Error("Timed out waiting for payout to finish.")),
        timeout,
      );
    });
    promise.catch(() => {});
    return {
      promise,
      cancel: () => {
        clearTimeout(timer);
        this.off("statusChanged", onStatus);
      },
    };
  }

  _waitForReady({ timeout = 90000, interval = 500 } = {}) {
    const deadline = Date.now() + timeout;
    let lastStatusId;
    let timer;
    let cancelled = false;
    const promise = new Promise((resolve, reject) => {
      const poll = async () => {
        if (cancelled) return;
        try {
          const { data } = await this.GetStatus();
          if (cancelled) return;
          if (data.ucStatusID !== lastStatusId) {
            this._trace("device status", {
              statusId: `0x${data.ucStatusID.toString(16).toUpperCase()}`,
            });
            lastStatusId = data.ucStatusID;
          }
          if (data.ucStatusID === 0x1a) {
            resolve(data);
          } else if (data.ucStatusID === 0x45) {
            reject(
              new Error(
                `Device initialization failed: ${codes.hw(data.ushHwRetrun)}.`,
              ),
            );
          } else if (Date.now() >= deadline) {
            reject(
              new Error("Timed out waiting for the device to become idle."),
            );
          } else {
            timer = setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      timer = setTimeout(poll, interval);
    });
    promise.catch(() => {});
    return {
      promise,
      cancel() {
        cancelled = true;
        clearTimeout(timer);
      },
    };
  }

  _trace(event, details) {
    trace(event, details);
  }

  async _open(name = this.name) {
    if (this.h) throw new Error("A device handle is already open.");
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("logicalDeviceName must be a non-empty string.");
    }
    const status = {};
    const handle = fn.open(name, status);
    if (!handle) {
      throw new Error(
        `OpenLogicalDevice("${name}") failed: logic ${codes.sf(status.iLogicCode)}, device ${codes.hw(status.iPhyCode)}. Check the INI files and the logical device name.`,
      );
    }
    this.name = name;
    this.h = handle;
    return { opened: true, deviceReturn: status };
  }

  async _close() {
    this._requireHandle();
    if (this._callback) {
      throw new Error(
        "Unregister the callback with Br08Pro_iUnRegisterCallback before closing the device handle.",
      );
    }
    fn.close(this.h);
    this.h = null;
    return { closed: true };
  }

  _getDllVersion(length = 128) {
    this._requireHandle();
    if (!Number.isInteger(length) || length < 1 || length > 4096) {
      throw new Error("bufferLength must be an integer between 1 and 4096.");
    }
    const buffer = Buffer.alloc(length);
    fn.dllVersion(this.h, buffer, length);
    const end = buffer.indexOf(0);
    return buffer.toString("utf8", 0, end < 0 ? buffer.length : end);
  }

  _registerCallback() {
    this._requireHandle();
    if (this._callback) throw new Error("A callback is already registered.");
    const callback = koffi.register(
      (user, message, data, length, result, endCode) =>
        this._onCallback(message, data, length, result, endCode),
      koffi.pointer(Callback),
    );
    const returnCode = fn.regCb(this.h, callback, null);
    if (returnCode !== 0) {
      koffi.unregister(callback);
      throw new Error(
        `Br08Pro_iRegisterCallback failed (return=${returnCode}).`,
      );
    }
    this._callback = callback;
    return { returnCode };
  }

  _onCallback(message, data, length, result, endCode) {
    try {
      if (message === CALLBACK_MESSAGE.STATUS_CHANGED) {
        if (!data || length < SIZE.DevState) {
          throw new Error(`Invalid status callback payload (${length} bytes).`);
        }
        const state = this._parseState(koffi.decode(data, T.DevState));
        setImmediate(() => this._handleState(state));
      } else if (message === CALLBACK_MESSAGE.COMPLETE) {
        if (result !== 0) {
          setImmediate(() =>
            this._emitStatusChanged("OPERATION_COMPLETE", {
              result,
              endCode,
              endDesc: codes.sf(endCode),
            }),
          );
        }
      } else if (message === CALLBACK_MESSAGE.DISCONNECTED) {
        setImmediate(() => this._emitStatusChanged("DISCONNECTED", null));
      } else if (message === CALLBACK_MESSAGE.HW_LOG_GET) {
        if (!data || length < SIZE.LogProgress) {
          throw new Error(
            `Invalid hardware-log callback payload (${length} bytes).`,
          );
        }
        const progress = koffi.decode(data, T.LogProgress);
        setImmediate(() =>
          this._emitStatusChanged("HARDWARE_LOG_PROGRESS", progress),
        );
      } else if (message === CALLBACK_MESSAGE.HW_UPDATE) {
        if (!data || length < SIZE.FirmwareProgress) {
          throw new Error(
            `Invalid firmware-update callback payload (${length} bytes).`,
          );
        }
        const progress = koffi.decode(data, T.FirmwareProgress);
        setImmediate(() =>
          this._emitStatusChanged("FIRMWARE_PROGRESS", progress),
        );
      }
    } catch (error) {
      setImmediate(() =>
        this._emitStatusChanged("WARNING", {
          message: `Native callback error: ${error.message}`,
        }),
      );
    }
    return 0;
  }

  _emitStatusChanged(event, value, additional = {}) {
    this.emit("statusChanged", { event, value, ...additional });
  }

  _parseState(state) {
    const count = Math.min(state.stRcUnitCount.ucIsValidArrayCount, 4);
    return {
      id: state.ucStatusID,
      name: statusName(state.ucStatusID),
      hasData: Boolean(state.bHasData),
      data: Buffer.from(state.uc_union_devState_data_map),
      hwReturn: state.ushHwRetrun,
      counts: state.stRcUnitCount.stRcUnitCount_unit
        .slice(0, count)
        .map((unit) => ({
          unit: unit.ucRcUnitNo,
          count: unit.RecycleCurrentCount,
        })),
    };
  }

  _handleState(state) {
    this.status = state.id;
    let customEvent = false;
    if (state.id === DEVICE_STATUS.ESCROW) {
      this.escrow = koffi.decode(
        state.data.subarray(0, SIZE.BillData),
        T.BillData,
      );
    }
    if (state.id === DEVICE_STATUS.DEV_FAILURE) {
      state.hwCode = state.data.readUInt16LE(0);
      state.hwDesc = codes.hw(state.hwCode);
    }

    if (state.id === DEVICE_STATUS.CASH_BOX_FULL) {
      this._cashInSession?.resolveEnded("full");
    }

    if (state.id === DEVICE_STATUS.ESCROW) {
      this._emitStatusChanged("STACKING", this.escrow.uiDenomination);
      if (this._cashInSession) this._acceptCashInBill();
      customEvent = true;
    } else if (state.id === DEVICE_STATUS.VEND_VALID) {
      this._recordAcceptedCashInBill();
      this._autoAck();
      customEvent = true;
    } else if (state.id === DEVICE_STATUS.PAY_VALID) {
      this._recordPayoutCounts(state);
      this._autoAck();
    } else if (state.id === DEVICE_STATUS.PAYING) {
      if (this._recordPayoutCounts(state) === null) {
        this._emitStatusChanged("DISPENSING", null);
      }
      customEvent = true;
    } else if (state.id === DEVICE_STATUS.PAY_STAY) {
      this._recordPayoutCounts(state);
    } else if (state.id === DEVICE_STATUS.STACKED) {
      this._emitStatusChanged(
        state.data[0] === 0 ? "STACKED" : "STORED",
        this.escrow?.uiDenomination ?? null,
      );
      customEvent = true;
    } else if (state.id === DEVICE_STATUS.STACKING) {
      customEvent = true;
    }

    if (!customEvent) {
      const additional =
        this._activePayout &&
        [DEVICE_STATUS.PAY_STAY, DEVICE_STATUS.PAY_VALID].includes(state.id)
          ? { total: this._activePayout.dispensedTotal }
          : {};
      this._emitStatusChanged(
        statusEventName(state.id),
        this._statusValue(state),
        additional,
      );
    }
    if (state.id === DEVICE_STATUS.PAY_VALID && this._activePayout) {
      this._activePayout.currentDispensedValue = 0;
    }
  }

  _acceptCashInBill() {
    this.CashIn(1).catch(async (error) => {
      this._emitStatusChanged("CASH_IN_ERROR", { message: error.message });
      try {
        await this.CashOut(1);
      } catch (returnError) {
        this._emitStatusChanged("CASH_IN_ERROR", {
          message: `Could not return bill: ${returnError.message}`,
        });
      }
    });
  }

  _recordAcceptedCashInBill() {
    const session = this._cashInSession;
    const bill = this.escrow;
    if (!session || !bill) return;
    session.total += bill.uiDenomination;
    session.notes++;
    session.currency = bill.cCountryDesc;
    session.by.set(
      bill.uiDenomination,
      (session.by.get(bill.uiDenomination) || 0) + 1,
    );
  }

  _statusValue(state) {
    if (
      state.id === DEVICE_STATUS.PAY_STAY ||
      state.id === DEVICE_STATUS.PAY_VALID
    ) {
      return this._activePayout?.currentDispensedValue ?? null;
    }
    if (state.id === DEVICE_STATUS.COLLECTED) {
      return state.data[0];
    }
    if (state.id === DEVICE_STATUS.REJECTING) {
      return { code: state.data[0], description: codes.reject(state.data[0]) };
    }
    if (state.id === DEVICE_STATUS.DEV_FAILURE) {
      return { code: state.hwCode, description: state.hwDesc };
    }
    return null;
  }

  _autoAck() {
    this._pendingAck = this.SendAckResponse();
    this._pendingAck.catch((error) => {
      this._trace("automatic acknowledgement failed", {
        error: error.message,
      });
      this._emitStatusChanged("WARNING", { message: error.message });
    });
  }

  _recordPayoutCounts(state) {
    const payout = this._activePayout;
    if (!payout) return null;

    const current = new Map(
      state.counts.map(({ unit, count }) => [unit, count]),
    );
    const changes = [];
    for (const [unit, before] of payout.counts) {
      const after = current.get(unit);
      if (after !== undefined && after < before) {
        const assignment = payout.assignments.get(unit) || {};
        changes.push({
          unit,
          before,
          after,
          count: before - after,
          denom: assignment.denom || null,
          desc: assignment.desc || "",
        });
      }
    }

    for (const [unit, count] of current) payout.counts.set(unit, count);
    const amount = changes.reduce(
      (total, change) => total + change.count * (change.denom || 0),
      0,
    );
    if (amount > 0) {
      payout.dispensedTotal += amount;
      payout.currentDispensedValue = amount;
      this._emitStatusChanged("DISPENSING", amount, {
        total: payout.dispensedTotal,
      });
    }
    // if (changes.length || state.id === DEVICE_STATUS.PAY_VALID) {
    //   this._emitStatusChanged("PAYOUT_INVENTORY", {
    //     status: state.name,
    //     changes,
    //     counts: state.counts,
    //   });
    // }
    return amount;
  }

  _unregisterCallback() {
    this._requireHandle();
    if (!this._callback) throw new Error("No callback is registered.");
    const returnCode = fn.unregCb(this.h);
    if (returnCode !== 0) {
      throw new Error(
        `Br08Pro_iUnRegisterCallback failed (return=${returnCode}).`,
      );
    }
    koffi.unregister(this._callback);
    this._callback = null;
    return { returnCode };
  }

  _requireHandle() {
    if (!this.h) throw new Error("Open a device with OpenLogicalDevice first.");
  }

  _call(key, ...args) {
    const run = async () => {
      this._requireHandle();
      const status = {};
      const returnCode = await callAsync(fn[key], this.h, ...args, status);
      if (returnCode !== 0) {
        const phy = status.iPhyCode | 0;
        const logic = status.iLogicCode | 0;
        throw new Error(
          `${key} failed (return=${returnCode}) logic: ${codes.sf(logic)}${phy ? ` | device: ${codes.hw(phy)}` : ""}`,
        );
      }
      return { returnCode, deviceReturn: status };
    };
    const result = this._queue.then(run, run);
    this._queue = result.catch(() => {});
    return result;
  }
}

for (const [name, definition] of Object.entries(API_DEFINITIONS)) {
  const parameterNames = definition.parameters
    .slice(1, -1)
    .split(",")
    .map((parameter) => parameter.trim())
    .filter(Boolean);
  const optionalLast = [
    "logicalDeviceName",
    "bufferLength",
    "callbackFlag",
  ].includes(parameterNames[parameterNames.length - 1]);
  const minArgs = parameterNames.length - (optionalLast ? 1 : 0);
  Object.defineProperty(Br08Device.prototype, name, {
    value(...args) {
      if (args.length < minArgs || args.length > parameterNames.length) {
        const range =
          minArgs === parameterNames.length
            ? String(minArgs)
            : `${minArgs}-${parameterNames.length}`;
        throw new Error(`${name} expects ${range} parameter(s).`);
      }
      const callbackIndex = parameterNames.indexOf("callbackFlag");
      if (
        callbackIndex >= 0 &&
        args[callbackIndex] !== undefined &&
        ![0, 1].includes(args[callbackIndex])
      ) {
        throw new Error("callbackFlag must be 0 or 1.");
      }
      return definition.invoke(this, args);
    },
  });
}

const API_HELP = {
  enableDevice: {
    parameters: "[]",
    sample: [],
    description:
      "Enable bill receiving; handle escrow bills with CashIn/CashOut and stop receiving with SetRecvInhibit.",
  },
  startCashInSession: {
    parameters: "[]",
    sample: [],
    description:
      "Enable receiving and automatically accept bills; reports bill events through statusChanged.",
  },
  stopCashInSession: {
    parameters: "[]",
    sample: [],
    description: "Stop receiving and return the cash-in session summary.",
  },
  previewPayout: {
    parameters: "[amount]",
    sample: [1700],
    description: "Preview an exact payout plan without dispensing notes.",
  },
  payoutValue: {
    parameters: "[amount, expectedPlan?]",
    sample: [1700],
    description:
      "Dispense the requested amount immediately; pass a preview plan to ensure it has not changed.",
  },
  ...Object.fromEntries(
    Object.entries(API_DEFINITIONS).map(([name, { parameters, sample }]) => [
      name,
      { parameters, sample },
    ]),
  ),
};

module.exports = { Br08Device, API_HELP };
