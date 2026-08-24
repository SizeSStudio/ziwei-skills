import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeContextSampleColdPathError,
  NativeContextSampleInterpolationError,
  nativeContextSampleInterpolation0x181a8b,
  nativeContextSampleInterpolation0x181a8bEvidenceContract,
  nativeContextSample0x181490,
  nativeContextSampleEvidenceContract,
  nativeContextSampleModeZero0x181490,
  nativeContextSampleModeZeroEvidenceContract,
} from "../../src/engine/native-context-sample";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const syntheticRecords = binary128Records([100, 10, 200, 20, 400]);
const offsetSeven = nativeIntToBinary128Bits(7);

test("dispatches the confirmed 0x181490 mode 0 hot paths from raw target input", () => {
  assert.deepEqual(
    nativeContextSampleModeZero0x181490({
      rawTarget: nativeIntToBinary128Bits(0),
      records: syntheticRecords,
    }),
    {
      kind: "mode-zero",
      value: 6,
      branch: "provisional",
      boundarySeconds: bits(0xe344335c13af3f4bn, 0x400e5ba567520f1fn),
    },
  );
  assert.deepEqual(
    nativeContextSampleModeZero0x181490({
      rawTarget: nativeIntToBinary128Bits(-2451395),
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 0, value: -2451395 },
  );
  assert.deepEqual(
    nativeContextSampleModeZero0x181490({
      rawTarget: nativeIntToBinary128Bits(-2451152),
      records: syntheticRecords,
    }),
    { kind: "secondary-cold-path", reason: "at-or-above-record-range" },
  );
});

test("dispatches both confirmed 0x181490 modes from raw target input", () => {
  assert.deepEqual(
    nativeContextSample0x181490({
      rawTarget: nativeIntToBinary128Bits(0),
      mode: 0,
      records: syntheticRecords,
    }),
    {
      kind: "mode-zero",
      value: 6,
      branch: "provisional",
      boundarySeconds: bits(0xe344335c13af3f4bn, 0x400e5ba567520f1fn),
    },
  );
  assert.deepEqual(
    nativeContextSample0x181490({
      rawTarget: nativeIntToBinary128Bits(0),
      mode: 1,
      records: syntheticRecords,
    }),
    {
      kind: "mode-one",
      value: 6,
      branch: "provisional",
      boundarySeconds: bits(0x4a8f2f6f39dcdf1en, 0x400bf6634f78e44bn),
    },
  );
  assert.deepEqual(
    nativeContextSample0x181490({
      rawTarget: nativeIntToBinary128Bits(-2451395),
      mode: 1,
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 0, value: -2451385 },
  );
  assert.deepEqual(
    nativeContextSample0x181490({
      rawTarget: nativeIntToBinary128Bits(-2451152),
      mode: 1,
      records: syntheticRecords,
    }),
    { kind: "secondary-cold-path", reason: "at-or-above-record-range" },
  );
});

test("resolves both secondary cold paths with the native marker adjustment", () => {
  const coldRecords = binary128Records([2399000, 10, 2399950]);
  const rawTarget = nativeIntToBinary128Bits(2400000 - 0x256859);

  assert.deepEqual(
    nativeContextSample0x181490({ rawTarget, mode: 0, records: coldRecords, coldMarkers: "xxx2" }),
    { kind: "cold-resolved", mode: 0, value: -51540, markerIndex: 3n, marker: "2", adjustment: -1 },
  );
  assert.deepEqual(
    nativeContextSample0x181490({ rawTarget, mode: 1, records: coldRecords, coldMarkers: "xx1" }),
    { kind: "cold-resolved", mode: 1, value: -51554, markerIndex: 2n, marker: "1", adjustment: 1 },
  );
});

test("keeps the native marker end boundary and rejects an index beyond it", () => {
  const coldRecords = binary128Records([2399000, 10, 2399950]);
  const rawTarget = nativeIntToBinary128Bits(2400000 - 0x256859);

  assert.deepEqual(
    nativeContextSample0x181490({ rawTarget, mode: 1, records: coldRecords, coldMarkers: "xx" }),
    { kind: "cold-resolved", mode: 1, value: -51555, markerIndex: 2n, marker: null, adjustment: 0 },
  );
  assert.throws(
    () => nativeContextSample0x181490({ rawTarget, mode: 1, records: coldRecords, coldMarkers: "x" }),
    (error: unknown) =>
      error instanceof NativeContextSampleColdPathError && error.code === "marker-index-out-of-range",
  );
});

test("documents the shared raw-target mode dispatch", () => {
  assert.deepEqual(nativeContextSampleEvidenceContract(), {
    helperAddress: "0x181490",
    baseOffset: { value: 0x256859, loadAddress: "0x1814bc", addAddress: "0x1814cf" },
    modes: [
      { mode: 0, contextVectorOffset: "0x8", value: 7, loadAddress: "0x18157d", targetAddress: "0x1817db" },
      { mode: 1, contextVectorOffset: "0x0", value: 14, loadAddress: "0x181538", targetAddress: "0x181614" },
    ],
    rangeSelection: {
      lowerCompareCallAddress: "0x1815d6",
      fixedUpperValue: 0x252f47,
      fixedUpperLoadAddress: "0x1815ba",
      upperCompareCallAddress: "0x1815ea",
      interpolationTargetAddress: "0x181a8b",
    },
    secondaryColdPath: {
      startAddress: "0x181be3",
      endExclusive: "0x1822c9",
      markerAdjustAddresses: { increment: "0x18226e", decrement: "0x1822a1" },
    },
    note: "raw-target mode 0/1 dispatch including optional secondary cold-path marker resolution; calendar, astrology, and chart parity are not claimed",
  });
});

test("documents the mode 0 raw-target dispatch boundary", () => {
  assert.deepEqual(nativeContextSampleModeZeroEvidenceContract(), {
    helperAddress: "0x181490",
    baseOffset: { value: 0x256859, loadAddress: "0x1814bc", addAddress: "0x1814cf" },
    modeOffset: { value: 7, loadAddress: "0x18157d", addAddress: "0x181602" },
    rangeSelection: {
      lowerCompareCallAddress: "0x1815d6",
      fixedUpperValue: 0x252f47,
      fixedUpperLoadAddress: "0x1815ba",
      upperCompareCallAddress: "0x1815ea",
      interpolationTargetAddress: "0x181a8b",
      modeZeroTargetAddress: "0x1817db",
    },
    note: "raw-target mode 0 dispatch only; secondary cold path, calendar, astrology, and chart parity are not claimed",
  });
});

test("returns the confirmed cold paths outside the interpolation range", () => {
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: nativeIntToBinary128Bits(92),
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "cold-path", reason: "below-range" },
  );
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: nativeIntToBinary128Bits(393),
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "cold-path", reason: "at-or-above-range" },
  );
});

