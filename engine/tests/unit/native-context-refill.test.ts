import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeCalendarContextState,
  nativeCalendarContextState0x17f450,
} from "../../src/engine/native-context-state";
import {
  NativeContextRefillSampler,
  nativeContextRefill0x182880,
} from "../../src/engine/native-context-refill";
import {
  nativeBinary128BitsToDouble,
  nativeBinary128BitsToInt,
} from "../../src/engine/native-numeric";

test("constructs the lightweight context state from the APK constructor assets", () => {
  const context = nativeCalendarContextState0x17f450();

  assert.equal(context.modeOneRecords0x0.length, 23);
  assert.equal(context.modeZeroRecords0x8.length, 71);
  assert.equal(context.modeOneMarkers0xa0.length, 23_952);
  assert.equal(context.modeZeroMarkers0xb8.length, 2_989);
  assert.deepEqual(context.recordCache0x10, []);
  assert.deepEqual(context.monthBoundaries0x50, []);
  assert.deepEqual(context.byteTable0x68, []);
  assert.deepEqual(context.byteTable0x80, []);
  assert.equal(context.leapIndex0x98, 0);
});

test("ports the 0x182880 refill loops and fallback normalization order", () => {
  const context = nativeCalendarContextState0x17f450();
  const calls: Array<{ mode: 0 | 1; target: number }> = [];
  const sampler: NativeContextRefillSampler = (_context, mode, rawTarget) => {
    const target = nativeBinary128BitsToDouble(rawTarget);
    calls.push({ mode, target });
    return Math.floor(target);
  };

  nativeContextRefill0x182880(context, -680, sampler);

  assert.equal(calls.length, 44);
  assert.equal(calls.filter((call) => call.mode === 0).length, 28);
  assert.equal(calls.filter((call) => call.mode === 1).length, 16);
  assert.equal(context.recordCache0x10.length, 25);
  assert.equal(context.monthBoundaries0x50.length, 15);
  assert.equal(context.byteTable0x80.length, 14);
  assert.equal(context.byteTable0x68.length, 14);
  assert.deepEqual(
    context.byteTable0x80,
    context.monthBoundaries0x50.slice(1).map((value, index) => value - context.monthBoundaries0x50[index]),
  );
  assert.equal(context.leapIndex0x98, 0);
  assert.deepEqual(context.byteTable0x68, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1]);
});

test("uses the context's mode-specific APK records and marker strings for real sampling", () => {
  const context = nativeCalendarContextState0x17f450();
  const result = nativeContextRefill0x182880(context, -680);

  assert.equal(result, context);
  assert.deepEqual(context.recordCache0x10.map(nativeBinary128BitsToInt), [
    -740, -726, -711, -696, -681, -666, -651, -636, -621, -605,
    -590, -574, -559, -543, -527, -511, -496, -480, -465, -450,
    -435, -420, -405, -390, -375,
  ]);
  assert.equal(nativeBinary128BitsToInt(context.anchor0x30), -755);
  assert.equal(nativeBinary128BitsToInt(context.anchor0x40), -770);
  assert.deepEqual(context.monthBoundaries0x50, [
    -762, -732, -703, -673, -644, -615, -585, -556,
    -527, -497, -467, -438, -408, -378, -349,
  ]);
  assert.deepEqual(context.byteTable0x80, [30, 29, 30, 29, 29, 30, 29, 29, 30, 30, 29, 30, 30, 29]);
  assert.deepEqual(context.byteTable0x68, [0, 1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 0]);
  assert.equal(context.leapIndex0x98, 7);
  assert.ok(context.recordCache0x10.every(isFiniteBinary128));
  assert.ok(context.monthBoundaries0x50.every(Number.isInteger));
});

function isFiniteBinary128(value: NativeCalendarContextState["recordCache0x10"][number]): boolean {
  return ((value.high >> 48n) & 0x7fffn) !== 0x7fffn;
}
