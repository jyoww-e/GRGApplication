"use strict";

const { EventEmitter } = require("events");
const path = require("path");
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
      const result = await device._call("getCurrencyAssign", data, callbackFlag);
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
          { ucRcUnitNo: 0, ucEscrowCode: 0, ucCountryType: 0, cCountryDesc: "", uiDenomination_out: 0 },
          { ucRcUnitNo: 0, ucEscrowCode: 0, ucCountryType: 0, cCountryDesc: "", uiDenomination_out: 0 },
          { ucRcUnitNo: 0, ucEscrowCode: 0, ucCountryType: 0, cCountryDesc: "", uiDenomination_out: 0 },
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
      throw new Error(`Cannot derive command name from native API ${nativeName}.`);
    }
    return [commandName, definition];
  }),
);

class Br08Device extends EventEmitter {
  constructor({ name = "Br08ProDev" } = {}) {
    super();
    this.name = name;
    this.h = null;
    this._queue = Promise.resolve();
    this._callback = null;
  }

  async OpenConnection(...args) {
    if (args.length) throw new Error("OpenConnection expects 0 parameters.");
    let opened = false;
    let callbackRegistered = false;
    let communicationAttempted = false;
    try {
      await this.OpenLogicalDevice(this.name);
      opened = true;
      await this.RegisterCallback();
      callbackRegistered = true;
      communicationAttempted = true;
      await this.SetCommPara();
      await this.Init(0);
      const state = await this._waitForReady();
      return { connected: true, statusId: state.ucStatusID };
    } catch (error) {
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

  async _waitForReady({ timeout = 90000, interval = 500 } = {}) {
    const deadline = Date.now() + timeout;
    for (;;) {
      const { data } = await this.GetStatus();
      if (data.ucStatusID === 0x1a) return data;
      if (data.ucStatusID === 0x45) {
        throw new Error(
          `Device initialization failed: ${codes.hw(data.ushHwRetrun)}.`,
        );
      }
      if (Date.now() >= deadline) {
        throw new Error("Timed out waiting for the device to become idle.");
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
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
      (user, message, data, length, result, endCode) => {
        setImmediate(() =>
          this.emit("callback", { message, length, result, endCode }),
        );
        return 0;
      },
      koffi.pointer(Callback),
    );
    const returnCode = fn.regCb(this.h, callback, null);
    if (returnCode !== 0) {
      koffi.unregister(callback);
      throw new Error(`Br08Pro_iRegisterCallback failed (return=${returnCode}).`);
    }
    this._callback = callback;
    return { returnCode };
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
        throw new Error(
          `${name} expects ${range} parameter(s).`,
        );
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

const API_HELP = Object.fromEntries(
  Object.entries(API_DEFINITIONS).map(([name, { parameters, sample }]) => [
    name,
    { parameters, sample },
  ]),
);

module.exports = { Br08Device, API_HELP };
