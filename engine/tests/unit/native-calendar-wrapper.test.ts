import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeCalendarWrapper0x124b80,
  nativeCalendarWrapperEvidenceContract,
} from "../../src/engine/native-calendar-wrapper";
import { nativeCalendarContextState0x17f450 } from "../../src/engine/native-context-state";

test("ports the two-pass 0x124b80 calendar wrapper for the 1998 fixture", () => {
  const sourceDateTime = { year: 1998, month: 2, day: 20, hour: 10, minute: 30, second: 30 };
  const result = nativeCalendarWrapper0x124b80({
    context: nativeCalendarContextState0x17f450(),
    dateTime: sourceDateTime,
    longitudeDegrees: 120.155,
    timezoneHours: -8,
  });

  assert.deepEqual(result.trueSolarDateTime0x50, sourceDateTime);
  assert.deepEqual(result.finalLookupCyclicFields0xa0_0xac, {
    output0xa0: 4,
    output0xa4: 2,
    output0xa8: 4,
    output0xac: 2,
  });
  assert.deepEqual(result.lookupFields0xc8_0xd4, {
    output0xc8: 1998,
    output0xcc: 2,
    output0xd0: 23,
    output0xd4: 0,
  });
});

test("documents the 0x124b80 reflection and final overwrite", () => {
  assert.deepEqual(nativeCalendarWrapperEvidenceContract(), {
    function: { address: "0x124b80", endExclusive: "0x124dcd" },
    calendarCoreCalls: [
      { callAddress: "0x124c58", mode: 0 },
      { callAddress: "0x124d52", mode: 0 },
    ],
    reflectionRange: {
      start: "0x124c74",
      through: "0x124cc7",
      expression: "sourceJD + (sourceJD - firstTrueSolarJD)",
    },
    finalInputDateOverwrite: {
      start: "0x124d67",
      through: "0x124da4",
      outputOffsets: "0x50..0x77",
    },
    note: "two-pass wrapper port used by the verified mode-2 APP fixture; cross-cache calendar boundaries require additional golden samples",
  });
});
