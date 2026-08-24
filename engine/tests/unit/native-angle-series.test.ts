import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeAngleSeriesError,
  nativeAngleSeries0x185800,
  nativeAngleSeriesEvidenceContract,
} from "../../src/engine/native-angle-series";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const vectors: readonly { input: NativeBinary128Bits; expected: NativeBinary128Bits }[] = [
  { input: nativeIntToBinary128Bits(-1), expected: bits(0xb442ffd62142d26cn, 0xc00837b80add514en) },
  { input: nativeIntToBinary128Bits(0), expected: bits(0x5cbc2743d92d0063n, 0x4001392c9b21b45en) },
  { input: nativeIntToBinary128Bits(1), expected: bits(0x1acbad0f8883ffb6n, 0x40083c9cc8af460cn) },
  { input: nativeDoubleToBinary128Bits(-0.02), expected: bits(0xf4ff15586e2f7e70n, 0xc001eb16312e7013n) },
  { input: nativeDoubleToBinary128Bits(0.02), expected: bits(0xb06a44b00cfb7ec8n, 0x4003175c10552511n) },
];

test("ports the binary128 orchestration in helper 0x185800", () => {
  for (const vector of vectors) {
    assert.deepEqual(nativeAngleSeries0x185800(vector.input, -1), vector.expected);
  }
});

test("rejects non-finite and invalid-precision inputs", () => {
  assert.throws(() => nativeAngleSeries0x185800(bits(0n, 0x7fff000000000000n), -1), NativeAngleSeriesError);
  assert.throws(() => nativeAngleSeries0x185800(nativeIntToBinary128Bits(0), 1.5), NativeAngleSeriesError);
});

test("exports the statically confirmed helper graph without calendar semantics", () => {
  assert.deepEqual(nativeAngleSeriesEvidenceContract(), {
    function: { address: "0x185800", endExclusive: "0x1859b1" },
    observedCallers: ["0x14b2a5", "0x14b5d1", "0x14cfa3", "0x14d341", "0x14de2c", "0x14eda8"],
    seriesCallAddress: "0x18581e",
    periodicCorrectionCallAddress: "0x18582b",
    cosineCallAddress: "0x18592f",
    finalPiAddAddress: "0x1859a6",
    characterizationVectorCount: vectors.length,
    note: "binary128 numeric orchestration only; no calendar, astrology, or chart semantics are claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
