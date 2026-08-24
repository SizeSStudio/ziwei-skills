import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeBinary128Cosl0x19a420 } from "./native-trig";

export type NativeContextColdModeOneValueEvidenceContract = {
  function: { address: string; endExclusive: string };
  trigCalls: { coslTarget: string; callAddresses: string[] };
  floorlCallAddresses: string[];
  doubleConstantVirtualAddresses: string[];
  integerConstants: number[];
  note: string;
};

const NORMALIZATION_DIVISOR = double(7771.37714500204);

export function nativeContextColdModeOneValue0x181c37(
  input: NativeBinary128Bits,
): NativeBinary128Bits {
  assertFinite(input);

  let angle = subtract(input, integer(0x25685f));
  angle = floor(divide(angle, double(29.5306)));
  angle = multiply(angle, double(Math.PI));
  angle = multiply(angle, integer(2));

  const normalized = divide(add(angle, double(1.08472)), NORMALIZATION_DIVISOR);
  let correction = multiply(double(-3.31e-5), normalized);
  correction = multiply(correction, normalized);

  let phase = add(double(0.785), multiply(double(8328.6914), normalized));
  correction = add(correction, multiply(double(0.10976), cosine(phase)));

  phase = add(double(0.187), multiply(double(7214.0629), normalized));
  correction = add(correction, multiply(double(0.02224), cosine(phase)));

  phase = add(double(4.669), multiply(double(628.3076), normalized));
  correction = subtract(correction, multiply(double(0.03342), cosine(phase)));
  correction = divide(correction, NORMALIZATION_DIVISOR);

  let timeCorrection = add(normalized, double(1.8));
  const shiftedTime = timeCorrection;
  timeCorrection = multiply(integer(32), timeCorrection);
  timeCorrection = multiply(timeCorrection, shiftedTime);
  timeCorrection = subtract(timeCorrection, integer(20));
  timeCorrection = divide(timeCorrection, integer(86400));
  timeCorrection = divide(timeCorrection, integer(36525));

  const combinedCorrection = add(correction, timeCorrection);
  let result = subtract(normalized, combinedCorrection);
  result = multiply(result, integer(36525));
  result = add(result, double(8 / 24));
  result = add(result, double(0.5));
  return floor(result);
}

export function nativeContextColdModeOneValueEvidenceContract(): NativeContextColdModeOneValueEvidenceContract {
  return {
    function: { address: "0x181c37", endExclusive: "0x181fe6" },
    trigCalls: {
      coslTarget: "0x19a420",
      callAddresses: ["0x181d81", "0x181dfb", "0x181e75"],
    },
    floorlCallAddresses: ["0x181c73", "0x181fda"],
    doubleConstantVirtualAddresses: [
      "0x832a8", "0x832b0", "0x832b8", "0x832d0", "0x832f0", "0x83300", "0x83398",
      "0x833b0", "0x83408", "0x83478", "0x834e8", "0x83588", "0x83668", "0x836f0",
      "0x83758", "0x83760", "0x837b0", "0x837d0",
    ],
    integerConstants: [0x25685f, 2, 32, 20, 86400, 36525],
    note: "cold-path mode-one preliminary value only; no marker string, calendar, astrology, or chart parity is claimed",
  };
}

function double(value: number): NativeBinary128Bits {
  return nativeDoubleToBinary128Bits(value);
}

function integer(value: number): NativeBinary128Bits {
  return nativeIntToBinary128Bits(value);
}

function add(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Add0x194c80(left, right);
}

function subtract(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Subtract0x196240(left, right);
}

function multiply(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Multiply0x195cd0(left, right);
}

function divide(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Divide0x1952a0(left, right);
}

function floor(value: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Floorl0x19a380(value);
}

function cosine(value: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Cosl0x19a420(value);
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeContextColdModeOneError("native-context-cold-mode-one:non-finite-input");
  }
}

export class NativeContextColdModeOneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeContextColdModeOneError";
  }
}
