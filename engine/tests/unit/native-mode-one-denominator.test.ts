import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeModeOneDenominator0x185160,
  nativeModeOneDenominatorEvidenceContract,
} from "../../src/engine/native-mode-one-denominator";
import { NativeBinary128Bits, nativeDoubleToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly {
  input: number;
  expected: NativeBinary128Bits;
}[] = [
  { input: -1, expected: bits(0x2491e8feb9d0ad74n, 0x400c1a0ac0b79185n) },
  { input: -0.5, expected: bits(0xf2d48b63cecaa029n, 0x400be60f46205245n) },
  { input: 0, expected: bits(0xe4fc1017a49e4909n, 0x400bdeff8c2b9c38n) },
  { input: 0.25, expected: bits(0x503c309ad3732436n, 0x400c0b04642c8ec4n) },
  { input: 0.5, expected: bits(0x03f17057a96d8addn, 0x400c0ccdd8ed70f8n) },
  { input: 1, expected: bits(0x6d92f5a3e06bcb5cn, 0x400c176bb16f724bn) },
  { input: 2, expected: bits(0xd2990794fd635cc7n, 0x400bdaaf8c1b39d0n) },
];

test("ports the twelve-term sine denominator helper 0x185160", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeModeOneDenominator0x185160(nativeDoubleToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite denominator inputs", () => {
  assert.throws(
    () => nativeModeOneDenominator0x185160(bits(0n, 0x7fff000000000000n)),
    /native-mode-one-denominator:non-finite-input/,
  );
});

test("exports the unique caller and ordered term evidence", () => {
  assert.deepEqual(nativeModeOneDenominatorEvidenceContract(), {
    function: { address: "0x185160", endExclusive: "0x18561c" },
    caller: { functionAddress: "0x1859c0", callAddress: "0x185c11", observedCallCount: 1 },
    termCount: 12,
    integerAmplitudes: [914, 179, 160, 62, 34, 22, 12, 7, 5, 5, 5, 5],
    doubleConstantVirtualAddresses: [
      "0x832b0", "0x83308", "0x83310", "0x83328", "0x83338", "0x83360", "0x833a0",
      "0x833e0", "0x833e8", "0x83418", "0x83460", "0x834a8", "0x83530", "0x83550",
      "0x83570", "0x83598", "0x835a0", "0x835e0", "0x835e8", "0x835f0", "0x83650",
      "0x83690", "0x836c0", "0x836e0", "0x83710", "0x83740",
    ],
    trigTarget: "0x19a430",
    note: "numeric denominator correction only; no 0x1859c0, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
