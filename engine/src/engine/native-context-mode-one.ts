import { nativeModeOneCorrection0x1859c0 } from "./native-mode-one-correction";
import { nativeModeOneTransform0x1868e0 } from "./native-mode-one-transform";
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

export type NativeContextModeOneResult = {
  value: number;
  branch: "provisional" | "iterated";
  boundarySeconds: NativeBinary128Bits;
};

export type NativeContextModeOneEvidenceContract = {
  path: {
    startAddress: string;
    provisionalBranchTarget: string;
    iteratedBranchStart: string;
    sharedFinalizeAddress: string;
    finalFloorAddress: string;
    finalIntCallAddress: string;
  };
  inputBoundary: { preparedAtAddress: string; modeBranchAddress: string; note: string };
  directHelpers: {
    modeOneTransform: { callAddress: string; targetAddress: string };
    modeOneCorrection: { callAddress: string; targetAddress: string };
    piecewiseWrapper: { callAddresses: string[]; targetAddress: string };
  };
  branchWindowSeconds: { lowerInclusive: number; upperInclusive: number };
  characterizationVectorCount: number;
  note: string;
};

const EPOCH = nativeIntToBinary128Bits(0x25685f);
const CYCLE_DAYS = nativeDoubleToBinary128Bits(29.5306);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const TWO = nativeIntToBinary128Bits(2);
const OUTPUT_SCALE = nativeIntToBinary128Bits(0x8ead);
const PROVISIONAL_OFFSET = nativeDoubleToBinary128Bits(8 / 24);
const HALF = nativeDoubleToBinary128Bits(0.5);
const ONE = nativeIntToBinary128Bits(1);
const SECONDS_PER_DAY = nativeIntToBinary128Bits(0x15180);
const WINDOW_LOWER = nativeIntToBinary128Bits(0x0708);
const WINDOW_UPPER = nativeIntToBinary128Bits(0x14a78);

export function nativeContextModeOnePath0x181614(
  preparedInput: NativeBinary128Bits,
): NativeContextModeOneResult {
  assertFinite(preparedInput);

  let angle = nativeBinary128Subtract0x196240(preparedInput, EPOCH);
  angle = nativeBinary128Divide0x1952a0(angle, CYCLE_DAYS);
  angle = nativeBinary128Floorl0x19a380(angle);
  angle = nativeBinary128Multiply0x195cd0(angle, PI);
  angle = nativeBinary128Multiply0x195cd0(angle, TWO);

  const transformed = nativeModeOneTransform0x1868e0(angle);
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
    const corrected = nativeModeOneCorrection0x1859c0(angle);
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

export function nativeContextModeOneEvidenceContract(): NativeContextModeOneEvidenceContract {
  return {
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
    characterizationVectorCount: 5,
    note: "prepared-input mode 1 numeric path only; no context range selection, calendar, astrology, or chart parity is claimed",
  };
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeContextModeOneError("native-context-mode-one:non-finite-input");
  }
}

export class NativeContextModeOneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeContextModeOneError";
  }
}
