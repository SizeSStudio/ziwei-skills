import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToInt,
  nativeBinary128BitsToUint64,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeContextColdModeOneValue0x181c37 } from "./native-context-cold-mode-one";
import { nativeContextColdModeZeroTransform0x182340 } from "./native-context-cold-mode-zero-transform";
import { nativeContextModeOnePath0x181614 } from "./native-context-mode-one";
import { nativeContextModeZeroPath0x1817db } from "./native-context-mode-zero";

export type NativeContextSampleInterpolationResult =
  | { kind: "cold-path"; reason: "below-range" | "at-or-above-range" }
  | { kind: "interpolated"; pairIndex: number; value: number };

export type NativeContextSampleModeZeroResult =
  | { kind: "mode-zero"; value: number; branch: "provisional" | "iterated"; boundarySeconds: NativeBinary128Bits }
  | { kind: "interpolated"; pairIndex: number; value: number }
  | NativeContextSampleColdResolvedResult
  | { kind: "secondary-cold-path"; reason: "below-record-range" | "at-or-above-record-range" };

export type NativeContextSampleModeOneResult =
  | { kind: "mode-one"; value: number; branch: "provisional" | "iterated"; boundarySeconds: NativeBinary128Bits }
  | { kind: "interpolated"; pairIndex: number; value: number }
  | NativeContextSampleColdResolvedResult
  | { kind: "secondary-cold-path"; reason: "below-record-range" | "at-or-above-record-range" };

export type NativeContextSampleColdResolvedResult = {
  kind: "cold-resolved";
  mode: 0 | 1;
  value: number;
  markerIndex: bigint;
  marker: string | null;
  adjustment: -1 | 0 | 1;
};

export type NativeContextSampleResult = NativeContextSampleModeZeroResult | NativeContextSampleModeOneResult;

export type NativeContextSampleEvidenceContract = {
  helperAddress: string;
  baseOffset: { value: number; loadAddress: string; addAddress: string };
  modes: Array<{
    mode: 0 | 1;
    contextVectorOffset: string;
    value: number;
    loadAddress: string;
    targetAddress: string;
  }>;
  rangeSelection: {
    lowerCompareCallAddress: string;
    fixedUpperValue: number;
    fixedUpperLoadAddress: string;
    upperCompareCallAddress: string;
    interpolationTargetAddress: string;
  };
  secondaryColdPath: {
    startAddress: string;
    endExclusive: string;
    markerAdjustAddresses: { increment: string; decrement: string };
  };
  note: string;
};

export type NativeContextSampleModeZeroEvidenceContract = {
  helperAddress: string;
  baseOffset: { value: number; loadAddress: string; addAddress: string };
  modeOffset: { value: number; loadAddress: string; addAddress: string };
  rangeSelection: {
    lowerCompareCallAddress: string;
    fixedUpperValue: number;
    fixedUpperLoadAddress: string;
    upperCompareCallAddress: string;
    interpolationTargetAddress: string;
    modeZeroTargetAddress: string;
  };
  note: string;
};

export type NativeContextSampleInterpolationErrorCode =
  | "invalid-record-shape"
  | "non-finite-target"
  | "non-finite-offset"
  | "non-finite-record"
  | "nonpositive-step"
  | "non-increasing-base";

export class NativeContextSampleInterpolationError extends Error {
  constructor(public readonly code: NativeContextSampleInterpolationErrorCode) {
    super(`native-context-sample-interpolation:${code}`);
    this.name = "NativeContextSampleInterpolationError";
  }
}

export type NativeContextSampleColdPathErrorCode =
  | "non-finite-prepared-target"
  | "non-finite-last-record"
  | "target-outside-cold-gap"
  | "non-ascii-marker"
  | "marker-index-out-of-range";

export class NativeContextSampleColdPathError extends Error {
  constructor(public readonly code: NativeContextSampleColdPathErrorCode) {
    super(`native-context-sample-cold-path:${code}`);
    this.name = "NativeContextSampleColdPathError";
  }
}

export type NativeContextSampleInterpolationEvidenceContract = {
  helperAddress: string;
  interpolationStartAddress: string;
  interpolationEndAddress: string;
  rangeChecks: {
    lowerCompareCallAddress: string;
    upperCompareCallAddress: string;
  };
  loop: {
    startAddress: string;
    endAddress: string;
    recordWidthBytes: number;
    pairStrideBytes: number;
    lowerRecordReadAddress: string;
    stepRecordReadAddress: string;
  };
  operationAddresses: {
    division: string;
    quotientFloor: string;
    halfDoubleLoad: string;
    doubleToBinary128: string;
    halfAdd: string;
    roundedFloor: string;
    specialCompare: string;
    specialAdd: string;
    finalSubtract: string;
  };
  sharedFinalization: {
    jumpTargetAddress: string;
    intConversionAddress: string;
  };
  constants: {
    specialRawBinary128Va: string;
    specialValueInt32: number;
    finalSubtrahendInt32: number;
  };
  helperAddresses: {
    add: string;
    compareLower: string;
    compareOrdered: string;
    divide: string;
    doubleToBinary128: string;
    binary128ToInt32: string;
    int32ToBinary128: string;
    multiply: string;
    subtract: string;
    floorl: string;
  };
  note: string;
};