test("interpolates the preceding record pair with native binary128 operation order", () => {
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: nativeIntToBinary128Bits(150),
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 0, value: -2451395 },
  );
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: nativeIntToBinary128Bits(205),
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 1, value: -2451345 },
  );
});

test("switches pairs exactly when target plus offset reaches the next base", () => {
  const exactTarget = nativeIntToBinary128Bits(193);
  const belowTarget = previousPositiveBinary128(exactTarget);
  const aboveTarget = nextPositiveBinary128(exactTarget);

  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: belowTarget,
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 0, value: -2451355 },
  );
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: exactTarget,
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 1, value: -2451345 },
  );
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: aboveTarget,
      offset: offsetSeven,
      records: syntheticRecords,
    }),
    { kind: "interpolated", pairIndex: 1, value: -2451345 },
  );
});

test("applies the confirmed special-value correction before the final subtraction", () => {
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: nativeIntToBinary128Bits(1683460),
      offset: nativeIntToBinary128Bits(0),
      records: binary128Records([1683460, 1, 1683470]),
    }),
    { kind: "interpolated", pairIndex: 0, value: -768084 },
  );
});

test("rounds a fractional base after the separate native binary128 half addition", () => {
  assert.deepEqual(
    nativeContextSampleInterpolation0x181a8b({
      target: nativeDoubleToBinary128Bits(100.75),
      offset: nativeIntToBinary128Bits(0),
      records: [
        nativeDoubleToBinary128Bits(100.75),
        nativeIntToBinary128Bits(1),
        nativeIntToBinary128Bits(110),
      ],
    }),
    { kind: "interpolated", pairIndex: 0, value: -2451444 },
  );
});

test("rejects malformed record vectors deterministically", () => {
  for (const records of [
    binary128Records([]),
    binary128Records([100]),
    binary128Records([100, 10, 200, 20]),
  ]) {
    assertInterpolationError(
      () =>
        nativeContextSampleInterpolation0x181a8b({
          target: nativeIntToBinary128Bits(100),
          offset: nativeIntToBinary128Bits(0),
          records,
        }),
      "invalid-record-shape",
    );
  }
});

