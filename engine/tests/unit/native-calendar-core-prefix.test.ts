import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeCalendarCorePrefixError,
  nativeCalendarCorePrefix0x14dbd0,
  nativeCalendarCorePrefixEvidenceContract,
} from "../../src/engine/native-calendar-core-prefix";
import { nativeCalendarContextState0x17f450 } from "../../src/engine/native-context-state";

const fixture = {
  dateTime: { year: 1998, month: 2, day: 20, hour: 10, minute: 30, second: 30 },
  longitudeDegrees: 120.155,
  timezoneHours: -8,
} as const;

test("ports the 0x14dbd0 prefix through true-solar date and consumed lookup fields", () => {
  const result = nativeCalendarCorePrefix0x14dbd0({
    ...fixture,
    context: nativeCalendarContextState0x17f450(),
    mode: 0,
  });

  assert.deepEqual(result.workingDateTime0x00, fixture.dateTime);
  assert.deepEqual(result.trueSolarDateTime0x50, {
    year: 1998,
    month: 2,
    day: 20,
    hour: 10,
    minute: 17,
    second: 20.45533686876297,
  });
  assert.deepEqual(result.lookupDate, { year: 1998, month: 2, day: 20 });
  assert.equal(result.angleSector0x14deeb, 168);
  assert.equal(result.hourIndex0x14e051, 5);
  assert.deepEqual(result.preliminaryCyclicFields, {
    output0xa0_0xa4BeforeLookupOverwrite: { mod10: 4, mod12: 2 },
    output0xb0_0xb4: { mod10: 0, mod12: 2 },
    output0xb8_0xbc: { mod10: 4, mod12: 10 },
    output0xc0_0xc4: { mod10: 3, mod12: 5 },
  });
  assert.deepEqual(result.lookupFields0xc8_0xd4, {
    output0xc8: 1998,
    output0xcc: 2,
    output0xd0: 23,
    output0xd4: 0,
  });
  assert.deepEqual(result.finalLookupCyclicFields0xa0_0xac, {
    output0xa0: 4,
    output0xa4: 2,
    output0xa8: 4,
    output0xac: 2,
  });
  assert.deepEqual(result.eventBoundaries0xd8_0x183, {
    atOrBefore0xd8: {
      eventJulianDay: 2450863.956425453,
      dateTime: {
        year: 1998,
        month: 2,
        day: 19,
        hour: 10,
        minute: 57,
        second: 15.159145295619965,
      },
      label: 4,
    },
    after0x130: {
      eventJulianDay: 2450878.9962042756,
      dateTime: {
        year: 1998,
        month: 3,
        day: 6,
        hour: 11,
        minute: 54,
        second: 32.04941511154175,
      },
      label: 5,
    },
  });
  assert.deepEqual(result.intermediate.centuries0x14de11, {
    low: 0x64eec98807d49d96n,
    high: 0xbff931344e2bf7b2n,
  });
});

test("preserves the native mode-one and mode-two two-hour date adjustment", () => {
  const plusTwoHours = nativeCalendarCorePrefix0x14dbd0({
    ...fixture,
    context: nativeCalendarContextState0x17f450(),
    mode: 1,
  });
  const minusTwoHours = nativeCalendarCorePrefix0x14dbd0({
    ...fixture,
    context: nativeCalendarContextState0x17f450(),
    mode: 2,
  });

  assert.deepEqual(plusTwoHours.workingDateTime0x00, {
    year: 1998,
    month: 2,
    day: 20,
    hour: 12,
    minute: 30,
    second: 30.00001162290573,
  });
  assert.equal(plusTwoHours.hourIndex0x14e051, 6);
  assert.deepEqual(minusTwoHours.workingDateTime0x00, {
    year: 1998,
    month: 2,
    day: 20,
    hour: 8,
    minute: 30,
    second: 29.999984800815582,
  });
  assert.equal(minusTwoHours.hourIndex0x14e051, 4);
});

test("rejects unsupported input values without widening native claims", () => {
  assert.throws(
    () => nativeCalendarCorePrefix0x14dbd0({
      ...fixture,
      context: nativeCalendarContextState0x17f450(),
      longitudeDegrees: Number.NaN,
      mode: 0,
    }),
    NativeCalendarCorePrefixError,
  );
});

test("documents the exact prefix boundary and completed lookup overwrite", () => {
  assert.deepEqual(nativeCalendarCorePrefixEvidenceContract(), {
    function: { address: "0x14dbd0", endExclusive: "0x14e9d6" },
    implementedRange: { start: "0x14dbd0", through: "0x14e927" },
    directHelpers: [
      { address: "0x187270", callAddresses: ["0x14dcdd", "0x14e2bc"] },
      { address: "0x187090", callAddresses: ["0x14dd4b", "0x14df99", "0x14e2d0"] },
      { address: "0x183830", callAddresses: ["0x14dddd"] },
      { address: "0x185800", callAddresses: ["0x14de2c"] },
      { address: "0x184970", callAddresses: ["0x14df07"] },
      { address: "0x14bed0", callAddresses: ["0x14e31f", "0x14e3a3"] },
    ],
    finalOverwrite: {
      address: "0x14e464",
      sourceOffsets: "0x14bed0 output bytes 0x78..0x7b",
      targetOffsets: "0x14dbd0 output dwords 0xa0..0xac",
    },
    characterizationVectorCount: 3,
    note: "fixture-range static port through vector-selected 0xd8..0x183 dates and conditional residue correction; 0x14e7bf cross-cache rollover remains a named unsupported path",
  });
});