const ZERO_BINARY128: NativeBinary128Bits = { low: 0n, high: 0n };
const SPECIAL_INCREMENT_FROM_VA_0X830B0: NativeBinary128Bits = {
  low: 0n,
  high: 0x3fff000000000000n,
};
const SPECIAL_VALUE_INT32 = 0x19b004;
const FINAL_SUBTRAHEND_INT32 = 0x256859;
const MODE_ZERO_OFFSET = nativeIntToBinary128Bits(7);
const MODE_ONE_OFFSET = nativeIntToBinary128Bits(14);
const FIXED_UPPER = nativeIntToBinary128Bits(0x252f47);
const MODE_ZERO_COLD_EPOCH = nativeIntToBinary128Bits(0x25673b);
const MODE_ZERO_COLD_CYCLE_DAYS = nativeDoubleToBinary128Bits(365.2422);
const MODE_ONE_COLD_CYCLE_DAYS = nativeDoubleToBinary128Bits(29.5306);
const TWENTY_FOUR = nativeIntToBinary128Bits(24);
const TWELVE = nativeIntToBinary128Bits(12);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const HALF = nativeDoubleToBinary128Bits(0.5);
const ONE = nativeIntToBinary128Bits(1);

export function nativeContextSampleModeZero0x181490(input: {
  rawTarget: NativeBinary128Bits;
  records: readonly NativeBinary128Bits[];
  coldMarkers?: string;
}): NativeContextSampleModeZeroResult {
  return nativeContextSample0x181490({ ...input, mode: 0 });
}

export function nativeContextSample0x181490(input: {
  rawTarget: NativeBinary128Bits;
  mode: 0;
  records: readonly NativeBinary128Bits[];
  coldMarkers?: string;
}): NativeContextSampleModeZeroResult;
export function nativeContextSample0x181490(input: {
  rawTarget: NativeBinary128Bits;
  mode: 1;
  records: readonly NativeBinary128Bits[];
  coldMarkers?: string;
}): NativeContextSampleModeOneResult;
export function nativeContextSample0x181490(input: {
  rawTarget: NativeBinary128Bits;
  mode: 0 | 1;
  records: readonly NativeBinary128Bits[];
  coldMarkers?: string;
}): NativeContextSampleResult {
  if (!isFiniteBinary128(input.rawTarget)) {
    throw new NativeContextSampleInterpolationError("non-finite-target");
  }

  const preparedTarget = nativeBinary128Add0x194c80(
    input.rawTarget,
    nativeIntToBinary128Bits(FINAL_SUBTRAHEND_INT32),
  );
  const modeOffset = input.mode === 0 ? MODE_ZERO_OFFSET : MODE_ONE_OFFSET;
  validateInterpolationInput({ target: preparedTarget, offset: modeOffset, records: input.records });

  const lowerBound = nativeBinary128Subtract0x196240(input.records[0], modeOffset);
  const entersInterpolation =
    nativeBinary128Compare0x195130(preparedTarget, lowerBound) >= 0 &&
    nativeBinary128Compare0x1951f0(preparedTarget, FIXED_UPPER) < 0;

  if (entersInterpolation) {
    const result = nativeContextSampleInterpolation0x181a8b({
      target: preparedTarget,
      offset: modeOffset,
      records: input.records,
    });
    if (result.kind === "interpolated") {
      return result;
    }
    if (result.reason === "at-or-above-range" && input.coldMarkers !== undefined) {
      return nativeContextSampleColdPath0x181be3({
        preparedTarget,
        mode: input.mode,
        lastRecord: input.records[input.records.length - 1],
        markerString: input.coldMarkers,
      });
    }
    return {
      kind: "secondary-cold-path",
      reason: result.reason === "below-range" ? "below-record-range" : "at-or-above-record-range",
    };
  }

  const modeInput = nativeBinary128Add0x194c80(preparedTarget, modeOffset);
  if (input.mode === 0) {
    return { kind: "mode-zero", ...nativeContextModeZeroPath0x1817db(modeInput) };
  }
  return { kind: "mode-one", ...nativeContextModeOnePath0x181614(modeInput) };
}

