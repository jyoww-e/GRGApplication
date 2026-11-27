"use strict";

const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const { Br08Device, API_HELP } = require("../src/device");
const { koffi, T, SIZE } = require("../src/native");
const codes = require("../src/codes");

function makeDevice() {
  const device = new Br08Device();
  device._trace = () => {};
  return device;
}

function stub(device, name, implementation) {
  Object.defineProperty(device, name, {
    configurable: true,
    value: implementation,
  });
}

test("enableDevice enables receiving and waits for the waiting status", async () => {
  const device = makeDevice();
  let inhibit;
  stub(device, "SetRecvInhibit", async (data, callbackFlag) => {
    inhibit = { data, callbackFlag };
  });
  stub(device, "GetStatus", async () => ({ data: { ucStatusID: 0x11 } }));

  assert.deepEqual(await device.enableDevice(), {
    enabled: true,
    statusId: 0x11,
  });
  assert.deepEqual(inhibit, {
    data: { ucIsInhibit: 0, ucReserved: [0, 0, 0, 0, 0, 0, 0] },
    callbackFlag: 0,
  });
});

test("payoutValue plans notes, splits hardware-sized rounds, and acknowledges payout", async () => {
  const device = makeDevice();
  const dispenseCalls = [];
  let acknowledgements = 0;
  stub(device, "GetStatus", async () => ({ data: { ucStatusID: 0x1a } }));
  stub(device, "GetCurrencyAssign", async () => ({
    data: {
      ucBillData_ValiCount: 1,
      stBillData: [
        { ucEscrowCode: 0x61, uiDenomination: 100, cCountryDesc: "PHP" },
      ],
    },
  }));
  stub(device, "GetRcUnitRecv", async () => ({
    data: {
      ucIsValidArrayCount: 1,
      stRcUnit_unit: [{ ucRcUnitNo: 1, ucEscrowCode: 0x61 }],
    },
  }));
  stub(device, "GetRcUnitCount", async () => ({
    data: {
      ucIsValidArrayCount: 1,
      stRcUnitCount_unit: [{ ucRcUnitNo: 1, RecycleCurrentCount: 40 }],
    },
  }));
  stub(device, "SendAckResponse", async () => {
    acknowledgements++;
  });
  stub(device, "Dispense", async (data, callbackFlag) => {
    dispenseCalls.push({ data, callbackFlag });
    setImmediate(() => {
      for (const id of [0x20, 0x23, 0x1a]) {
        device._handleState({
          id,
          name: `STATUS_${id}`,
          hwReturn: 0,
          counts: [],
          data: Buffer.alloc(32),
        });
      }
    });
  });

  const preview = await device.previewPayout(4000);
  assert.deepEqual(preview, {
    amount: 4000,
    currency: "PHP",
    plan: [{ unit: 1, denom: 100, count: 40 }],
  });
  assert.equal(dispenseCalls.length, 0);
  assert.deepEqual(await device.payoutValue(4000, preview.plan), {
    paid: 4000,
    currency: "PHP",
    plan: [{ unit: 1, denom: 100, count: 40 }],
    rounds: 2,
  });
  assert.deepEqual(
    dispenseCalls.map(({ data, callbackFlag }) => ({
      count: data.stDispenseData_unit[0].ucNeedDispenseNum,
      validCount: data.ucIsValidArrayCount,
      callbackFlag,
    })),
    [
      { count: 35, validCount: 1, callbackFlag: 1 },
      { count: 5, validCount: 1, callbackFlag: 1 },
    ],
  );
  assert.equal(acknowledgements, 2);
  await assert.rejects(
    device.payoutValue(4000, [{ unit: 1, denom: 100, count: 39 }]),
    /inventory changed/,
  );
  assert.equal(dispenseCalls.length, 2);
});

