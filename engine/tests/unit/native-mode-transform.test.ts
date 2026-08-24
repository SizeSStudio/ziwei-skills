import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeModeTransformError,
  nativeModeTransformEvidenceContract,
  nativeModeZeroTransform0x186e40,
} from "../../src/engine/native-mode-transform";
import { NativeBinary128Bits, nativeIntToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly { input: number; expected: NativeBinary128Bits }[] = [
  { input: -1000, expected: bits(0x947d6367fb27f400n, 0xbfff9453223d4cdan) },
  { input: -100, expected: bits(0xac7b118fb878ae00n, 0xbffc55eaa70843d7n) },
  { input: -1, expected: bits(0xbace15186d826800n, 0xbff83368dd30b881n) },
  { input: 0, expected: bits(0x6b6ee6508297b400n, 0xbff7fe950876ee2bn) },
  { input: 1, expected: bits(0x03f6a3ad894d2400n, 0xbff79650a07200b3n) },
  { input: 100, expected: bits(0xf94f9083e2304a00n, 0x3ffc35ca6f113da4n) },
  { input: 1000, expected: bits(0xd281ab3b98fab800n, 0x3fffebbc14e59b7cn) },
  { input: 2000, expected: bits(0xcc1d0d9bffb47f00n, 0x40025b61b41a0075n) },
];

test("ports the straight-line binary128 orchestration in mode 0 helper 0x186e40", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeModeZeroTransform0x186e40(nativeIntToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite mode transform inputs before native helper calls", () => {
  assert.throws(
    () => nativeModeZeroTransform0x186e40(bits(0n, 0x7fff000000000000n)),
    NativeModeTransformError,
  );
});

test("exports the mode 0 control-flow and constant evidence without calendar semantics", () => {
  assert.deepEqual(nativeModeTransformEvidenceContract(), {
    function: { address: "0x186e40", endExclusive: "0x187090" },
    observedCaller: { functionAddress: "0x181490", callAddress: "0x181870", mode: 0 },
    directCalls: {
      cosl: ["0x186f0b", "0x186f53"],
      sinl: ["0x187022"],
      fixedSeriesTransform: {
        callAddress: "0x186f9b",
        functionAddress: "0x183d40",
        arguments: { tableIndex: 0, variant: 0, precision: 8 },
      },
    },
    doubleConstants: {
      "0x832d8": 628.3319653318,
      "0x837a0": 1.75347,
      "0x837d0": Math.PI,
      "0x83630": 0.000005297,
      "0x83518": 0.0334166,
      "0x83720": 4.669257,
      "0x83538": 628.307585,
      "0x83378": 0.0002061,
      "0x83728": 2.67823,
      "0x83600": 20.5,
      "0x83560": 17.2,
      "0x83670": 2.1824,
      "0x83730": 33.75705,
    },
    finalDoubleDivisor: { numerator: 648000, denominatorAddress: "0x837d0" },
    characterizationVectorCount: vectors.length,
    note: "mode 0 numeric helper only; no 0x181490, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