export function nativeContextSampleEvidenceContract(): NativeContextSampleEvidenceContract {
  return {
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
  };
}

export function nativeContextSampleColdPath0x181be3(input: {
  preparedTarget: NativeBinary128Bits;
  mode: 0 | 1;
  lastRecord: NativeBinary128Bits;
  markerString: string;
}): NativeContextSampleColdResolvedResult {
  if (!isFiniteBinary128(input.preparedTarget)) {
    throw new NativeContextSampleColdPathError("non-finite-prepared-target");
  }
  if (!isFiniteBinary128(input.lastRecord)) {
    throw new NativeContextSampleColdPathError("non-finite-last-record");
  }
  if (!isAscii(input.markerString)) {
    throw new NativeContextSampleColdPathError("non-ascii-marker");
  }

  const modeOffset = input.mode === 0 ? MODE_ZERO_OFFSET : MODE_ONE_OFFSET;
  const lastRecordBoundary = nativeBinary128Subtract0x196240(input.lastRecord, modeOffset);
  if (
    nativeBinary128Compare0x1951f0(input.preparedTarget, lastRecordBoundary) < 0 ||
    nativeBinary128Compare0x195130(input.preparedTarget, FIXED_UPPER) >= 0
  ) {
    throw new NativeContextSampleColdPathError("target-outside-cold-gap");
  }

  const modeInput = nativeBinary128Add0x194c80(input.preparedTarget, modeOffset);
  let preliminary = input.mode === 0
    ? nativeContextColdModeZeroPreliminary(modeInput)
    : nativeContextColdModeOneValue0x181c37(modeInput);

  const markerIndex = nativeContextColdMarkerIndex(
    input.preparedTarget,
    lastRecordBoundary,
    input.mode,
  );
  const markerLength = BigInt(input.markerString.length);
  if (markerIndex > markerLength) {
    throw new NativeContextSampleColdPathError("marker-index-out-of-range");
  }

  const marker = markerIndex === markerLength ? null : input.markerString[Number(markerIndex)];
  let adjustment: -1 | 0 | 1 = 0;
  if (marker === "1") {
    preliminary = nativeBinary128Add0x194c80(preliminary, ONE);
    adjustment = 1;
  } else if (marker === "2") {
    preliminary = nativeBinary128Subtract0x196240(preliminary, ONE);
    adjustment = -1;
  }

  return {
    kind: "cold-resolved",
    mode: input.mode,
    value: nativeBinary128BitsToInt(preliminary),
    markerIndex,
    marker,
    adjustment,
  };
}

export function nativeContextSampleModeZeroEvidenceContract(): NativeContextSampleModeZeroEvidenceContract {
  return {
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
  };
}

export function nativeContextSampleInterpolation0x181a8b(input: {
  target: NativeBinary128Bits;
  offset: NativeBinary128Bits;
  records: readonly NativeBinary128Bits[];
}): NativeContextSampleInterpolationResult {
  validateInterpolationInput(input);

  const lowerBound = nativeBinary128Subtract0x196240(input.records[0], input.offset);
  if (nativeBinary128Compare0x1951f0(input.target, lowerBound) < 0) {
    return { kind: "cold-path", reason: "below-range" };
  }

  const upperBound = nativeBinary128Subtract0x196240(input.records[input.records.length - 1], input.offset);
  if (nativeBinary128Compare0x195130(input.target, upperBound) >= 0) {
    return { kind: "cold-path", reason: "at-or-above-range" };
  }

  for (let nextBaseIndex = 2; nextBaseIndex < input.records.length; nextBaseIndex += 2) {
    const probe = nativeBinary128Add0x194c80(input.target, input.offset);
    if (nativeBinary128Compare0x195130(probe, input.records[nextBaseIndex]) < 0) {
      return interpolatePair(input, nextBaseIndex);
    }
  }

  return { kind: "cold-path", reason: "at-or-above-range" };
}

export function nativeContextSampleInterpolation0x181a8bEvidenceContract(): NativeContextSampleInterpolationEvidenceContract {
  return {
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
      specialValueInt32: SPECIAL_VALUE_INT32,
      finalSubtrahendInt32: FINAL_SUBTRAHEND_INT32,
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
  };
}

