import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeContextModeZeroError,
  nativeContextModeZeroEvidenceContract,
  nativeContextModeZeroPath0x1817db,
} from "../../src/engine/native-context-mode-zero";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const vectors: readonly {
  label: string;
  input: NativeBinary128Bits;
  value: number;
  branch: "provisional" | "iterated";
  boundarySeconds: NativeBinary128Bits;
}[] = [
  {
    label: "calendar-scale fraction takes iterated correction",
    input: nativeDoubleToBinary128Bits(2450864.903125),
    value: -681,
    branch: "iterated",
    boundarySeconds: bits(0x6ea2aaedc0488f64n, 0xc00efbfeec85850bn),
  },
  {
    label: "epoch-scale integer takes iterated correction",
    input: nativeIntToBinary128Bits(2451545),
    value: -10,
    branch: "iterated",
    boundarySeconds: bits(0xe216afa352767906n, 0xc00f1e024d5cba1cn),
  },
  {
    label: "later integer stays on provisional path",
    input: nativeIntToBinary128Bits(2452000),
    value: 445,
    branch: "provisional",
    boundarySeconds: bits(0xb4d8c8e2b672bcccn, 0x400e9d8a28c4ad6en),
  },
  {
    label: "second provisional sample",
    input: nativeIntToBinary128Bits(2452200),
    value: 643,
    branch: "provisional",
    boundarySeconds: bits(0x6a49d8c143363da0n, 0x400f0e18ade699aan),
  },
];

test("ports both outer branches of the 0x181490 mode 0 path", () => {
  for (const vector of vectors) {
    assert.deepEqual(nativeContextModeZeroPath0x1817db(vector.input), {
      value: vector.value,
      branch: vector.branch,
      boundarySeconds: vector.boundarySeconds,
    }, vector.label);
  }
});

test("rejects non-finite prepared mode 0 inputs", () => {
  assert.throws(
    () => nativeContextModeZeroPath0x1817db(bits(0n, 0x7fff000000000000n)),
    NativeContextModeZeroError,
  );
});

test("exports the mode 0 outer-path evidence and prepared-input boundary", () => {
  assert.deepEqual(nativeContextModeZeroEvidenceContract(), {
    path: {
      startAddress: "0x1817db",
      provisionalBranchTarget: "0x1819ef",
      iteratedBranchStart: "0x181973",
      finalFloorAddress: "0x181a0a",
      finalIntCallAddress: "0x181a1a",
    },
    inputBoundary: {
      preparedAtAddress: "0x181607",
      modeBranchAddress: "0x18160b",
      note: "input already includes the 0x1814bc base offset and 0x18157d mode-zero offset; it is not raw user time",
    },
    directHelpers: {
      modeZeroTransform: { callAddress: "0x181870", targetAddress: "0x186e40" },
      iteratedCorrection: { callAddress: "0x18197b", targetAddress: "0x1861d0" },
      piecewiseWrapper: { callAddresses: ["0x181897", "0x1819ae"], targetAddress: "0x183830" },
    },
    branchWindowSeconds: { lowerInclusive: 1200, upperInclusive: 85200 },
    characterizationVectorCount: vectors.length,
    note: "prepared-input mode 0 numeric path only; no context range selection, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
