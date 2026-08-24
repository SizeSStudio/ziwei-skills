import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeContextModeOneError,
  nativeContextModeOneEvidenceContract,
  nativeContextModeOnePath0x181614,
} from "../../src/engine/native-context-mode-one";
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
    value: -703,
    branch: "iterated",
    boundarySeconds: bits(0x6f0f97a2a44b6086n, 0xc00e1891ae522941n),
  },
  {
    label: "epoch-scale integer takes iterated correction",
    input: nativeIntToBinary128Bits(2451545),
    value: -24,
    branch: "iterated",
    boundarySeconds: bits(0x44e6599f5172d7e1n, 0xc00eeb4cdde752c0n),
  },
  {
    label: "later integer stays on provisional path",
    input: nativeIntToBinary128Bits(2452000),
    value: 449,
    branch: "provisional",
    boundarySeconds: bits(0xd142c91544aa461cn, 0x400e074ca76f230fn),
  },
  {
    label: "second provisional sample",
    input: nativeIntToBinary128Bits(2452200),
    value: 625,
    branch: "provisional",
    boundarySeconds: bits(0x87d8ee3e1e0b7e87n, 0x400f0394b54cb6a6n),
  },
  {
    label: "later provisional sample",
    input: nativeIntToBinary128Bits(2453000),
    value: 1452,
    branch: "provisional",
    boundarySeconds: bits(0x8098d68173436910n, 0x400ef2914f6da4d1n),
  },
];

test("ports both outer branches of the 0x181490 mode 1 path", () => {
  for (const vector of vectors) {
    assert.deepEqual(nativeContextModeOnePath0x181614(vector.input), {
      value: vector.value,
      branch: vector.branch,
      boundarySeconds: vector.boundarySeconds,
    }, vector.label);
  }
});

test("rejects non-finite prepared mode 1 inputs", () => {
  assert.throws(
    () => nativeContextModeOnePath0x181614(bits(0n, 0x7fff000000000000n)),
    NativeContextModeOneError,
  );
});

test("exports the mode 1 outer-path evidence and prepared-input boundary", () => {
  assert.deepEqual(nativeContextModeOneEvidenceContract(), {
    path: {
      startAddress: "0x181614",
      provisionalBranchTarget: "0x1819ef",
      iteratedBranchStart: "0x181796",
      sharedFinalizeAddress: "0x1819b3",
      finalFloorAddress: "0x181a0a",
      finalIntCallAddress: "0x181a1a",
    },
    inputBoundary: {
      preparedAtAddress: "0x181607",
      modeBranchAddress: "0x18160b",
      note: "input already includes the 0x1814bc base offset and mode-one offset 14; it is not raw user time",
    },
    directHelpers: {
      modeOneTransform: { callAddress: "0x18168f", targetAddress: "0x1868e0" },
      modeOneCorrection: { callAddress: "0x18179e", targetAddress: "0x1859c0" },
      piecewiseWrapper: { callAddresses: ["0x1816b6", "0x1817d1"], targetAddress: "0x183830" },
    },
    branchWindowSeconds: { lowerInclusive: 1800, upperInclusive: 84600 },
    characterizationVectorCount: vectors.length,
    note: "prepared-input mode 1 numeric path only; no context range selection, calendar, astrology, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
