import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeModeOneCorrection0x1859c0,
  nativeModeOneCorrectionEvidenceContract,
} from "../../src/engine/native-mode-one-correction";
import { NativeBinary128Bits, nativeIntToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly {
  input: number;
  expected: NativeBinary128Bits;
}[] = [
  { input: -1000, expected: bits(0xc593c05460f0f116n, 0xbffc073a965811ebn) },
  { input: -1, expected: bits(0x75136628357c961dn, 0xbfea43f5014486dan) },
  { input: 0, expected: bits(0x6c8c2e97f70026c4n, 0x3ff22e06613ce633n) },
  { input: 1, expected: bits(0x25d5e08726637414n, 0x3ff329b1bfa937e8n) },
  { input: 1000, expected: bits(0xb2bcf4fb63ad0a66n, 0x3ffc07c86c6b993en) },
  { input: 6760, expected: bits(0x52d9269489cd5860n, 0x3ffebd715f844ec9n) },
  { input: 7771, expected: bits(0x76a50eb633de2d04n, 0x3fff0005cc7dfd5fn) },
  { input: 10000, expected: bits(0x44d26107dd205574n, 0x3fff49720bc3f086n) },
];

test("ports the three-pass binary128 correction in helper 0x1859c0", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeModeOneCorrection0x1859c0(nativeIntToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite mode-one correction inputs", () => {
  assert.throws(
    () => nativeModeOneCorrection0x1859c0(bits(0n, 0x7fff000000000000n)),
    /native-mode-one-correction:non-finite-input/,
  );
});

test("exports the observed callers and three-pass helper graph", () => {
  assert.deepEqual(nativeModeOneCorrectionEvidenceContract(), {
    function: { address: "0x1859c0", endExclusive: "0x1861c5" },
    callers: [
      { functionAddress: "0x14bed0", callAddress: "0x14cd55" },
      { functionAddress: "0x181490", callAddress: "0x18179e" },
    ],
    passes: [
      { modeOneSeriesCall: "0x185a27", modeOnePrecision: 3, modeZeroSeriesCall: "0x185a60", modeZeroPrecision: 3 },
      { modeOneSeriesCall: "0x185dd3", modeOnePrecision: 20, modeZeroSeriesCall: "0x185e0c", modeZeroPrecision: 10 },
      { modeOneSeriesCall: "0x185fe0", modeOnePrecision: -1, modeZeroSeriesCall: "0x186019", modeZeroPrecision: 60 },
    ],
    denominatorCall: { callAddress: "0x185c11", targetAddress: "0x185160" },
    directTrigCalls: {
      cosl: ["0x185b58", "0x185f07", "0x186114"],
      sinl: ["0x185c69", "0x185cce", "0x185d16", "0x185d67"],
    },
    doubleConstantVirtualAddresses: [
      "0x83340", "0x83358", "0x83368", "0x83410", "0x83448", "0x83478", "0x834b0",
      "0x834b8", "0x83520", "0x83528", "0x83538", "0x83558", "0x836f8", "0x83708",
      "0x83748", "0x83758", "0x83798", "0x837c8", "0x837d0", "0x83800",
    ],
    note: "three-pass numeric correction only; no 0x181490 outer path, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
