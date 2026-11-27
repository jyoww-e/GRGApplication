"use strict";
const { EventEmitter } = require("events");
const { koffi, T, SIZE, Callback, fn, callAsync } = require("./native");
const codes = require("./codes");

const TRACE = process.env.BR08_TRACE === "1";
const trace = (message) => {
  if (TRACE) console.log(`[BR08 TRACE ${new Date().toISOString()}] ${message}`);
};
const hexCode = (value) =>
  `0x${(value >>> 0).toString(16).toUpperCase().padStart(6, "0")}`;
const API_NAMES = {
  setComm: "Br08Pro_iSetCommPara",
  closeComm: "Br08Pro_iCloseComm",
  getStatus: "Br08Pro_iGetStatus",
  getVersion: "Br08Pro_iGetVersion",
  getSerial: "Br08Pro_iGetSecretNumber",
  init: "Br08Pro_iInit",
  cashIn: "Br08Pro_iCashIn",
  cashOut: "Br08Pro_iCashOut",
  dispense: "Br08Pro_iDispense",
  cashCount: "Br08Pro_iCashCount",
  getCurrencyAssign: "Br08Pro_iGetCurrencyAssign",
  getCurrencyAssignWithCurrency: "Br08Pro_iGetCurrencyAssign_withCurrency",
  getNominalValueCount: "Br08Pro_iGetSuppost_nominalValueListNum",
  getNominalValueData: "Br08Pro_iGetSuppost_nominalValueListData",
  getHwLog: "Br08Pro_iGetHwLog",
  updateRcFirmware: "Br08Pro_iHwUpdate_rcUnitModule",
  updateMainFirmware: "Br08Pro_iHwUpdate_mainctrl",
  setEnable: "Br08Pro_iSetBill_escrowCode_enable",
  getEnable: "Br08Pro_iGetBill_escrowCode_enable",
  setInhibit: "Br08Pro_iSetRecvInhibit",
  getInhibit: "Br08Pro_iGetRecvInhibit",
  setRcRecv: "Br08Pro_iSetRcUnitRecv",
  getRcRecv: "Br08Pro_iGetRcUnitRecv",
  setRcCount: "Br08Pro_iSetRcUnitCount",
  getRcCount: "Br08Pro_iGetRcUnitCount",
  ack: "Br08Pro_iSendAckResponse",
  getSupportedCur: "Br08Pro_iGetSuppostRecvCurrency",
  setCurrentCur: "Br08Pro_iSetCurrentRecvCurrency",
  getCurrentCur: "Br08Pro_iGetCurrentRecvCurrency",
};

