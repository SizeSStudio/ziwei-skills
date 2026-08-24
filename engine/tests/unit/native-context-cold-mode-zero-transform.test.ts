import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeContextColdModeZeroTransform0x182340,
  nativeContextColdModeZeroTransformEvidenceContract,
} from "../../src/engine/native-context-cold-mode-zero-transform";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
} from "../../src/engine/native-numeric";

const vectors: readonly { input: number; expected: NativeBinary128Bits }[] = [
  { input: -100, expected: bits(0xe512cd06c681e171n, 0xc00b7d3133a80ffen) },
  { input: -1, expected: bits(0x886a8d5f1f067bc2n, 0xc00756fd1faa3180n) },
  { input: 0, expected: bits(0xb0a1010d3d31418cn, 0xc0071e18eef1fab9n) },
  { input: 1, expected: bits(0x177d64b2fbc44ed4n, 0xc006c6f569f7a99en) },
  { input: Math.PI, expected: bits(0xdc0ac38d5b3d07e5n, 0xc0058ec149ee8c0fn) },
  { input: 100, expected: bits(0x8e59716d5e084462n, 0x400b597673c745bcn) },
  { input: 1000, expected: bits(0x5491d7ede0588049n, 0x400ec3e8c70da5efn) },
];

test("ports the cold-path mode-zero transform helper 0x182340", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeContextColdModeZeroTransform0x182340(nativeDoubleToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite cold mode-zero transform inputs", () => {
  assert.throws(
    () => nativeContextColdModeZeroTransform0x182340(bits(0n, 0x7fff000000000000n)),
    /native-context-cold-mode-zero-transform:non-finite-input/,
  );
});

test("exports the helper boundary and direct trig evidence", () => {
  assert.deepEqual(nativeContextColdModeZeroTransformEvidenceContract(), {
    function: { address: "0x182340", endExclusive: "0x1827a8" },
    caller: { functionAddress: "0x181490", callAddress: "0x1820f8", observedCallCount: 1 },
    trigCalls: { cosl: 5, sinl: 1 },
    integerConstants: [53, 0x51924, 0x080d, 10000000, 0x51956, 0x0da1, 0x03e2, 0x0342, 32, 20, 86400, 36525],
    doubleConstantVirtualAddresses: [
      "0x83280", "0x832d8", "0x832f0", "0x83408", "0x83430", "0x834e0", "0x83538",
      "0x835b8", "0x835c0", "0x83618", "0x83638", "0x83670", "0x836a0", "0x836f0",
      "0x836f8", "0x83720", "0x83728", "0x83730", "0x837b0",
    ],
    note: "cold-path mode-zero numeric transform only; no marker string, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
