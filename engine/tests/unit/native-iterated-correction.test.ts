import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeIteratedCorrectionError,
  nativeIteratedCorrection0x1861d0,
  nativeIteratedCorrectionEvidenceContract,
} from "../../src/engine/native-iterated-correction";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const vectors: readonly { label: string; input: NativeBinary128Bits; expected: NativeBinary128Bits }[] = [
  { label: "negative thousand", input: nativeIntToBinary128Bits(-1000), expected: bits(0xc98ca037b1353df4n, 0xbfff996d8551e1een) },
  { label: "zero", input: nativeIntToBinary128Bits(0), expected: bits(0xeb33f0611e503a17n, 0xbff800f6b59523bcn) },
  { label: "positive thousand", input: nativeIntToBinary128Bits(1000), expected: bits(0x86aebaee5334bb33n, 0x3fff956c51d038d5n) },
  { label: "calendar-scale integer", input: nativeIntToBinary128Bits(2450864), expected: bits(0x360e02eb25b22c08n, 0x400ae6e41d22dc36n) },
  { label: "calendar-scale fraction", input: nativeDoubleToBinary128Bits(2450864.903125), expected: bits(0x9d7cb3faf56f9a33n, 0x400aedf07d2d6b52n) },
];

test("ports both binary128 correction passes in helper 0x1861d0", () => {
  for (const vector of vectors) {
    assert.deepEqual(nativeIteratedCorrection0x1861d0(vector.input), vector.expected, vector.label);
  }
});

test("rejects non-finite iterated-correction inputs before normalization", () => {
  assert.throws(
    () => nativeIteratedCorrection0x1861d0(bits(0n, 0x7fff000000000000n)),
    NativeIteratedCorrectionError,
  );
});

test("exports the 0x1861d0 call graph without calendar semantics", () => {
  assert.deepEqual(nativeIteratedCorrectionEvidenceContract(), {
    function: { address: "0x1861d0", endExclusive: "0x1868d2" },
    observedCallers: ["0x14b3a8", "0x14b698", "0x14d085", "0x14d448", "0x18197b"],
    iterations: [
      {
        precision: 10,
        seriesCallAddress: "0x1863cc",
        periodicCorrectionCallAddress: "0x1863d9",
        sinlCallAddresses: ["0x186282", "0x1862e7", "0x18632f", "0x186380"],
        coslCallAddress: "0x1864dd",
      },
      {
        precision: -1,
        seriesCallAddress: "0x18671c",
        periodicCorrectionCallAddress: "0x186729",
        sinlCallAddresses: ["0x1865d2", "0x186637", "0x18667f", "0x1866d0"],
        coslCallAddress: "0x186830",
      },
    ],
    normalizationConstants: {
      periodAddress: "0x832d8",
      offsetAddress: "0x837a0",
      piAddress: "0x837d0",
    },
    characterizationVectorCount: vectors.length,
    note: "iterated numeric correction only; no 0x181490, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
