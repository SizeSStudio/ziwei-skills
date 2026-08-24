import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeContextColdModeOneValue0x181c37,
  nativeContextColdModeOneValueEvidenceContract,
} from "../../src/engine/native-context-cold-mode-one";
import { NativeBinary128Bits, nativeDoubleToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly { input: number; expected: NativeBinary128Bits }[] = [
  { input: 2300000, expected: bits(0n, 0xc01027fc80000000n) },
  { input: 2400000, expected: bits(0n, 0xc00e92c600000000n) },
  { input: 2450000, expected: bits(0n, 0xc00985c000000000n) },
  { input: 2459864, expected: bits(0n, 0x400c038000000000n) },
  { input: 2500000, expected: bits(0n, 0x400e7a6600000000n) },
  { input: 2600000, expected: bits(0n, 0x401021e500000000n) },
];

test("ports the cold-path mode-one preliminary value at 0x181c37", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeContextColdModeOneValue0x181c37(nativeDoubleToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite cold mode-one inputs", () => {
  assert.throws(
    () => nativeContextColdModeOneValue0x181c37(bits(0n, 0x7fff000000000000n)),
    /native-context-cold-mode-one:non-finite-input/,
  );
});

test("exports the cold mode-one instruction and constant boundary", () => {
  assert.deepEqual(nativeContextColdModeOneValueEvidenceContract(), {
    function: { address: "0x181c37", endExclusive: "0x181fe6" },
    trigCalls: {
      coslTarget: "0x19a420",
      callAddresses: ["0x181d81", "0x181dfb", "0x181e75"],
    },
    floorlCallAddresses: ["0x181c73", "0x181fda"],
    doubleConstantVirtualAddresses: [
      "0x832a8", "0x832b0", "0x832b8", "0x832d0", "0x832f0", "0x83300", "0x83398",
      "0x833b0", "0x83408", "0x83478", "0x834e8", "0x83588", "0x83668", "0x836f0",
      "0x83758", "0x83760", "0x837b0", "0x837d0",
    ],
    integerConstants: [0x25685f, 2, 32, 20, 86400, 36525],
    note: "cold-path mode-one preliminary value only; no marker string, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