test("payoutValue rejects invalid and unavailable amounts without dispensing", async () => {
  const device = makeDevice();
  let dispenseCalled = false;
  stub(device, "GetStatus", async () => ({ data: { ucStatusID: 0x1a } }));
  stub(device, "GetCurrencyAssign", async () => ({
    data: {
      ucBillData_ValiCount: 1,
      stBillData: [{ ucEscrowCode: 0x61, uiDenomination: 500 }],
    },
  }));
  stub(device, "GetRcUnitRecv", async () => ({
    data: {
      ucIsValidArrayCount: 1,
      stRcUnit_unit: [{ ucRcUnitNo: 1, ucEscrowCode: 0x61 }],
    },
  }));
  stub(device, "GetRcUnitCount", async () => ({
    data: {
      ucIsValidArrayCount: 1,
      stRcUnitCount_unit: [{ ucRcUnitNo: 1, RecycleCurrentCount: 1 }],
    },
  }));
  stub(device, "Dispense", async () => {
    dispenseCalled = true;
  });

  await assert.rejects(device.payoutValue(0), /positive safe integer/);
  await assert.rejects(device.payoutValue(200), /Cannot pay exactly 200/);
  assert.equal(dispenseCalled, false);
});

test("payoutValue refuses a bill that is currently in escrow", async () => {
  const device = makeDevice();
  let dispenseCalled = false;
  stub(device, "GetStatus", async () => ({ data: { ucStatusID: 0x13 } }));
  stub(device, "Dispense", async () => {
    dispenseCalled = true;
  });

  await assert.rejects(device.payoutValue(100), /requires an idle device/);
  assert.equal(dispenseCalled, false);
});

test("payout DISPENSING values and total follow observed recycler count changes", () => {
  const device = makeDevice();
  device._activePayout = {
    counts: new Map([
      [1, 4],
      [2, 2],
    ]),
    assignments: new Map([
      [1, { denom: 500, desc: "PHP" }],
      [2, { denom: 1000, desc: "PHP" }],
    ]),
    dispensedTotal: 0,
    currentDispensedValue: 0,
  };
  const events = [];
  device.on("statusChanged", (event) => events.push(event));
  stub(device, "_autoAck", () => {});
  const state = {
    id: 0x20,
    name: "PAYING (0x20)",
    data: Buffer.alloc(32),
    counts: [
      { unit: 1, count: 4 },
      { unit: 2, count: 1 },
    ],
  };

  const completeDispenseStep = (counts, repeatPaying = false) => {
    const snapshot = { ...state, counts };
    device._handleState(snapshot);
    if (repeatPaying) device._handleState(snapshot);
    device._handleState({
      ...snapshot,
      id: 0x24,
      name: "PAY_STAY (0x24)",
    });
    device._handleState({
      ...snapshot,
      id: 0x23,
      name: "PAY_VALID (0x23)",
    });
  };
  completeDispenseStep(
    [
      { unit: 1, count: 4 },
      { unit: 2, count: 1 },
    ],
    true,
  );
  completeDispenseStep([
    { unit: 1, count: 4 },
    { unit: 2, count: 0 },
  ]);
  completeDispenseStep([
    { unit: 1, count: 3 },
    { unit: 2, count: 0 },
  ]);
  completeDispenseStep([
    { unit: 1, count: 2 },
    { unit: 2, count: 0 },
  ]);

  assert.deepEqual(
    events.filter((event) =>
      ["DISPENSING", "PAY_STAY", "PAY_VALID"].includes(event.event),
    ),
    [
      { event: "DISPENSING", value: 1000, total: 1000 },
      { event: "PAY_STAY", value: 1000, total: 1000 },
      { event: "PAY_VALID", value: 1000, total: 1000 },
      { event: "DISPENSING", value: 1000, total: 2000 },
      { event: "PAY_STAY", value: 1000, total: 2000 },
      { event: "PAY_VALID", value: 1000, total: 2000 },
      { event: "DISPENSING", value: 500, total: 2500 },
      { event: "PAY_STAY", value: 500, total: 2500 },
      { event: "PAY_VALID", value: 500, total: 2500 },
      { event: "DISPENSING", value: 500, total: 3000 },
      { event: "PAY_STAY", value: 500, total: 3000 },
      { event: "PAY_VALID", value: 500, total: 3000 },
    ],
  );
});

test("custom flow methods are included in API help", () => {
  assert.deepEqual(API_HELP.enableDevice.sample, []);
  assert.deepEqual(API_HELP.startCashInSession.sample, []);
  assert.deepEqual(API_HELP.stopCashInSession.sample, []);
  assert.deepEqual(API_HELP.previewPayout.sample, [1700]);
  assert.deepEqual(API_HELP.payoutValue.sample, [1700]);
});

