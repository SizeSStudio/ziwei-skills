import test from "node:test";
import assert from "node:assert/strict";
import { nativeRemainderTowardZero, nativeTenTwelveResidues } from "../../src/engine/native-cyclic";

test("ports the 0x14dbd0 signed remainder primitive for native cyclic fields", () => {
  assert.equal(nativeRemainderTowardZero(2450864, 10), 4);
  assert.equal(nativeRemainderTowardZero(2450864, 12), 8);
  assert.equal(nativeRemainderTowardZero(0x3938702, 10), 2);
  assert.equal(nativeRemainderTowardZero(0x3938702, 12), 2);
});

test("keeps C-style truncating remainder semantics instead of positive modulo semantics", () => {
  assert.equal(nativeRemainderTowardZero(-1, 10), -1);
  assert.equal(nativeRemainderTowardZero(-11, 12), -11);
  assert.equal(nativeRemainderTowardZero(-13, 12), -1);
  assert.equal(nativeRemainderTowardZero(-12, 12), 0);
  assert.equal(Object.is(nativeRemainderTowardZero(-12, 12), -0), false);
});

test("returns the repeated mod10/mod12 pair shape used by 0x14dbd0", () => {
  assert.deepEqual(nativeTenTwelveResidues(2450864), {
    mod10: 4,
    mod12: 8,
  });
});