test("rejects non-finite target, offset, and record values deterministically", () => {
  const infinity = { low: 0n, high: 0x7fff000000000000n };

  assertInterpolationError(
    () =>
      nativeContextSampleInterpolation0x181a8b({
        target: infinity,
        offset: nativeIntToBinary128Bits(0),
        records: syntheticRecords,
      }),
    "non-finite-target",
  );
  assertInterpolationError(
    () =>
      nativeContextSampleInterpolation0x181a8b({
        target: nativeIntToBinary128Bits(100),
        offset: infinity,
        records: syntheticRecords,
      }),
    "non-finite-offset",
  );
  assertInterpolationError(
    () =>
      nativeContextSampleInterpolation0x181a8b({
        target: nativeIntToBinary128Bits(100),
        offset: nativeIntToBinary128Bits(0),
        records: [syntheticRecords[0], syntheticRecords[1], infinity],
      }),
    "non-finite-record",
  );
});

test("rejects zero and negative steps deterministically", () => {
  for (const step of [0, -1]) {
    assertInterpolationError(
      () =>
        nativeContextSampleInterpolation0x181a8b({
          target: nativeIntToBinary128Bits(100),
          offset: nativeIntToBinary128Bits(0),
          records: binary128Records([100, step, 200]),
        }),
      "nonpositive-step",
    );
  }
});

test("rejects non-increasing bases as a defensive API input contract", () => {
  for (const records of [
    binary128Records([100, 10, 100]),
    binary128Records([100, 10, 90]),
  ]) {
    assertInterpolationError(
      () =>
        nativeContextSampleInterpolation0x181a8b({
          target: nativeIntToBinary128Bits(100),
          offset: nativeIntToBinary128Bits(0),
          records,
        }),
      "non-increasing-base",
    );
  }
});

test("documents the statically confirmed interpolation evidence contract", () => {
  assert.deepEqual(nativeContextSampleInterpolation0x181a8bEvidenceContract(), {
    helperAddress: "0x181490",
    interpolationStartAddress: "0x181a8b",
    interpolationEndAddress: "0x181bde",
    rangeChecks: {
      lowerCompareCallAddress: "0x181a96",
      upperCompareCallAddress: "0x181aae",
    },
    loop: {
      startAddress: "0x181ad0",
      endAddress: "0x181b00",
      recordWidthBytes: 0x10,
      pairStrideBytes: 0x20,
      lowerRecordReadAddress: "0x181b02",
      stepRecordReadAddress: "0x181b17",
    },
    operationAddresses: {
      division: "0x181b47",
      quotientFloor: "0x181b4c",
      halfDoubleLoad: "0x181b73",
      doubleToBinary128: "0x181b7b",
      halfAdd: "0x181b87",
      roundedFloor: "0x181b8c",
      specialCompare: "0x181ba7",
      specialAdd: "0x181bbc",
      finalSubtract: "0x181bd9",
    },
    sharedFinalization: {
      jumpTargetAddress: "0x181a0f",
      intConversionAddress: "0x181a1a",
    },
    constants: {
      specialRawBinary128Va: "0x830b0",
      specialValueInt32: 0x19b004,
      finalSubtrahendInt32: 0x256859,
    },
    helperAddresses: {
      add: "0x194c80",
      compareLower: "0x1951f0",
      compareOrdered: "0x195130",
      divide: "0x1952a0",
      doubleToBinary128: "0x195a00",
      binary128ToInt32: "0x195b60",
      int32ToBinary128: "0x195c60",
      multiply: "0x195cd0",
      subtract: "0x196240",
      floorl: "0x19a380",
    },
    note: "static numeric/context-sample interpolation port only; no calendar or chart semantics are claimed",
  });
});

function binary128Records(values: readonly number[]): NativeBinary128Bits[] {
  return values.map(nativeIntToBinary128Bits);
}

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}

function previousPositiveBinary128(value: NativeBinary128Bits): NativeBinary128Bits {
  if (value.low > 0n) {
    return { low: value.low - 1n, high: value.high };
  }
  return { low: 0xffffffffffffffffn, high: value.high - 1n };
}

function nextPositiveBinary128(value: NativeBinary128Bits): NativeBinary128Bits {
  if (value.low < 0xffffffffffffffffn) {
    return { low: value.low + 1n, high: value.high };
  }
  return { low: 0n, high: value.high + 1n };
}

function assertInterpolationError(
  operation: () => unknown,
  code: NativeContextSampleInterpolationError["code"],
): void {
  assert.throws(operation, (error: unknown) => {
    if (!(error instanceof NativeContextSampleInterpolationError)) {
      return false;
    }
    assert.equal((error as { code: string }).code, code);
    return true;
  });
}
