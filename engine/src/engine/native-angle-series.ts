import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativePeriodicCorrection0x1838a0 } from "./native-periodic-correction";
import { nativeSeriesTransformTableZero0x183d40 } from "./native-series-transform";
import { nativeBinary128Cosl0x19a420 } from "./native-trig";

export type NativeAngleSeriesEvidenceContract = {
  function: { address: string; endExclusive: string };
  observedCallers: string[];
  seriesCallAddress: string;
  periodicCorrectionCallAddress: string;
  cosineCallAddress: string;
  finalPiAddAddress: string;
  characterizationVectorCount: number;
  note: string;
};

const ONE = nativeIntToBinary128Bits(1);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const FINAL_CORRECTION_DIVISOR = nativeDoubleToBinary128Bits(648000 / Math.PI);

const COSINE_PHASE_BASE = nativeDoubleToBinary128Bits(-0.043126);
const COSINE_PHASE_LINEAR = nativeDoubleToBinary128Bits(628.301955);
const COSINE_PHASE_QUADRATIC = nativeDoubleToBinary128Bits(0.000002732);
const COSINE_AMPLITUDE_BASE = nativeDoubleToBinary128Bits(0.016708634);
const COSINE_AMPLITUDE_LINEAR = nativeDoubleToBinary128Bits(0.000042037);
const COSINE_AMPLITUDE_QUADRATIC = nativeDoubleToBinary128Bits(0.0000001267);
const COSINE_SCALE = nativeDoubleToBinary128Bits(-20.49552);

export function nativeAngleSeries0x185800(
  input: NativeBinary128Bits,
  precision: number,
): NativeBinary128Bits {
  assertFinite(input);
  assertPrecision(precision);

  let result = nativeSeriesTransformTableZero0x183d40(input, precision);
  result = nativeBinary128Add0x194c80(result, nativePeriodicCorrection0x1838a0(input));
  result = nativeBinary128Add0x194c80(result, cosineCorrection(input));
  return nativeBinary128Add0x194c80(result, PI);
}

export function nativeAngleSeriesEvidenceContract(): NativeAngleSeriesEvidenceContract {
  return {
    function: { address: "0x185800", endExclusive: "0x1859b1" },
    observedCallers: ["0x14b2a5", "0x14b5d1", "0x14cfa3", "0x14d341", "0x14de2c", "0x14eda8"],
    seriesCallAddress: "0x18581e",
    periodicCorrectionCallAddress: "0x18582b",
    cosineCallAddress: "0x18592f",
    finalPiAddAddress: "0x1859a6",
    characterizationVectorCount: 5,
    note: "binary128 numeric orchestration only; no calendar, astrology, or chart semantics are claimed",
  };
}

function cosineCorrection(input: NativeBinary128Bits): NativeBinary128Bits {
  let phase = nativeBinary128Multiply0x195cd0(COSINE_PHASE_LINEAR, input);
  phase = nativeBinary128Add0x194c80(COSINE_PHASE_BASE, phase);
  let phaseQuadratic = nativeBinary128Multiply0x195cd0(COSINE_PHASE_QUADRATIC, input);
  phaseQuadratic = nativeBinary128Multiply0x195cd0(phaseQuadratic, input);
  phase = nativeBinary128Subtract0x196240(phase, phaseQuadratic);

  let amplitude = nativeBinary128Multiply0x195cd0(COSINE_AMPLITUDE_LINEAR, input);
  amplitude = nativeBinary128Subtract0x196240(COSINE_AMPLITUDE_BASE, amplitude);
  let amplitudeQuadratic = nativeBinary128Multiply0x195cd0(COSINE_AMPLITUDE_QUADRATIC, input);
  amplitudeQuadratic = nativeBinary128Multiply0x195cd0(amplitudeQuadratic, input);
  amplitude = nativeBinary128Subtract0x196240(amplitude, amplitudeQuadratic);

  let correction = nativeBinary128Multiply0x195cd0(amplitude, nativeBinary128Cosl0x19a420(phase));
  correction = nativeBinary128Add0x194c80(ONE, correction);
  correction = nativeBinary128Multiply0x195cd0(COSINE_SCALE, correction);
  return nativeBinary128Divide0x1952a0(correction, FINAL_CORRECTION_DIVISOR);
}

function assertPrecision(precision: number): void {
  if (!Number.isInteger(precision) || precision < -0x80000000 || precision > 0x7fffffff) {
    throw new NativeAngleSeriesError(`native-angle-series:invalid-precision:${precision}`);
  }
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeAngleSeriesError("native-angle-series:non-finite-input");
  }
}

export class NativeAngleSeriesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeAngleSeriesError";
  }
}
