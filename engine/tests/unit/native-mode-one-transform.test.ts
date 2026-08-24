import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeModeOneTransform0x1868e0,
  nativeModeOneTransformEvidenceContract,
} from "../../src/engine/native-mode-one-transform";
import { NativeBinary128Bits, nativeIntToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly {
  input: number;
  expected: NativeBinary128Bits;
}[] = [
  { input: -1000, expected: bits(0xfd093ef48efb28ffn, 0xbffc073a94209005n) },
  { input: -1, expected: bits(0xffb18f05919330c0n, 0xbfea3d8d53745591n) },
  { input: 0, expected: bits(0xab5fb0a86ba3e9e0n, 0x3ff22e09c4e43c15n) },
  { input: 1, expected: bits(0xcc1ca1a32aae6638n, 0x3ff329b3820760aan) },
  { input: 1000, expected: bits(0x81e1fd80c87d0c1bn, 0x3ffc07c86cf03b6an) },
  { input: 6760, expected: bits(0x559a9e2b35733f43n, 0x3ffebd715f9dbb39n) },
  { input: 7771, expected: bits(0x6348cbedc8ab6dffn, 0x3fff0005cc95fe7dn) },
  { input: 10000, expected: bits(0x413d49e52940a672n, 0x3fff49720c0a3e1an) },
];

test("ports the straight-line binary128 orchestration in mode-one helper 0x1868e0", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeModeOneTransform0x1868e0(nativeIntToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("rejects non-finite mode-one transform inputs", () => {
  assert.throws(
    () => nativeModeOneTransform0x1868e0(bits(0n, 0x7fff000000000000n)),
    /native-mode-one-transform:non-finite-input/,
  );
});

test("exports the fixed helper call graph without calendar semantics", () => {
  assert.deepEqual(nativeModeOneTransformEvidenceContract(), {
    function: { address: "0x1868e0", endExclusive: "0x186e3e" },
    caller: { functionAddress: "0x181490", callAddress: "0x18168f", observedCallCount: 1 },
    nestedSeriesCall: {
      callAddress: "0x186ae0",
      targetAddress: "0x1842b0",
      tableIndex: 0,
      precision: 20,
    },
    trigCalls: {
      coslTarget: "0x19a420",
      coslCallAddresses: ["0x1869b3", "0x186a3e", "0x186aa3", "0x186b97", "0x186bdf", "0x186c4d"],
      sinlTarget: "0x19a430",
      sinlCallAddresses: ["0x186d31", "0x186d93", "0x186df5"],
    },
    constants: {
      doubleVirtualAddresses: [
        "0x83298", "0x832a8", "0x832b0", "0x832c0", "0x832d0", "0x832d8", "0x83308",
        "0x83370", "0x83378", "0x833e0", "0x833f0", "0x833f8", "0x83400", "0x83430",
        "0x83478", "0x83518", "0x83538", "0x83550", "0x83598", "0x835a8", "0x835b0",
        "0x835c0", "0x835e0", "0x83600", "0x83630", "0x83668", "0x836c8", "0x836e0",
        "0x83720", "0x83728", "0x83758",
      ],
      integerSineAmplitudes: [914, 179, 160],
    },
    directHelperAddresses: {
      doubleToBinary128: "0x195a00",
      int32ToBinary128: "0x195c60",
      add: "0x194c80",
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
    },
    note: "mode-one numeric transform only; no 0x181490 outer path, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
