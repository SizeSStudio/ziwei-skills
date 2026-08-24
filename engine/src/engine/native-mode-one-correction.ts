import { nativeModeOneDenominator0x185160 } from "./native-mode-one-denominator";
import { nativeModeOneSeriesTransformTableZero0x1842b0 } from "./native-mode-one-series";
import { nativeSeriesTransformTableZero0x183d40 } from "./native-series-transform";
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

export type NativeModeOneCorrectionEvidenceContract = {
  function: { address: string; endExclusive: string };
  callers: Array<{ functionAddress: string; callAddress: string }>;
  passes: Array<{
    modeOneSeriesCall: string;
    modeOnePrecision: number;
    modeZeroSeriesCall: string;
    modeZeroPrecision: number;
  }>;
  denominatorCall: { callAddress: string; targetAddress: string };
  directTrigCalls: { cosl: string[]; sinl: string[] };
  doubleConstantVirtualAddresses: string[];
  note: string;
};

const NORMALIZATION_DIVISOR = double(7771.37714500204);
const NORMALIZATION_OFFSET = double(1.08472);
const SERIES_SCALE = double(648000 / Math.PI);

export function nativeModeOneCorrection0x1859c0(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFinite(input);

  let current = divide(add(input, NORMALIZATION_OFFSET), NORMALIZATION_DIVISOR);
  current = correctionPass(input, current, NORMALIZATION_DIVISOR, 3, 3);
  const correctedDivisor = adjustedResidualDivisor(current);
  current = correctionPass(input, current, correctedDivisor, 20, 10);
  return correctionPass(input, current, correctedDivisor, -1, 60);
}

export function nativeModeOneCorrectionEvidenceContract(): NativeModeOneCorrectionEvidenceContract {
  return {
    function: { address: "0x1859c0", endExclusive: "0x1861c5" },
    callers: [
      { functionAddress: "0x14bed0", callAddress: "0x14cd55" },
      { functionAddress: "0x181490", callAddress: "0x18179e" },
    ],
    passes: [
      { modeOneSeriesCall: "0x185a27", modeOnePrecision: 3, modeZeroSeriesCall: "0x185a60", modeZeroPrecision: 3 },
      { modeOneSeriesCall: "0x185dd3", modeOnePrecision: 20, modeZeroSeriesCall: "0x185e0c", modeZeroPrecision: 10 },
      { modeOneSeriesCall: "0x185fe0", modeOnePrecision: -1, modeZeroSeriesCall: "0x186019", modeZeroPrecision: 60 },
    ],
    denominatorCall: { callAddress: "0x185c11", targetAddress: "0x185160" },
    directTrigCalls: {
      cosl: ["0x185b58", "0x185f07", "0x186114"],
      sinl: ["0x185c69", "0x185cce", "0x185d16", "0x185d67"],
    },
    doubleConstantVirtualAddresses: [
      "0x83340", "0x83358", "0x83368", "0x83410", "0x83448", "0x83478", "0x834b0",
      "0x834b8", "0x83520", "0x83528", "0x83538", "0x83558", "0x836f8", "0x83708",
      "0x83748", "0x83758", "0x83798", "0x837c8", "0x837d0", "0x83800",
    ],
    note: "three-pass numeric correction only; no 0x181490 outer path, calendar, astrology, or chart parity is claimed",
  };
}

function correctionPass(
  originalInput: NativeBinary128Bits,
  current: NativeBinary128Bits,
  residualDivisor: NativeBinary128Bits,
  modeOnePrecision: number,
  modeZeroPrecision: number,
): NativeBinary128Bits {
  const modeOneSeries = add(
    nativeModeOneSeriesTransformTableZero0x1842b0(current, modeOnePrecision),
    double(-3.4e-6),
  );
  let modeZeroSeries = nativeSeriesTransformTableZero0x183d40(current, modeZeroPrecision);

  let cosinePhase = add(double(-0.043126), multiply(double(628.301955), current));
  let quadratic = multiply(double(2.732e-6), current);
  quadratic = multiply(quadratic, current);
  cosinePhase = subtract(cosinePhase, quadratic);

  let cosineAmplitude = subtract(double(0.016708634), multiply(double(4.2037e-5), current));
  quadratic = multiply(double(1.267e-7), current);
  quadratic = multiply(quadratic, current);
  cosineAmplitude = subtract(cosineAmplitude, quadratic);

  let correction = multiply(cosineAmplitude, cosine(cosinePhase));
  correction = add(nativeIntToBinary128Bits(1), correction);
  correction = multiply(double(-20.49552), correction);
  correction = divide(correction, SERIES_SCALE);
  modeZeroSeries = add(modeZeroSeries, correction);
  modeZeroSeries = add(modeZeroSeries, double(Math.PI));

  const seriesDifference = subtract(modeOneSeries, modeZeroSeries);
  const residual = divide(subtract(originalInput, seriesDifference), residualDivisor);
  return add(current, residual);
}

function adjustedResidualDivisor(current: NativeBinary128Bits): NativeBinary128Bits {
  const sharedLinear = multiply(double(628.307585), current);
  let correction = double(628.332);

  let phase = add(double(1.527), sharedLinear);
  correction = add(correction, multiply(nativeIntToBinary128Bits(21), sine(phase)));

  phase = add(double(1.48), multiply(nativeIntToBinary128Bits(2), sharedLinear));
  correction = add(correction, multiply(double(0.44), sine(phase)));

  phase = add(double(5.82), sharedLinear);
  let weightedSine = multiply(double(0.129), sine(phase));
  weightedSine = multiply(weightedSine, current);
  correction = add(correction, weightedSine);

  phase = add(double(4.21), sharedLinear);
  weightedSine = multiply(double(0.00055), sine(phase));
  weightedSine = multiply(weightedSine, current);
  weightedSine = multiply(weightedSine, current);
  correction = add(correction, weightedSine);

  return subtract(nativeModeOneDenominator0x185160(current), correction);
}

function double(value: number): NativeBinary128Bits {
  return nativeDoubleToBinary128Bits(value);
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
    throw new NativeModeOneCorrectionError("native-mode-one-correction:non-finite-input");
  }
}

export class NativeModeOneCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeModeOneCorrectionError";
  }
}
