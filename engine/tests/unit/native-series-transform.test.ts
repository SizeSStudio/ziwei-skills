import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeSeriesTransformError,
  nativeSeriesTransformEvidenceContract,
  nativeSeriesTransformModeZero0x183d40,
  nativeSeriesTransformTableZero0x183d40,
  nativeSeriesTransformTableSha2560x84cd0,
} from "../../src/engine/native-series-transform";
import { NativeBinary128Bits, nativeIntToBinary128Bits } from "../../src/engine/native-numeric";

const vectors: readonly {
  input: number;
  expected: NativeBinary128Bits;
}[] = [
  { input: -1000, expected: bits(0x9e03838b4be6bf49n, 0xc01232d1f8a949cfn) },
  { input: -100, expected: bits(0x6995a8fc8db6827dn, 0xc00eeadeb9727af8n) },
  { input: -1, expected: bits(0xd0b9c0eb185a290fn, 0xc008394a2b62042dn) },
  { input: 0, expected: bits(0x8822e4a9707e1bc3n, 0x3fffc07df6f40111n) },
  { input: 1, expected: bits(0xbd3e4e80c4b567c7n, 0x40083b0aabd13605n) },
  { input: 100, expected: bits(0x6922c448acdcf164n, 0x400eeae5ef7a1e02n) },
  { input: 1000, expected: bits(0xc623dae351d2ef01n, 0x401232b629b3f959n) },
];

test("ports the fixed 0x186e40 call into 0x183d40 with native operation order", () => {
  for (const vector of vectors) {
    assert.deepEqual(
      nativeSeriesTransformModeZero0x183d40(nativeIntToBinary128Bits(vector.input)),
      vector.expected,
      `input ${vector.input}`,
    );
  }
});

test("ports the table-zero precision branches required by 0x1861d0", () => {
  const precisionVectors: readonly {
    precision: number;
    input: number;
    expected: NativeBinary128Bits;
  }[] = [
    { precision: 10, input: -100, expected: bits(0xe8c91980b72e8b0cn, 0xc00eeadeb973adeen) },
    { precision: 10, input: 0, expected: bits(0xa72ab6c2cf4a7683n, 0x3fffc07e3a9f8c76n) },
    { precision: 10, input: 100, expected: bits(0x9260fa39f3a23f9an, 0x400eeae5ef78ba30n) },
    { precision: -1, input: -100, expected: bits(0x56f81422e39c1aa2n, 0xc00eeadeb97386d4n) },
    { precision: -1, input: 0, expected: bits(0x88eb19d71c42ec0dn, 0x3fffc07e0e54171en) },
    { precision: -1, input: 100, expected: bits(0x17c003b84e969e36n, 0x400eeae5ef5e8142n) },
  ];

  for (const vector of precisionVectors) {
    assert.deepEqual(
      nativeSeriesTransformTableZero0x183d40(nativeIntToBinary128Bits(vector.input), vector.precision),
      vector.expected,
      `precision ${vector.precision}, input ${vector.input}`,
    );
  }
});

test("rejects non-finite series-transform inputs before table evaluation", () => {
  assert.throws(
    () => nativeSeriesTransformModeZero0x183d40(bits(0n, 0x7fff000000000000n)),
    NativeSeriesTransformError,
  );
});

test("keeps the APK table slice bit-preserved", () => {
  assert.equal(
    nativeSeriesTransformTableSha2560x84cd0(),
    "da7fd1a16f6f5181611673c00eba8a386080ac8bc18053a3e1b714a29e0a867b",
  );
});

test("exports the fixed-call and table evidence without calendar semantics", () => {
  assert.deepEqual(nativeSeriesTransformEvidenceContract(), {
    function: { address: "0x183d40", endExclusive: "0x1842a2" },
    fixedCaller: {
      functionAddress: "0x186e40",
      callAddress: "0x186f9b",
      tableIndex: 0,
      variant: 0,
      precision: 8,
    },
    additionalObservedCalls: [
      { functionAddress: "0x184970", callAddress: "0x184ca3", tableIndex: 0, variant: 0, precision: 50 },
      { functionAddress: "0x185800", callAddress: "0x18581e", tableIndex: 0, variant: 0, precision: -1 },
      { functionAddress: "0x1861d0", callAddress: "0x1863cc", tableIndex: 0, variant: 0, precision: 10 },
      { functionAddress: "0x1861d0", callAddress: "0x18671c", tableIndex: 0, variant: 0, precision: -1 },
    ],
    pointerTable: {
      virtualAddress: "0x1a0290",
      entryIndex: 0,
      relocationTarget: "0x84cd0",
    },
    tableAsset: {
      path: "assets/native-series-table-0x84cd0.bin",
      virtualAddress: "0x84cd0",
      sourceFileOffset: "0x84cd0",
      byteLength: 0xa6a0,
      valueWidthBytes: 0x10,
      sha256: "da7fd1a16f6f5181611673c00eba8a386080ac8bc18053a3e1b714a29e0a867b",
    },
    fixedPath: {
      normalizedInputDivisor: 10,
      orderCount: 6,
      termStrideValues: 3,
      termLayout: ["amplitude", "phase", "frequency"],
      maximumTableIndexInclusive: 1148,
      requiredPrefixBytes: 0x47d0,
      requiredPrefixSha256: "4b4f98802adf7d83863081342fe76f69b4271a76b86624aaed2415de6e70fcf8",
    },
    directHelperAddresses: {
      cosl: "0x19a420",
      floorl: "0x19a380",
      int32ToBinary128: "0x195c60",
      binary128ToInt32: "0x195b60",
      compare: ["0x195130", "0x1951f0"],
      add: "0x194c80",
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
    },
    note: "table-zero variant-zero numeric series transform only; no 0x1861d0, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
