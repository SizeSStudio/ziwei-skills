import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeBinary128Cosl0x19a420, nativeBinary128Sinl0x19a430 } from "./native-trig";

export type NativeContextColdModeZeroTransformEvidenceContract = {
  function: { address: string; endExclusive: string };
  caller: { functionAddress: string; callAddress: string; observedCallCount: number };
  trigCalls: { cosl: number; sinl: number };
  integerConstants: number[];
  doubleConstantVirtualAddresses: string[];
  note: string;
};

const PRIMARY_DIVISOR = double(628.3319653318);
const TEN_MILLION = integer(10000000);

export function nativeContextColdModeZeroTransform0x182340(
  input: NativeBinary128Bits,
): NativeBinary128Bits {
  assertFinite(input);

  let normalized = divide(subtract(input, double(4.895062166)), PRIMARY_DIVISOR);

  let correction = multiply(integer(53), normalized);
  correction = multiply(correction, normalized);

  let phase = add(double(4.67), multiply(double(628.307585), normalized));
  correction = add(correction, multiply(integer(0x51924), cosine(phase)));

  phase = add(double(2.678), multiply(double(628.3076), normalized));
  let weightedCosine = multiply(integer(0x080d), cosine(phase));
  weightedCosine = multiply(weightedCosine, normalized);
  correction = add(correction, weightedCosine);

  correction = divide(correction, PRIMARY_DIVISOR);
  normalized = subtract(normalized, divide(correction, TEN_MILLION));

  let residual = add(double(48950621.66), multiply(double(6283319653.318), normalized));
  let quadratic = multiply(integer(53), normalized);
  quadratic = multiply(quadratic, normalized);
  residual = add(residual, quadratic);

  const sharedLinearPhase = multiply(double(628.307585), normalized);
  phase = add(double(4.669257), sharedLinearPhase);
  residual = add(residual, multiply(integer(0x51956), cosine(phase)));

  phase = add(double(4.6261), multiply(double(1256.61517), normalized));
  residual = add(residual, multiply(integer(0x0da1), cosine(phase)));

  phase = add(double(2.67823), sharedLinearPhase);
  weightedCosine = multiply(double(2060.6), cosine(phase));
  weightedCosine = multiply(weightedCosine, normalized);
  residual = add(residual, weightedCosine);
  residual = subtract(residual, integer(0x03e2));

  phase = subtract(double(2.1824), multiply(double(33.75705), normalized));
  residual = subtract(residual, multiply(integer(0x0342), sine(phase)));
  residual = subtract(divide(residual, TEN_MILLION), input);
  residual = divide(residual, double(628.332));

  let timeCorrection = add(normalized, double(1.8));
  const shiftedTime = timeCorrection;
  timeCorrection = multiply(integer(32), timeCorrection);
  timeCorrection = multiply(timeCorrection, shiftedTime);
  timeCorrection = subtract(timeCorrection, integer(20));
  timeCorrection = divide(timeCorrection, integer(86400));
  timeCorrection = divide(timeCorrection, integer(36525));

  const combinedCorrection = add(residual, timeCorrection);
  let result = subtract(normalized, combinedCorrection);
  result = multiply(result, integer(36525));
  return add(result, double(8 / 24));
}

export function nativeContextColdModeZeroTransformEvidenceContract(): NativeContextColdModeZeroTransformEvidenceContract {
  return {
    function: { address: "0x182340", endExclusive: "0x1827a8" },
    caller: { functionAddress: "0x181490", callAddress: "0x1820f8", observedCallCount: 1 },
    trigCalls: { cosl: 5, sinl: 1 },
    integerConstants: [53, 0x51924, 0x080d, 10000000, 0x51956, 0x0da1, 0x03e2, 0x0342, 32, 20, 86400, 36525],
    doubleConstantVirtualAddresses: [
      "0x83280", "0x832d8", "0x832f0", "0x83408", "0x83430", "0x834e0", "0x83538",
      "0x835b8", "0x835c0", "0x83618", "0x83638", "0x83670", "0x836a0", "0x836f0",
      "0x836f8", "0x83720", "0x83728", "0x83730", "0x837b0",
    ],
    note: "cold-path mode-zero numeric transform only; no marker string, calendar, astrology, or chart parity is claimed",
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

function cosine(value: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Cosl0x19a420(value);
}

function sine(value: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Sinl0x19a430(value);
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeContextColdModeZeroTransformError(
      "native-context-cold-mode-zero-transform:non-finite-input",
    );
  }
}

export class NativeContextColdModeZeroTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeContextColdModeZeroTransformError";
  }
}