// Status IDs (BR08ProDevDef.h)
const ST = {
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
const ST_NAME = Object.fromEntries(Object.entries(ST).map(([k, v]) => [v, k]));
const WM = {
  DISCONNECTED: 1,
  COMPLETE: 2,
  STATUS_CHANGED: 3,
  HW_LOG_GET: 4,
  HW_UPDATE: 5,
};
const statusName = (id) =>
  `${ST_NAME[id] || "UNKNOWN"} (0x${id.toString(16).toUpperCase().padStart(2, "0")})`;

class Br08Error extends Error {
  constructor(what, ret, st) {
    const phy = (st && st.iPhyCode) | 0;
    const logic = (st && st.iLogicCode) | 0;
    super(
      `${what} failed (ret=${ret}) logic: ${codes.sf(logic)}${phy ? " | device: " + codes.hw(phy) : ""}`,
    );
    this.name = "Br08Error";
    this.ret = ret;
    this.phyCode = phy;
    this.logicCode = logic;
  }
}

const pad = (arr, n, make) =>
  Array.from({ length: n }, (_, i) => (i < arr.length ? arr[i] : make()));

class Br08Device extends EventEmitter {
  constructor({ name = "Br08ProDev" } = {}) {
    super();
    this.name = name;
    this.h = null;
    this.status = null; // last known status id
    this.escrow = null; // last bill seen in escrow
    this._queue = Promise.resolve();
    this._cb = null;
    this._activePayout = null;
  }

  // ------------------------------------------------------------ native call plumbing
  /** Serialised native call. Last native argument (tDevReturn) is added automatically. */
  _call(key, ...args) {
    const run = async () => {
      if (!this.h) throw new Error("Device is not open");
      const st = {};
      const name = API_NAMES[key] || `Br08Pro_${key}`;
      const started = Date.now();
      trace(`CALL ${name}`);
      let ret;
      try {
        ret = await callAsync(fn[key], this.h, ...args, st);
      } catch (e) {
        trace(`THREW ${name} after ${Date.now() - started}ms: ${e.message}`);
        throw e;
      }
      trace(
        `RESULT ${name} ret=${ret} logic=${hexCode(st.iLogicCode)} device=${hexCode(st.iPhyCode)} duration=${Date.now() - started}ms`,
      );
      if (ret !== 0) throw new Br08Error(`Br08Pro ${key}`, ret, st);
      return st;
    };
    const p = this._queue.then(run, run);
    this._queue = p.catch(() => {});
    return p;
  }

  _onCallback(msg, data, len, result, endCode) {
    // runs while the SDK thread waits: keep it tiny
    try {
      if (msg === WM.STATUS_CHANGED) {
        if (!data || len < SIZE.DevState) return 0;
        const state = this._parseState(koffi.decode(data, T.DevState)); // copy now; pointer is only valid here
        setImmediate(() => this._handleState(state));
      } else if (msg === WM.COMPLETE) {
        setImmediate(() =>
          this.emit("complete", {
            result,
            endCode,
            endDesc: codes.sf(endCode),
          }),
        );
      } else if (msg === WM.DISCONNECTED) {
        setImmediate(() => this.emit("disconnected"));
      } else if (msg === WM.HW_LOG_GET) {
        if (!data || len < SIZE.LogProgress) {
          throw new Error(
            `Invalid hardware-log callback payload (${len} bytes)`,
          );
        }
        const progress = koffi.decode(data, T.LogProgress);
        setImmediate(() => this.emit("hwLogProgress", progress));
      } else if (msg === WM.HW_UPDATE) {
        if (!data || len < SIZE.FirmwareProgress) {
          throw new Error(
            `Invalid firmware-update callback payload (${len} bytes)`,
          );
        }
        const progress = koffi.decode(data, T.FirmwareProgress);
        setImmediate(() => this.emit("firmwareProgress", progress));
      }
    } catch (e) {
      setImmediate(() =>
        this.emit("warn", new Error(`Native callback error: ${e.message}`)),
      );
    }
    return 0;
  }

  _parseState(s) {
    const n = Math.min(s.stRcUnitCount.ucIsValidArrayCount, 4);
    return {
      id: s.ucStatusID,
      name: statusName(s.ucStatusID),
      hasData: !!s.bHasData,
      data: Buffer.from(s.uc_union_devState_data_map),
      hwReturn: s.ushHwRetrun,
      counts: s.stRcUnitCount.stRcUnitCount_unit
        .slice(0, n)
        .map((u) => ({ unit: u.ucRcUnitNo, count: u.RecycleCurrentCount })),
    };
  }

  _handleState(st) {
    this.status = st.id;
    if (st.id === ST.DEV_FAILURE) {
      st.hwCode = st.data.readUInt16LE(0);
      st.hwDesc = codes.hw(st.hwCode);
    }
    this.emit("status", st);
    switch (st.id) {
      case ST.ESCROW: {
        this.escrow = koffi.decode(
          st.data.subarray(0, SIZE.BillData),
          T.BillData,
        );
        this.emit("escrow", this.escrow);
        break;
      }
      case ST.VEND_VALID:
        this.emit("vend", this.escrow);
        this._autoAck();
        break; // must be ACKed
      case ST.PAY_VALID:
        this._recordPayoutCounts(st);
        this._autoAck();
        break; // must be ACKed
      case ST.PAYING:
      case ST.PAY_STAY:
        this._recordPayoutCounts(st);
        break;
      case ST.STACKED:
        this.emit("stacked", { unit: st.data[0] });
        break;
      case ST.REJECTING:
        this.emit("rejecting", {
          code: st.data[0],
          desc: codes.reject(st.data[0]),
        });
        break;
      case ST.COLLECTED:
        this.emit("collected", { unit: st.data[0] });
        break;
      case ST.DEV_FAILURE:
        this.emit("failure", { code: st.hwCode, desc: st.hwDesc });
        break;
      default:
        break;
    }
  }

  _autoAck() {
    this.ack().catch((e) => this.emit("warn", e));
  }

  _recordPayoutCounts(st) {
    const payout = this._activePayout;
    if (!payout) return;

    const current = new Map(st.counts.map(({ unit, count }) => [unit, count]));
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
    if (changes.length || st.id === ST.PAY_VALID) {
      this.emit("payoutInventory", {
        status: st.name,
        changes,
        counts: st.counts,
      });
    }
  }

  /** Wait until a status satisfies pred. Returns { promise, cancel }. */
  waitStatus(pred, { timeout = 30000, label = "device", poll = 1000 } = {}) {
    let cleanup = () => {};
    const promise = new Promise((resolve, reject) => {
      let finished = false;
      const finish = (err, val) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (err) reject(err);
        else resolve(val);
      };
      const onStatus = (e) => {
        if (pred(e.id)) finish(null, e.id);
        else if (e.id === ST.DEV_FAILURE)
          finish(
            new Error(`Device failure while waiting for ${label}: ${e.hwDesc}`),
          );
      };
      const onComplete = (e) => {
        if (e.result !== 0)
          finish(
            new Error(
              `Operation failed while waiting for ${label}: ${e.endDesc}`,
            ),
          );
      };
      const timer = setTimeout(
        () => finish(new Error(`Timed out waiting for ${label}`)),
        timeout,
      );
      const poller = poll
        ? setInterval(
            () =>
              this.refresh()
                .then((s) => {
                  if (pred(s.id)) finish(null, s.id);
                })
                .catch(() => {}),
            poll,
          )
        : null;
      cleanup = () => {
        clearTimeout(timer);
        if (poller) clearInterval(poller);
        this.off("status", onStatus);
        this.off("complete", onComplete);
      };
      this.on("status", onStatus);
      this.on("complete", onComplete);
    });
    promise.catch(() => {}); // avoid unhandled-rejection if nobody awaits it yet
    return { promise, cancel: () => cleanup() };
  }

  // ------------------------------------------------------------ lifecycle
  async connect() {
    const st = {};
    const openStarted = Date.now();
    trace(`CALL Br08Pro_hOpenLogicalDevice name=${JSON.stringify(this.name)}`);
    this.h = fn.open(this.name, st);
    trace(
      `RESULT Br08Pro_hOpenLogicalDevice handle=${this.h ? "valid" : "null"} logic=${hexCode(st.iLogicCode)} device=${hexCode(st.iPhyCode)} duration=${Date.now() - openStarted}ms`,
    );
    if (!this.h) {
      throw new Error(
        `Br08Pro_hOpenLogicalDevice("${this.name}") failed: logic ${codes.sf(st.iLogicCode)}, device ${codes.hw(st.iPhyCode)}\n` +
          "  Check that the vendor INI files are in place and that the logical name matches the [section] in GRGDTATM_CommCfg.ini.",
      );
    }
    this._cb = koffi.register(
      (u, m, d, l, r, e) => this._onCallback(m, d, l, r, e),
      koffi.pointer(Callback),
    );
    const callbackStarted = Date.now();
    trace("CALL Br08Pro_iRegisterCallback");
    const callbackRet = fn.regCb(this.h, this._cb, null);
    trace(
      `RESULT Br08Pro_iRegisterCallback ret=${callbackRet} duration=${Date.now() - callbackStarted}ms`,
    );
    if (callbackRet !== 0) throw new Error("Br08Pro_iRegisterCallback failed");
    await this._call("setComm"); // opens the serial port described in the INI
    await this.reinit();
  }

  async reinit() {
    const w = this.waitStatus((id) => id === ST.IDLE || id === ST.WAITING, {
      timeout: 90000,
      label: "initialization",
    });
    try {
      await this._call("init", 0);
      await w.promise;
    } finally {
      w.cancel();
    }
    await this.setReceiving(false);
  }

  async close() {
    if (!this.h) return;
    try {
      await this.setReceiving(false);
    } catch {
      /* ignore */
    }
    try {
      await this._call("closeComm");
    } catch {
      /* ignore */
    }
    try {
      fn.unregCb(this.h);
    } catch {
      /* ignore */
    }
    fn.close(this.h);
    this.h = null;
    if (this._cb) {
      koffi.unregister(this._cb);
      this._cb = null;
    }
  }

  // ------------------------------------------------------------ queries
  async refresh() {
    const out = {};
    await this._call("getStatus", out);
    const s = this._parseState(out);
    this.status = s.id;
    return s;
  }
  async getVersion() {
    const o = {};
    await this._call("getVersion", o, 0);
    return o.cVersion;
  }
  async getSerial() {
    const o = {};
    await this._call("getSerial", o, 0);
    return o.cSerial;
  }
  getDllVersion() {
    const buf = Buffer.alloc(128);
    fn.dllVersion(this.h, buf, buf.length);
    const end = buf.indexOf(0);
    return buf.toString("utf8", 0, end < 0 ? buf.length : end);
  }

  async getBills() {
    // denomination table: escrow code <-> value
    const o = {};
    await this._call("getCurrencyAssign", o, 0);
    return o.stBillData.slice(0, o.ucBillData_ValiCount).map((b) => ({
      code: b.ucEscrowCode,
      country: b.ucCountryType,
      desc: b.cCountryDesc,
      denom: b.uiDenomination,
    }));
  }
  async getBillsForCurrency({ type, desc }) {
    const o = {};
    await this._call(
      "getCurrencyAssignWithCurrency",
      { ucCurrencyType: type, cCurrencyDesc: desc },
      o,
      0,
    );
    return o.stBillData.slice(0, o.ucBillData_ValiCount).map((b) => ({
      code: b.ucEscrowCode,
      country: b.ucCountryType,
      desc: b.cCountryDesc,
      denom: b.uiDenomination,
    }));
  }
  async getSupportedDenominations() {
    const countOut = [0];
    await this._call("getNominalValueCount", countOut);
    const count = countOut[0];
    if (!Number.isInteger(count) || count < 0 || count > 64) {
      throw new Error(`Invalid supported-denomination count: ${count}`);
    }
    if (count === 0) return [];

    const data = Buffer.alloc(count * SIZE.BillData);
    await this._call("getNominalValueData", count, data);
    return Array.from({ length: count }, (_, i) =>
      koffi.decode(
        data.subarray(i * SIZE.BillData, (i + 1) * SIZE.BillData),
        T.BillData,
      ),
    );
  }
  async getHardwareLog(query) {
    await this._call("getHwLog", query);
    return query;
  }
  async updateRcFirmware(module, firmwarePath) {
    await this._call("updateRcFirmware", module, firmwarePath);
  }
  async updateMainFirmware(firmwarePath) {
    await this._call("updateMainFirmware", firmwarePath);
  }
  openComm() {
    return this._call("setComm");
  }
  closeComm() {
    return this._call("closeComm");
  }
  async getEnabled() {
    const o = {};
    await this._call("getEnable", o, 0);
    return {
      flags: Array.from(o.ucIsEnable_escrowCode_bill),
      reserved: Array.from(o.ucIsEnable_escrowCode_bill_reservred),
    };
  }
  async setEnabled({ flags, reserved }) {
    await this._call(
      "setEnable",
      {
        ucIsEnable_escrowCode_bill: flags,
        ucIsEnable_escrowCode_bill_reservred: reserved,
      },
      0,
    );
  }
  async getRcUnits() {
    // which denomination each recycler unit is set to hold
    const o = {};
    await this._call("getRcRecv", o, 0);
    return o.stRcUnit_unit.slice(0, o.ucIsValidArrayCount).map((u) => ({
      unit: u.ucRcUnitNo,
      code: u.ucEscrowCode,
      country: u.ucCountryType,
      desc: u.cCountryDesc,
    }));
  }
  async setRcUnits(units) {
    const blank = () => ({
      ucRcUnitNo: 0,
      ucEscrowCode: 0,
      ucCountryType: 0,
      cCountryDesc: "",
      uiDenomination_out: 0,
    });
    const list = units.map((u) => ({
      ucRcUnitNo: u.unit,
      ucEscrowCode: u.code,
      ucCountryType: u.country,
      cCountryDesc: u.desc,
      uiDenomination_out: 0,
    }));
    await this._call(
      "setRcRecv",
      { ucIsValidArrayCount: units.length, stRcUnit_unit: pad(list, 4, blank) },
      0,
    );
  }
  async getCounts() {
    const o = {};
    await this._call("getRcCount", o, 0);
    return o.stRcUnitCount_unit
      .slice(0, o.ucIsValidArrayCount)
      .map((u) => ({ unit: u.ucRcUnitNo, count: u.RecycleCurrentCount }));
  }
  async setCount(unit, n) {
    // tell the device how many notes a unit holds (after manual refill)
    const cur = (await this.getCounts())
      .filter((c) => c.unit !== unit)
      .concat({ unit, count: n })
      .sort((a, b) => a.unit - b.unit);
    const list = cur.map((c) => ({
      ucRcUnitNo: c.unit,
      RecycleCurrentCount: c.count,
    }));
    await this._call(
      "setRcCount",
      {
        ucIsValidArrayCount: list.length,
        stRcUnitCount_unit: pad(list, 4, () => ({
          ucRcUnitNo: 0,
          RecycleCurrentCount: 0,
        })),
      },
      0,
    );
  }
  async getSupportedCurrencies() {
    const o = {};
    await this._call("getSupportedCur", o, 0);
    return o.stCurrencyData
      .slice(0, o.ucIsValidArrayCount)
      .map((c) => ({ type: c.ucCurrencyType, desc: c.cCurrencyDesc }));
  }
  async getCurrentCurrency() {
    const o = {};
    await this._call("getCurrentCur", o, 0);
    return { type: o.ucCurrencyType, desc: o.cCurrencyDesc };
  }
  async getReceiveInhibited() {
    const o = {};
    await this._call("getInhibit", o, 0);
    return !!o.ucIsInhibit;
  }
  async setCurrentCurrency({ type, desc }) {
    await this._call(
      "setCurrentCur",
      { ucCurrencyType: type, cCurrencyDesc: desc },
      0,
    );
  }

  // ------------------------------------------------------------ operations
  /** true = accept bills (status 0x11 waiting); false = stop (status 0x1A idle). */
  async setReceiving(on) {
    await this._call(
      "setInhibit",
      { ucIsInhibit: on ? 0 : 1, ucReserved: new Array(7).fill(0) },
      0,
    );
  }
  async startReceiving() {
    await this.setReceiving(true);
    const w = this.waitStatus(
      (id) => id === ST.WAITING || id === ST.ACCEPTING,
      { timeout: 15000, poll: 500, label: "ready to receive" },
    );
    try {
      await w.promise;
    } finally {
      w.cancel();
    }
  }
  async stopReceiving() {
    const s = await this.refresh(); // let a bill that is mid-way finish first
    if (s.id !== ST.WAITING && s.id !== ST.IDLE) {
      const w = this.waitStatus((id) => id === ST.WAITING || id === ST.IDLE, {
        timeout: 30000,
        poll: 500,
        label: "current bill to finish",
      });
      try {
        await w.promise;
      } finally {
        w.cancel();
      }
    }
    await this.setReceiving(false);
  }
  async ensureIdle() {
    if ((await this.refresh()).id === ST.IDLE) return;
    await this.setReceiving(false);
    const w = this.waitStatus((id) => id === ST.IDLE, {
      timeout: 20000,
      poll: 500,
      label: "idle state",
    });
    try {
      await w.promise;
    } finally {
      w.cancel();
    }
  }

  acceptEscrow() {
    return this._call("cashIn", 1);
  } // store the bill that is in escrow (status 0x13)
  returnEscrow() {
    return this._call("cashOut", 1);
  } // give the bill that is in escrow back to the customer
  async ack() {
    await this._call("ack");
  }

  /** Pay out notes. plan = [{ unit: 1..4, count: 1..35 }]  (max 4 units per call). Resolves when the device is idle again. */
  async dispense(plan) {
    await this.ensureIdle();
    const [initialCounts, configuredUnits, bills] = await Promise.all([
      this.getCounts(),
      this.getRcUnits(),
      this.getBills(),
    ]);
    const assignments = new Map(
      configuredUnits.map((unit) => {
        const bill = bills.find((entry) => entry.code === unit.code);
        return [
          unit.unit,
          {
            denom: bill ? bill.denom : null,
            desc: (bill && bill.desc) || unit.desc,
          },
        ];
      }),
    );
    for (const item of plan) {
      if (item.denom) {
        const assignment = assignments.get(item.unit) || {};
        assignments.set(item.unit, {
          ...assignment,
          denom: item.denom,
        });
      }
    }
    const payout = {
      counts: new Map(initialCounts.map(({ unit, count }) => [unit, count])),
      assignments,
    };
    this._activePayout = payout;

    const seen = { active: false };
    const mark = (e) => {
      if (e.id === ST.PAYING || e.id === ST.PAY_STAY || e.id === ST.PAY_VALID)
        seen.active = true;
    };
    this.on("status", mark);
    const w = this.waitStatus((id) => id === ST.IDLE && seen.active, {
      timeout: 180000,
      poll: 0,
      label: "payout to finish",
    });
    const units = plan.map((p) => ({
      ucRcUnitNo: p.unit,
      ucNeedDispenseNum: p.count,
    }));
    try {
      await this._call(
        "dispense",
        {
          ucIsValidArrayCount: units.length,
          stDispenseData_unit: pad(units, 4, () => ({
            ucRcUnitNo: 0,
            ucNeedDispenseNum: 0,
          })),
        },
        1,
      );
      await w.promise;
    } finally {
      this.off("status", mark);
      w.cancel();
      if (this._activePayout === payout) this._activePayout = null;
    }
  }

  /** Move notes from recycler units into the cash box ("settle accounts"). plan = [{ unit, count }]. */
  async settle(plan) {
    await this.ensureIdle();
    const seen = { active: false };
    const mark = (e) => {
      if (e.id === ST.COLLECTING || e.id === ST.COLLECTED) seen.active = true;
    };
    this.on("status", mark);
    const w = this.waitStatus((id) => id === ST.IDLE && seen.active, {
      timeout: 180000,
      poll: 0,
      label: "settlement to finish",
    });
    const units = plan.map((p) => ({
      ucRcUnitNo: p.unit,
      ucNeedCashCountNum: p.count,
    }));
    try {
      await this._call(
        "cashCount",
        {
          ucIsValidArrayCount: units.length,
          stCashCountData_unit: pad(units, 4, () => ({
            ucRcUnitNo: 0,
            ucNeedCashCountNum: 0,
          })),
        },
        1,
      );
      await w.promise;
    } finally {
      this.off("status", mark);
      w.cancel();
    }
  }
}

module.exports = { Br08Device, Br08Error, ST, statusName };