test("native completion and disconnect callbacks use statusChanged", async () => {
  const device = makeDevice();
  const completed = once(device, "statusChanged");
  device._onCallback(2, null, 0, 7, 0x1234);
  assert.deepEqual((await completed)[0], {
    event: "OPERATION_COMPLETE",
    value: {
      result: 7,
      endCode: 0x1234,
      endDesc: codes.sf(0x1234),
    },
  });

  const disconnected = once(device, "statusChanged");
  device._onCallback(1, null, 0, 0, 0);
  assert.deepEqual((await disconnected)[0], {
    event: "DISCONNECTED",
    value: null,
  });
});

test("status, hardware-log, and firmware callbacks use statusChanged", async () => {
  const device = makeDevice();
  const statusChangedEvent = once(device, "statusChanged");
  device._onCallback(3, Buffer.alloc(SIZE.DevState), SIZE.DevState, 0, 0);
  assert.deepEqual((await statusChangedEvent)[0], {
    event: "UNKNOWN",
    value: null,
  });

  const logEvent = once(device, "statusChanged");
  const logData = Buffer.alloc(SIZE.LogProgress);
  device._onCallback(4, logData, logData.length, 0, 0);
  assert.deepEqual((await logEvent)[0], {
    event: "HARDWARE_LOG_PROGRESS",
    value: koffi.decode(logData, T.LogProgress),
  });

  const firmwareEvent = once(device, "statusChanged");
  const firmwareData = Buffer.alloc(SIZE.FirmwareProgress);
  device._onCallback(5, firmwareData, firmwareData.length, 0, 0);
  assert.deepEqual(
    (await firmwareEvent)[0],
    {
      event: "FIRMWARE_PROGRESS",
      value: koffi.decode(firmwareData, T.FirmwareProgress),
    },
  );
});

test("status callback parsing maps standalone status and recycler counts", () => {
  const device = makeDevice();
  const state = device._parseState({
    ucStatusID: 0x13,
    bHasData: 1,
    ushHwRetrun: 4,
    uc_union_devState_data_map: new Array(32).fill(0),
    stRcUnitCount: {
      ucIsValidArrayCount: 1,
      stRcUnitCount_unit: [
        { ucRcUnitNo: 2, RecycleCurrentCount: 9 },
      ],
    },
  });

  assert.equal(state.id, 0x13);
  assert.equal(state.name, "ESCROW (0x13)");
  assert.equal(state.hasData, true);
  assert.equal(state.hwReturn, 4);
  assert.deepEqual(state.counts, [{ unit: 2, count: 9 }]);
  assert.equal(state.data.length, 32);
});

test("cash-in emits stacking, stored, and stacked events with denomination values", async () => {
  const device = makeDevice();
  const acceptCalls = [];
  stub(device, "enableDevice", async () => ({
    enabled: true,
    statusId: 0x11,
  }));
  stub(device, "CashIn", async (callbackFlag) => {
    acceptCalls.push(callbackFlag);
  });
  stub(device, "_autoAck", () => {});
  stub(device, "GetStatus", async () => ({
    data: { ucStatusID: 0x11 },
  }));
  stub(device, "SetRecvInhibit", async () => {});
  const events = [];
  device.on("statusChanged", (event) => events.push(event));

  const session = await device.startCashInSession();
  for (const [denomination, unit] of [
    [1000, 2],
    [100, 0],
  ]) {
    const data = Buffer.alloc(32);
    data.write("PHP", 4, "ascii");
    data.writeUInt32LE(denomination, 12);
    device._handleState({ id: 0x13, data, counts: [] });
    device._handleState({ id: 0x15, data, counts: [] });
    device._handleState({ id: 0x14, data, counts: [] });
    const stackedData = Buffer.alloc(32);
    stackedData[0] = unit;
    device._handleState({ id: 0x16, data: stackedData, counts: [] });
  }

  assert.deepEqual(events, [
    { event: "STACKING", value: 1000 },
    { event: "STORED", value: 1000 },
    { event: "STACKING", value: 100 },
    { event: "STACKED", value: 100 },
  ]);
  assert.deepEqual(acceptCalls, [1, 1]);
  assert.deepEqual(await device.stopCashInSession(), {
    total: 1100,
    notes: 2,
    currency: "PHP",
    by: [
      [1000, 1],
      [100, 1],
    ],
  });
  assert.equal(Br08Device.statusEventName(0x20), "DISPENSING");
});