function interpolatePair(
  input: {
    target: NativeBinary128Bits;
    offset: NativeBinary128Bits;
    records: readonly NativeBinary128Bits[];
  },
  nextBaseIndex: number,
): NativeContextSampleInterpolationResult {
  const base = input.records[nextBaseIndex - 2];
  const step = input.records[nextBaseIndex - 1];

  const probe = nativeBinary128Add0x194c80(input.target, input.offset);
  const delta = nativeBinary128Subtract0x196240(probe, base);
  const quotient = nativeBinary128Divide0x1952a0(delta, step);
  const q = nativeBinary128Floorl0x19a380(quotient);
  const stepped = nativeBinary128Multiply0x195cd0(step, q);
  const basePlusStepped = nativeBinary128Add0x194c80(base, stepped);
  const half = nativeDoubleToBinary128Bits(0.5);
  const withHalf = nativeBinary128Add0x194c80(basePlusStepped, half);
  let rounded = nativeBinary128Floorl0x19a380(withHalf);

  const specialValue = nativeIntToBinary128Bits(SPECIAL_VALUE_INT32);
  if (nativeBinary128Compare0x195130(rounded, specialValue) === 0) {
    rounded = nativeBinary128Add0x194c80(rounded, SPECIAL_INCREMENT_FROM_VA_0X830B0);
  }

  const finalSubtrahend = nativeIntToBinary128Bits(FINAL_SUBTRAHEND_INT32);
  const adjusted = nativeBinary128Subtract0x196240(rounded, finalSubtrahend);
  return {
    kind: "interpolated",
    pairIndex: (nextBaseIndex - 2) / 2,
    value: nativeBinary128BitsToInt(adjusted),
  };
}

function nativeContextColdModeZeroPreliminary(modeInput: NativeBinary128Bits): NativeBinary128Bits {
  let angle = nativeBinary128Subtract0x196240(modeInput, MODE_ZERO_COLD_EPOCH);
  angle = nativeBinary128Divide0x1952a0(angle, MODE_ZERO_COLD_CYCLE_DAYS);
  angle = nativeBinary128Multiply0x195cd0(angle, TWENTY_FOUR);
  angle = nativeBinary128Floorl0x19a380(angle);
  angle = nativeBinary128Multiply0x195cd0(angle, PI);
  angle = nativeBinary128Divide0x1952a0(angle, TWELVE);

  const transformed = nativeContextColdModeZeroTransform0x182340(angle);
  return nativeBinary128Floorl0x19a380(nativeBinary128Add0x194c80(transformed, HALF));
}

function nativeContextColdMarkerIndex(
  preparedTarget: NativeBinary128Bits,
  lastRecordBoundary: NativeBinary128Bits,
  mode: 0 | 1,
): bigint {
  let index = nativeBinary128Subtract0x196240(preparedTarget, lastRecordBoundary);
  if (mode === 0) {
    index = nativeBinary128Divide0x1952a0(index, MODE_ZERO_COLD_CYCLE_DAYS);
    index = nativeBinary128Multiply0x195cd0(index, TWENTY_FOUR);
  } else {
    index = nativeBinary128Divide0x1952a0(index, MODE_ONE_COLD_CYCLE_DAYS);
  }
  index = nativeBinary128Floorl0x19a380(index);
  return nativeBinary128BitsToUint64(index);
}

function validateInterpolationInput(input: {
  target: NativeBinary128Bits;
  offset: NativeBinary128Bits;
  records: readonly NativeBinary128Bits[];
}): void {
  if (input.records.length < 3 || input.records.length % 2 === 0) {
    throw new NativeContextSampleInterpolationError("invalid-record-shape");
  }
  if (!isFiniteBinary128(input.target)) {
    throw new NativeContextSampleInterpolationError("non-finite-target");
  }
  if (!isFiniteBinary128(input.offset)) {
    throw new NativeContextSampleInterpolationError("non-finite-offset");
  }
  if (input.records.some((record) => !isFiniteBinary128(record))) {
    throw new NativeContextSampleInterpolationError("non-finite-record");
  }

  for (let stepIndex = 1; stepIndex < input.records.length; stepIndex += 2) {
    if (nativeBinary128Compare0x195130(input.records[stepIndex], ZERO_BINARY128) <= 0) {
      throw new NativeContextSampleInterpolationError("nonpositive-step");
    }
  }

  // Defensive API contract only; this does not claim the native helper has a corresponding guard.
  for (let baseIndex = 2; baseIndex < input.records.length; baseIndex += 2) {
    if (nativeBinary128Compare0x195130(input.records[baseIndex - 2], input.records[baseIndex]) >= 0) {
      throw new NativeContextSampleInterpolationError("non-increasing-base");
    }
  }
}

function isFiniteBinary128(bits: NativeBinary128Bits): boolean {
  const high = BigInt.asUintN(64, bits.high);
  return ((high >> 48n) & 0x7fffn) !== 0x7fffn;
}

function isAscii(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) > 0x7f) {
      return false;
    }
  }
  return true;
}
