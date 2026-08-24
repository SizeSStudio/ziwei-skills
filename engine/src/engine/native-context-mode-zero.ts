import { nativeIteratedCorrection0x1861d0 } from "./native-iterated-correction";
import { nativeModeZeroTransform0x186e40 } from "./native-mode-transform";
import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToInt,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Fmodl0x19a410,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeTransformWrapper0x183830 } from "./native-transform";

export type NativeContextModeZeroResult = {
  value: number;
  branch: "provisional" | "iterated";
  boundarySeconds: NativeBinary128Bits;
};

export type NativeContextModeZeroEvidenceContract = {
  path: {
    startAddress: string;
    provisionalBranchTarget: string;
    iteratedBranchStart: string;
    finalFloorAddress: string;
    finalIntCallAddress: string;
  };
  inputBoundary: { preparedAtAddress: string; modeBranchAddress: string; note: string };
  directHelpers: {
    modeZeroTransform: { callAddress: string; targetAddress: string };
    iteratedCorrection: { callAddress: string; targetAddress: string };
    piecewiseWrapper: { callAddresses: string[]; targetAddress: string };
  };
  branchWindowSeconds: { lowerInclusive: number; upperInclusive: number };
  characterizationVectorCount: number;
  note: string;
};

const EPOCH = nativeIntToBinary128Bits(0x25673b);
const DAYS_PER_YEAR = nativeDoubleToBinary128Bits(365.2422);
const SEGMENTS_PER_CYCLE = nativeIntToBinary128Bits(24);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const ANGLE_DIVISOR = nativeIntToBinary128Bits(12);
const OUTPUT_SCALE = nativeIntToBinary128Bits(0x8ead);
const PROVISIONAL_OFFSET = nativeDoubleToBinary128Bits(8 / 24);
const HALF = nativeDoubleToBinary128Bits(0.5);
const ONE = nativeIntToBinary128Bits(1);
const SECONDS_PER_DAY = nativeIntToBinary128Bits(0x15180);
const WINDOW_LOWER = nativeIntToBinary128Bits(0x04b0);
const WINDOW_UPPER = nativeIntToBinary128Bits(0x14cd0);

export function nativeContextModeZeroPath0x1817db(
  preparedInput: NativeBinary128Bits,
): NativeContextModeZeroResult {
  assertFinite(preparedInput);

  let angle = nativeBinary128Subtract0x196240(preparedInput, EPOCH);
  angle = nativeBinary128Divide0x1952a0(angle, DAYS_PER_YEAR);
  angle = nativeBinary128Multiply0x195cd0(angle, SEGMENTS_PER_CYCLE);
  angle = nativeBinary128Floorl0x19a380(angle);
  angle = nativeBinary128Multiply0x195cd0(angle, PI);
  angle = nativeBinary128Divide0x1952a0(angle, ANGLE_DIVISOR);

  const transformed = nativeModeZeroTransform0x186e40(angle);
  const scaledTransform = nativeBinary128Multiply0x195cd0(OUTPUT_SCALE, transformed);
  let provisional = nativeBinary128Subtract0x196240(
    scaledTransform,
    nativeTransformWrapper0x183830(scaledTransform),
  );
  provisional = nativeBinary128Add0x194c80(provisional, PROVISIONAL_OFFSET);

  const branchProbe = nativeBinary128Add0x194c80(provisional, HALF);
  const boundarySeconds = nativeBinary128Multiply0x195cd0(
    nativeBinary128Fmodl0x19a410(branchProbe, ONE),
    SECONDS_PER_DAY,
  );
  const useIteratedCorrection =
    nativeBinary128Compare0x195130(boundarySeconds, WINDOW_LOWER) < 0 ||
    nativeBinary128Compare0x1951f0(boundarySeconds, WINDOW_UPPER) > 0;

  if (useIteratedCorrection) {
    const corrected = nativeIteratedCorrection0x1861d0(angle);
    const scaledCorrection = nativeBinary128Multiply0x195cd0(OUTPUT_SCALE, corrected);
    provisional = nativeBinary128Subtract0x196240(
      scaledCorrection,
      nativeTransformWrapper0x183830(provisional),
    );
    provisional = nativeBinary128Add0x194c80(provisional, PROVISIONAL_OFFSET);
  }

  const rounded = nativeBinary128Floorl0x19a380(nativeBinary128Add0x194c80(provisional, HALF));
  return {
    value: nativeBinary128BitsToInt(rounded),
    branch: useIteratedCorrection ? "iterated" : "provisional",
    boundarySeconds,
  };
}

export function nativeContextModeZeroEvidenceContract(): NativeContextModeZeroEvidenceContract {
  return {
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
    characterizationVectorCount: 4,
    note: "prepared-input mode 0 numeric path only; no context range selection, calendar, astrology, or chart parity is claimed",
  };
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeContextModeZeroError("native-context-mode-zero:non-finite-input");
  }
}

export class NativeContextModeZeroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeContextModeZeroError";
  }
}
