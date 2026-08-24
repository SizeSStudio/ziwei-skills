import test from "node:test";
import assert from "node:assert/strict";
import {
  NativePeriodicCorrectionError,
  nativePeriodicCorrection0x1838a0,
  nativePeriodicCorrectionEvidenceContract,
} from "../../src/engine/native-periodic-correction";
import { NativeBinary128Bits, nativeIntToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly { input: number; expected: NativeBinary128Bits }[] = [
  { input: -100, expected: bits(0xd9ba51d70e6f951an, 0x3ff0f9b4ea61f422n) },
  { input: -10, expected: bits(0x44f73cdbf1e7976cn, 0xbff0311e04bc92dan) },
  { input: -1, expected: bits(0xa040f9f27a76ad41n, 0x3ff160d1bd7d4f4cn) },
  { input: 0, expected: bits(0x17001a9741db2e02n, 0xbff11b5bf92fccfdn) },
  { input: 1, expected: bits(0x527139fa819e726en, 0x3fef0a25addf5cdcn) },
  { input: 10, expected: bits(0x99b02321a327beadn, 0x3ff103ae147b6844n) },
  { input: 100, expected: bits(0x6a7fe8b35dc80324n, 0xbff132d0c7980ab9n) },
];

test("ports the ten-term binary128 sine correction helper 0x1838a0", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativePeriodicCorrection0x1838a0(nativeIntToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite periodic-correction inputs before term evaluation", () => {
  assert.throws(
    () => nativePeriodicCorrection0x1838a0(bits(0n, 0x7fff000000000000n)),
    NativePeriodicCorrectionError,
  );
});

test("exports the 0x1838a0 term and constant evidence without calendar semantics", () => {
  assert.deepEqual(nativePeriodicCorrectionEvidenceContract(), {
    function: { address: "0x1838a0", endExclusive: "0x183d33" },
    observedCallers: ["0x18582b", "0x1863d9", "0x186729"],
    termCount: 10,
    sinlCallAddresses: [
      "0x18392b", "0x18399f", "0x183a13", "0x183a87", "0x183afb",
      "0x183b58", "0x183bb5", "0x183c12", "0x183c6f", "0x183ccc",
    ],
    amplitudeSlopeDouble: { address: "0x833b8", value: -1.742 },
    binary128ConstantAddresses: [
      "0x83050", "0x83020", "0x82fb0", "0x83070", "0x83220", "0x83010", "0x82ea0", "0x83150",
      "0x830f0", "0x82eb0", "0x83080", "0x82fc0", "0x831c0", "0x82fd0", "0x83100", "0x82f40",
      "0x82f00", "0x83110", "0x82f10", "0x83160", "0x82ff0", "0x83120", "0x83170", "0x83190",
      "0x82ec0", "0x83000", "0x83090", "0x830a0", "0x830c0", "0x83130", "0x82f50", "0x82e90",
      "0x83140", "0x83230",
    ],
    finalDivisors: [
      { kind: "int32", value: 100, callAddress: "0x183cfe" },
      { kind: "double-expression", value: "648000/pi", callAddress: "0x183d28" },
    ],
    characterizationVectorCount: vectors.length,
    note: "numeric periodic correction only; no 0x1861d0, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
