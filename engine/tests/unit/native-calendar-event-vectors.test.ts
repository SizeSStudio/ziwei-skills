import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeCalendarEventVectors0x14bed0,
  nativeCalendarEventVectorsEvidenceContract,
} from "../../src/engine/native-calendar-event-vectors";
import { nativeContextRefill0x182880 } from "../../src/engine/native-context-refill";
import { nativeCalendarContextState0x17f450 } from "../../src/engine/native-context-state";

test("ports the 0x14bed0 event vectors consumed by the 0x14dbd0 tail", () => {
  const context = nativeCalendarContextState0x17f450();
  nativeContextRefill0x182880(context, -680);
  const result = nativeCalendarEventVectors0x14bed0(context);

  assert.equal(result.eventJulianDays0x38.length, 25);
  assert.equal(result.eventLabels0x50.length, 25);
  assert.ok(result.eventJulianDays0x38.every(Number.isFinite));
  assert.ok(result.eventLabels0x50.every((value) => Number.isInteger(value) && value >= 0 && value < 24));
  assert.deepEqual(result.eventLabels0x50, [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0,
  ]);
  assert.deepEqual(
    [
      result.eventJulianDays0x38[0],
      result.eventJulianDays0x38[4],
      result.eventJulianDays0x38[24],
    ],
    [2450804.720939805, 2450863.956425453, 2451169.9702385115],
  );
});

test("documents the exact 0x14bed0 event-vector boundary", () => {
  assert.deepEqual(nativeCalendarEventVectorsEvidenceContract(), {
    functionAddress: "0x14bed0",
    implementedRange: { start: "0x14d2aa", through: "0x14d69d" },
    outputOffsets: { eventJulianDays: "0x38", eventLabels: "0x50" },
    recordCount: 25,
    directHelpers: [
      { address: "0x183830", callAddresses: ["0x14d2c1", "0x14d478"] },
      { address: "0x185800", callAddresses: ["0x14d341"] },
      { address: "0x1861d0", callAddresses: ["0x14d448"] },
      { address: "0x187090", callAddresses: ["0x14d60b", "0x14d61e"] },
      { address: "0x187270", callAddresses: ["0x14d644"] },
      { address: "0x14d870", callAddresses: ["0x14d667"] },
      { address: "0x14bcb0", callAddresses: ["0x14d689"] },
    ],
    note: "static port of the two vectors consumed by 0x14dbd0; unrelated 0x14bed0 string and day-selected side outputs remain outside this result",
  });
});
