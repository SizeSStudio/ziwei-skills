import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeModeOneSeriesEvidenceContract,
  nativeModeOneSeriesTableSha2560xdf6a0,
  nativeModeOneSeriesTransform0x1842b0,
  nativeModeOneSeriesTransformTableZero0x1842b0,
} from "../../src/engine/native-mode-one-series";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const integerVectors: readonly {
  input: number;
  expected: NativeBinary128Bits;
}[] = [
  { input: -100, expected: bits(0xf33e81a14a807db1n, 0xc0129a23eb9287d3n) },
  { input: -1, expected: bits(0x156d714ed2a1d37fn, 0xc00c065fe87f0616n) },
  { input: 0, expected: bits(0x03bfaa021a3ea265n, 0x4000f2e632c14bfan) },
  { input: 1, expected: bits(0x43c380a3b2426edan, 0x400c069be800debfn) },
  { input: 10, expected: bits(0x77c8b8e55a8474bdn, 0x400f4820cbc873dfn) },
  { input: 11, expected: bits(0xcd43a571d12c45d6n, 0x400f68f0a3153f80n) },
  { input: 100, expected: bits(0x25d88e2e5fdb80dan, 0x40129a24ccdbd820n) },
];

test("ports the fixed table-zero precision-20 path through 0x1842b0", () => {
  for (const vector of integerVectors) {
    assert.deepEqual(
      nativeModeOneSeriesTransform0x1842b0(nativeIntToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }

  assert.deepEqual(
    nativeModeOneSeriesTransform0x1842b0(nativeDoubleToBinary128Bits(0.2)),
    bits(0xa711828840062f12n, 0x4009a4f058ffbbe5n),
  );
});

test("ports every observed full-table precision used by 0x1859c0 and 0x1868e0", () => {
  const input = nativeIntToBinary128Bits(1);
  const expected = bits(0x43c380a3b2426edan, 0x400c069be800debfn);
  for (const precision of [3, 20, -1]) {
    assert.deepEqual(nativeModeOneSeriesTransformTableZero0x1842b0(input, precision), expected);
  }
  assert.throws(
    () => nativeModeOneSeriesTransformTableZero0x1842b0(input, 0),
    /native-mode-one-series:unported-precision:0/,
  );
});

test("rejects non-finite mode-one series inputs", () => {
  assert.throws(
    () => nativeModeOneSeriesTransform0x1842b0(bits(0n, 0x7fff000000000000n)),
    /native-mode-one-series:non-finite-input/,
  );
});

test("keeps the APK mode-one table slice bit-preserved", () => {
  assert.equal(
    nativeModeOneSeriesTableSha2560xdf6a0(),
    "697fb572347570e6cf8eb5bcc128406fb4e63e30bd8fad2354ea1fdc12cacf87",
  );
});

test("exports the fixed-call and relocation evidence without calendar semantics", () => {
  assert.deepEqual(nativeModeOneSeriesEvidenceContract(), {
    function: { address: "0x1842b0", endExclusive: "0x184969" },
    fixedCaller: {
      functionAddress: "0x1868e0",
      callAddress: "0x186ae0",
      tableIndex: 0,
      precision: 20,
    },
    additionalObservedCalls: [
      { functionAddress: "0x1859c0", callAddress: "0x185a27", tableIndex: 0, precision: 3 },
      { functionAddress: "0x1859c0", callAddress: "0x185dd3", tableIndex: 0, precision: 20 },
      { functionAddress: "0x1859c0", callAddress: "0x185fe0", tableIndex: 0, precision: -1 },
    ],
    offsetTable: {
      virtualAddress: "0x84cc0",
      entryIndex: 0,
      signedRelativeOffset: "0x11b610",
      relocationTableAddress: "0x1a02d0",
    },
    orderTables: [
      { pointerSlot: "0x1a02d0", relocationTarget: "0xdf6a0", valueCount: 2652 },
      { pointerSlot: "0x1a02d8", relocationTarget: "0xe9c60", valueCount: 894 },
      { pointerSlot: "0x1a02e0", relocationTarget: "0xed440", valueCount: 12 },
    ],
    tableAsset: {
      path: "assets/native-mode-one-table-0xdf6a0.bin",
      virtualAddress: "0xdf6a0",
      sourceFileOffset: "0xdf6a0",
      endExclusive: "0xed500",
      byteLength: 0xde60,
      valueWidthBytes: 0x10,
      sha256: "697fb572347570e6cf8eb5bcc128406fb4e63e30bd8fad2354ea1fdc12cacf87",
    },
    fixedPath: {
      orderValueCounts: [2652, 894, 12],
      termStrideValues: 6,
      termLayout: ["amplitude", "phase", "linear", "quadratic", "cubic", "quartic"],
      phaseNormalizers: [1, 1, 10000, 100000000, 100000000],
      positiveCorrectionThreshold: 10,
    },
    directHelperAddresses: {
      doubleToBinary128: "0x195a00",
      int32ToBinary128: "0x195c60",
      compare: ["0x195130", "0x1951f0"],
      add: "0x194c80",
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
      cosl: "0x19a420",
    },
    note: "fixed table-zero precision-20 numeric series only; no 0x1868e0, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
