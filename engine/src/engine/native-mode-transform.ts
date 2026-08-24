import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
} from "./native-numeric";
import { nativeSeriesTransformModeZero0x183d40 } from "./native-series-transform";
import { nativeBinary128Cosl0x19a420, nativeBinary128Sinl0x19a430 } from "./native-trig";

export type NativeModeTransformEvidenceContract = {
  function: { address: string; endExclusive: string };
  observedCaller: { functionAddress: string; callAddress: string; mode: number };
  directCalls: {
    cosl: string[];
    sinl: string[];
    fixedSeriesTransform: {
      callAddress: string;
      functionAddress: string;
      arguments: { tableIndex: number; variant: number; precision: number };
    };
  };
  doubleConstants: Record<string, number>;
  finalDoubleDivisor: { numerator: number; denominatorAddress: string };
  characterizationVectorCount: number;
  note: string;
};

const PERIOD = nativeDoubleToBinary128Bits(628.3319653318);
const INITIAL_OFFSET = nativeDoubleToBinary128Bits(1.75347);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const QUADRATIC_COEFFICIENT = nativeDoubleToBinary128Bits(0.000005297);
const FIRST_COSINE_COEFFICIENT = nativeDoubleToBinary128Bits(0.0334166);
const FIRST_COSINE_PHASE = nativeDoubleToBinary128Bits(4.669257);
const FREQUENCY = nativeDoubleToBinary128Bits(628.307585);
const SECOND_COSINE_COEFFICIENT = nativeDoubleToBinary128Bits(0.0002061);
const SECOND_COSINE_PHASE = nativeDoubleToBinary128Bits(2.67823);
const SINE_BASE = nativeDoubleToBinary128Bits(20.5);
const SINE_COEFFICIENT = nativeDoubleToBinary128Bits(17.2);
const SINE_PHASE = nativeDoubleToBinary128Bits(2.1824);
const SINE_FREQUENCY = nativeDoubleToBinary128Bits(33.75705);
const FINAL_CORRECTION_DIVISOR = nativeDoubleToBinary128Bits(648000 / Math.PI);

export function nativeModeZeroTransform0x186e40(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFinite(input);

  let adjustedInput = nativeBinary128Subtract0x196240(input, INITIAL_OFFSET);
  adjustedInput = nativeBinary128Subtract0x196240(adjustedInput, PI);

  let periodicCorrection = nativeBinary128Multiply0x195cd0(QUADRATIC_COEFFICIENT, adjustedInput);
  periodicCorrection = nativeBinary128Multiply0x195cd0(periodicCorrection, adjustedInput);
  const frequencyTimesInput = nativeBinary128Multiply0x195cd0(FREQUENCY, adjustedInput);

  const firstCosineArgument = nativeBinary128Add0x194c80(FIRST_COSINE_PHASE, frequencyTimesInput);
  const firstCosineTerm = nativeBinary128Multiply0x195cd0(
    FIRST_COSINE_COEFFICIENT,
    nativeBinary128Cosl0x19a420(firstCosineArgument),
  );
  periodicCorrection = nativeBinary128Add0x194c80(periodicCorrection, firstCosineTerm);

  const secondCosineArgument = nativeBinary128Add0x194c80(SECOND_COSINE_PHASE, frequencyTimesInput);
  let secondCosineTerm = nativeBinary128Multiply0x195cd0(
    SECOND_COSINE_COEFFICIENT,
    nativeBinary128Cosl0x19a420(secondCosineArgument),
  );
  secondCosineTerm = nativeBinary128Multiply0x195cd0(secondCosineTerm, adjustedInput);
  periodicCorrection = nativeBinary128Add0x194c80(periodicCorrection, secondCosineTerm);
  periodicCorrection = nativeBinary128Divide0x1952a0(periodicCorrection, PERIOD);
  adjustedInput = nativeBinary128Subtract0x196240(adjustedInput, periodicCorrection);

  const seriesValue = nativeSeriesTransformModeZero0x183d40(adjustedInput);
  let outerCorrection = nativeBinary128Subtract0x196240(input, seriesValue);
  outerCorrection = nativeBinary128Subtract0x196240(outerCorrection, PI);

  const sineArgument = nativeBinary128Subtract0x196240(
    SINE_PHASE,
    nativeBinary128Multiply0x195cd0(SINE_FREQUENCY, adjustedInput),
  );
  let sineCorrection = nativeBinary128Multiply0x195cd0(
    SINE_COEFFICIENT,
    nativeBinary128Sinl0x19a430(sineArgument),
  );
  sineCorrection = nativeBinary128Add0x194c80(SINE_BASE, sineCorrection);
  sineCorrection = nativeBinary128Divide0x1952a0(sineCorrection, FINAL_CORRECTION_DIVISOR);
  outerCorrection = nativeBinary128Add0x194c80(outerCorrection, sineCorrection);
  outerCorrection = nativeBinary128Divide0x1952a0(outerCorrection, PERIOD);
  return nativeBinary128Add0x194c80(adjustedInput, outerCorrection);
}

export function nativeModeTransformEvidenceContract(): NativeModeTransformEvidenceContract {
  return {
    function: { address: "0x186e40", endExclusive: "0x187090" },
    observedCaller: { functionAddress: "0x181490", callAddress: "0x181870", mode: 0 },
    directCalls: {
      cosl: ["0x186f0b", "0x186f53"],
      sinl: ["0x187022"],
      fixedSeriesTransform: {
        callAddress: "0x186f9b",
        functionAddress: "0x183d40",
        arguments: { tableIndex: 0, variant: 0, precision: 8 },
      },
    },
    doubleConstants: {
      "0x832d8": 628.3319653318,
      "0x837a0": 1.75347,
      "0x837d0": Math.PI,
      "0x83630": 0.000005297,
      "0x83518": 0.0334166,
      "0x83720": 4.669257,
      "0x83538": 628.307585,
      "0x83378": 0.0002061,
      "0x83728": 2.67823,
      "0x83600": 20.5,
      "0x83560": 17.2,
      "0x83670": 2.1824,
      "0x83730": 33.75705,
    },
    finalDoubleDivisor: { numerator: 648000, denominatorAddress: "0x837d0" },
    characterizationVectorCount: 8,
    note: "mode 0 numeric helper only; no 0x181490, calendar, astrology, or chart parity is claimed",
  };
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeModeTransformError("native-mode-transform:non-finite-input");
  }
}

export class NativeModeTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeModeTransformError";
  }
}
