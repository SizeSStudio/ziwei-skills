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
import { nativeBinary128Cosl0x19a420, nativeBinary128Sinl0x19a430 } from "./native-trig";

export type NativeIteratedCorrectionEvidenceContract = {
  function: { address: string; endExclusive: string };
  observedCallers: string[];
  iterations: Array<{
    precision: number;
    seriesCallAddress: string;
    periodicCorrectionCallAddress: string;
    sinlCallAddresses: string[];
    coslCallAddress: string;
  }>;
  normalizationConstants: {
    periodAddress: string;
    offsetAddress: string;
    piAddress: string;
  };
  characterizationVectorCount: number;
  note: string;
};

const PERIOD = nativeDoubleToBinary128Bits(628.3319653318);
const INITIAL_OFFSET = nativeDoubleToBinary128Bits(1.75347);
const PI = nativeDoubleToBinary128Bits(Math.PI);
const FREQUENCY = nativeDoubleToBinary128Bits(628.307585);
const FINAL_CORRECTION_DIVISOR = nativeDoubleToBinary128Bits(648000 / Math.PI);

const DENOMINATOR_BASE = nativeDoubleToBinary128Bits(628.332);
const DENOMINATOR_PHASE_1 = nativeDoubleToBinary128Bits(1.527);
const DENOMINATOR_PHASE_2 = nativeDoubleToBinary128Bits(1.48);
const DENOMINATOR_PHASE_3 = nativeDoubleToBinary128Bits(5.82);
const DENOMINATOR_PHASE_4 = nativeDoubleToBinary128Bits(4.21);
const DENOMINATOR_AMPLITUDE_1 = nativeIntToBinary128Bits(21);
const DENOMINATOR_AMPLITUDE_2 = nativeDoubleToBinary128Bits(0.44);
const DENOMINATOR_AMPLITUDE_3 = nativeDoubleToBinary128Bits(0.129);
const DENOMINATOR_AMPLITUDE_4 = nativeDoubleToBinary128Bits(0.00055);
const TWO = nativeIntToBinary128Bits(2);
const ONE = nativeIntToBinary128Bits(1);

const COSINE_PHASE_BASE = nativeDoubleToBinary128Bits(-0.043126);
const COSINE_PHASE_LINEAR = nativeDoubleToBinary128Bits(628.301955);
const COSINE_PHASE_QUADRATIC = nativeDoubleToBinary128Bits(0.000002732);
const COSINE_AMPLITUDE_BASE = nativeDoubleToBinary128Bits(0.016708634);
const COSINE_AMPLITUDE_LINEAR = nativeDoubleToBinary128Bits(0.000042037);
const COSINE_AMPLITUDE_QUADRATIC = nativeDoubleToBinary128Bits(0.0000001267);
const COSINE_SCALE = nativeDoubleToBinary128Bits(-20.49552);

export function nativeIteratedCorrection0x1861d0(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFinite(input);
  let normalized = nativeBinary128Subtract0x196240(input, INITIAL_OFFSET);
  normalized = nativeBinary128Subtract0x196240(normalized, PI);
  normalized = nativeBinary128Divide0x1952a0(normalized, PERIOD);
  normalized = correctionPass(input, normalized, 10);
  return correctionPass(input, normalized, -1);
}

export function nativeIteratedCorrectionEvidenceContract(): NativeIteratedCorrectionEvidenceContract {
  return {
    function: { address: "0x1861d0", endExclusive: "0x1868d2" },
    observedCallers: ["0x14b3a8", "0x14b698", "0x14d085", "0x14d448", "0x18197b"],
    iterations: [
      {
        precision: 10,
        seriesCallAddress: "0x1863cc",
        periodicCorrectionCallAddress: "0x1863d9",
        sinlCallAddresses: ["0x186282", "0x1862e7", "0x18632f", "0x186380"],
        coslCallAddress: "0x1864dd",
      },
      {
        precision: -1,
        seriesCallAddress: "0x18671c",
        periodicCorrectionCallAddress: "0x186729",
        sinlCallAddresses: ["0x1865d2", "0x186637", "0x18667f", "0x1866d0"],
        coslCallAddress: "0x186830",
      },
    ],
    normalizationConstants: {
      periodAddress: "0x832d8",
      offsetAddress: "0x837a0",
      piAddress: "0x837d0",
    },
    characterizationVectorCount: 5,
    note: "iterated numeric correction only; no 0x181490, calendar, astrology, or chart parity is claimed",
  };
}

function correctionPass(
  originalInput: NativeBinary128Bits,
  normalizedInput: NativeBinary128Bits,
  precision: number,
): NativeBinary128Bits {
  const denominator = periodicDenominator(normalizedInput);
  let combinedCorrection = nativeSeriesTransformTableZero0x183d40(normalizedInput, precision);
  combinedCorrection = nativeBinary128Add0x194c80(
    combinedCorrection,
    nativePeriodicCorrection0x1838a0(normalizedInput),
  );
  combinedCorrection = nativeBinary128Add0x194c80(
    combinedCorrection,
    cosineCorrection(normalizedInput),
  );
  combinedCorrection = nativeBinary128Add0x194c80(combinedCorrection, PI);

  let residual = nativeBinary128Subtract0x196240(originalInput, combinedCorrection);
  residual = nativeBinary128Divide0x1952a0(residual, denominator);
  return nativeBinary128Add0x194c80(normalizedInput, residual);
}

function periodicDenominator(input: NativeBinary128Bits): NativeBinary128Bits {
  const frequencyInput = nativeBinary128Multiply0x195cd0(FREQUENCY, input);
  let denominator = nativeBinary128Add0x194c80(
    DENOMINATOR_BASE,
    nativeBinary128Multiply0x195cd0(
      DENOMINATOR_AMPLITUDE_1,
      nativeBinary128Sinl0x19a430(nativeBinary128Add0x194c80(DENOMINATOR_PHASE_1, frequencyInput)),
    ),
  );

  const doubledFrequency = nativeBinary128Multiply0x195cd0(TWO, frequencyInput);
  denominator = nativeBinary128Add0x194c80(
    denominator,
    nativeBinary128Multiply0x195cd0(
      DENOMINATOR_AMPLITUDE_2,
      nativeBinary128Sinl0x19a430(nativeBinary128Add0x194c80(DENOMINATOR_PHASE_2, doubledFrequency)),
    ),
  );

  let thirdTerm = nativeBinary128Multiply0x195cd0(
    DENOMINATOR_AMPLITUDE_3,
    nativeBinary128Sinl0x19a430(nativeBinary128Add0x194c80(DENOMINATOR_PHASE_3, frequencyInput)),
  );
  thirdTerm = nativeBinary128Multiply0x195cd0(thirdTerm, input);
  denominator = nativeBinary128Add0x194c80(denominator, thirdTerm);

  let fourthTerm = nativeBinary128Multiply0x195cd0(
    DENOMINATOR_AMPLITUDE_4,
    nativeBinary128Sinl0x19a430(nativeBinary128Add0x194c80(DENOMINATOR_PHASE_4, frequencyInput)),
  );
  fourthTerm = nativeBinary128Multiply0x195cd0(fourthTerm, input);
  fourthTerm = nativeBinary128Multiply0x195cd0(fourthTerm, input);
  return nativeBinary128Add0x194c80(denominator, fourthTerm);
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

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeIteratedCorrectionError("native-iterated-correction:non-finite-input");
  }
}

export class NativeIteratedCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeIteratedCorrectionError";
  }
}
