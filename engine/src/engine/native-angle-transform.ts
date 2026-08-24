import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Fmodl0x19a410,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import {
  nativeBinary128Atan2l0x19a440,
  nativeBinary128Tanl0x19a450,
} from "./native-inverse-trig";
import { nativeSeriesTransformTableZero0x183d40 } from "./native-series-transform";
import { nativeBinary128Cosl0x19a420, nativeBinary128Sinl0x19a430 } from "./native-trig";

export type NativeAngleTransformEvidenceContract = {
  function: { address: string; endExclusive: string };
  observedCaller: { functionAddress: string; callAddress: string };
  directHelpers: { address: string; callAddresses: string[] }[];
  doubleDerivedConstants: {
    arcsecondsPerRadian: number;
    baseCorrection: number;
    eccentricityDivisor: number;
  };
  characterizationVectorCount: number;
  note: string;
};

export type NativeAngleTransformTrace = {
  base: NativeBinary128Bits;
  nodeSineCorrection: NativeBinary128Bits;
  nodeCosineCorrection: NativeBinary128Bits;
  obliquity: NativeBinary128Bits;
  seriesBase: NativeBinary128Bits;
  seriesPlusPi: NativeBinary128Bits;
  eccentricityCorrection: NativeBinary128Bits;
  seriesPlusEccentricity: NativeBinary128Bits;
  series: NativeBinary128Bits;
  nutation: NativeBinary128Bits;
  numerator: NativeBinary128Bits;
  denominator: NativeBinary128Bits;
  angleModulo: NativeBinary128Bits;
  normalizedAngle: NativeBinary128Bits;
  correctedAngle: NativeBinary128Bits;
  baseMinusAngle: NativeBinary128Bits;
  resultModulo: NativeBinary128Bits;
  result: NativeBinary128Bits;
};

const ZERO = nativeIntToBinary128Bits(0);
const ONE = nativeIntToBinary128Bits(1);
const TWO_PI_DOUBLE = 2 * Math.PI;
const ARCSECONDS_PER_RADIAN_DOUBLE = 648000 / Math.PI;

const PI = nativeDoubleToBinary128Bits(Math.PI);
const NEGATIVE_PI = nativeDoubleToBinary128Bits(-Math.PI);
const TWO_PI = nativeDoubleToBinary128Bits(TWO_PI_DOUBLE);
const ARCSECONDS_PER_RADIAN = nativeDoubleToBinary128Bits(ARCSECONDS_PER_RADIAN_DOUBLE);
const BASE_CORRECTION = nativeDoubleToBinary128Bits(20.5 / ARCSECONDS_PER_RADIAN_DOUBLE);
const ECCENTRICITY_DIVISOR = ARCSECONDS_PER_RADIAN;
const BILLION = nativeIntToBinary128Bits(1_000_000_000);

const INITIAL_CONSTANT = nativeIntToBinary128Bits(0x6883d4be);
const INITIAL_LINEAR = nativeDoubleToBinary128Bits(628331965331.80005);
const INITIAL_QUADRATIC = nativeDoubleToBinary128Bits(5296.74);
const INITIAL_CUBIC = nativeDoubleToBinary128Bits(0.432);
const INITIAL_QUARTIC = nativeDoubleToBinary128Bits(0.1124);
const INITIAL_QUINTIC = nativeDoubleToBinary128Bits(0.00009);

const NODE_BASE = nativeDoubleToBinary128Bits(2.1824);
const NODE_LINEAR = nativeDoubleToBinary128Bits(33.75705);
const NODE_SINE_SCALE = nativeDoubleToBinary128Bits(-17.2);
const NODE_COSINE_SCALE = nativeDoubleToBinary128Bits(9.2);

const OBLIQUITY_BASE = nativeDoubleToBinary128Bits(84381.406);
const OBLIQUITY_LINEAR = nativeDoubleToBinary128Bits(46.836769);
const OBLIQUITY_QUADRATIC = nativeDoubleToBinary128Bits(0.0001831);
const OBLIQUITY_CUBIC = nativeDoubleToBinary128Bits(0.0020034);
const OBLIQUITY_QUARTIC = nativeDoubleToBinary128Bits(0.000000576);
const OBLIQUITY_QUINTIC = nativeDoubleToBinary128Bits(0.0000000434);

const ECCENTRICITY_PHASE_BASE = nativeDoubleToBinary128Bits(-0.043126);
const ECCENTRICITY_PHASE_LINEAR = nativeDoubleToBinary128Bits(628.301955);
const ECCENTRICITY_PHASE_QUADRATIC = nativeDoubleToBinary128Bits(0.000002732);
const ECCENTRICITY_AMPLITUDE_BASE = nativeDoubleToBinary128Bits(0.016708634);
const ECCENTRICITY_AMPLITUDE_LINEAR = nativeDoubleToBinary128Bits(0.000042037);
const ECCENTRICITY_AMPLITUDE_QUADRATIC = nativeDoubleToBinary128Bits(0.0000001267);
const ECCENTRICITY_SCALE = nativeDoubleToBinary128Bits(-20.49552);

const NUTATION_TERMS: readonly {
  amplitude: NativeBinary128Bits;
  phase: NativeBinary128Bits;
  frequency: NativeBinary128Bits;
}[] = [
  {
    amplitude: nativeIntToBinary128Bits(0x0aec),
    phase: nativeDoubleToBinary128Bits(3.1987),
    frequency: nativeDoubleToBinary128Bits(8433.46616),
  },
  {
    amplitude: nativeIntToBinary128Bits(0x03f8),
    phase: nativeDoubleToBinary128Bits(5.4225),
    frequency: nativeDoubleToBinary128Bits(550.75532),
  },
  {
    amplitude: nativeIntToBinary128Bits(0x0324),
    phase: nativeDoubleToBinary128Bits(3.88),
    frequency: nativeDoubleToBinary128Bits(522.3694),
  },
];

export function nativeAngleTransform0x184970(input: NativeBinary128Bits): NativeBinary128Bits {
  return computeNativeAngleTransform0x184970(input);
}

export function traceNativeAngleTransform0x184970(input: NativeBinary128Bits): NativeAngleTransformTrace {
  const trace = {} as NativeAngleTransformTrace;
  computeNativeAngleTransform0x184970(input, trace);
  return trace;
}

function computeNativeAngleTransform0x184970(
  input: NativeBinary128Bits,
  trace?: NativeAngleTransformTrace,
): NativeBinary128Bits {
  assertFinite(input);

  const square = nativeBinary128Multiply0x195cd0(input, input);
  const cube = nativeBinary128Multiply0x195cd0(square, input);
  const fourth = nativeBinary128Multiply0x195cd0(cube, input);
  const fifth = nativeBinary128Multiply0x195cd0(fourth, input);

  let initial = INITIAL_CONSTANT;
  initial = addProduct(initial, INITIAL_LINEAR, input);
  initial = addProduct(initial, INITIAL_QUADRATIC, square);
  initial = addProduct(initial, INITIAL_CUBIC, cube);
  initial = subtractProduct(initial, INITIAL_QUARTIC, fourth);
  initial = subtractProduct(initial, INITIAL_QUINTIC, fifth);
  initial = nativeBinary128Divide0x1952a0(initial, BILLION);
  initial = nativeBinary128Add0x194c80(initial, PI);
  const base = nativeBinary128Subtract0x196240(initial, BASE_CORRECTION);
  if (trace) trace.base = base;

  const nodeAngle = nativeBinary128Subtract0x196240(
    NODE_BASE,
    nativeBinary128Multiply0x195cd0(NODE_LINEAR, input),
  );
  const nodeSineCorrection = nativeBinary128Divide0x1952a0(
    nativeBinary128Multiply0x195cd0(NODE_SINE_SCALE, nativeBinary128Sinl0x19a430(nodeAngle)),
    ARCSECONDS_PER_RADIAN,
  );
  const nodeCosineCorrection = nativeBinary128Divide0x1952a0(
    nativeBinary128Multiply0x195cd0(NODE_COSINE_SCALE, nativeBinary128Cosl0x19a420(nodeAngle)),
    ARCSECONDS_PER_RADIAN,
  );
  if (trace) {
    trace.nodeSineCorrection = nodeSineCorrection;
    trace.nodeCosineCorrection = nodeCosineCorrection;
  }

  let obliquity = OBLIQUITY_BASE;
  obliquity = subtractProduct(obliquity, OBLIQUITY_LINEAR, input);
  obliquity = subtractProduct(obliquity, OBLIQUITY_QUADRATIC, square);
  obliquity = addProduct(obliquity, OBLIQUITY_CUBIC, cube);
  obliquity = subtractProduct(obliquity, OBLIQUITY_QUARTIC, fourth);
  obliquity = subtractProduct(obliquity, OBLIQUITY_QUINTIC, fifth);
  obliquity = nativeBinary128Divide0x1952a0(obliquity, ARCSECONDS_PER_RADIAN);
  obliquity = nativeBinary128Add0x194c80(obliquity, nodeCosineCorrection);
  if (trace) trace.obliquity = obliquity;

  let series = nativeSeriesTransformTableZero0x183d40(input, 50);
  if (trace) trace.seriesBase = series;
  series = nativeBinary128Add0x194c80(series, PI);
  if (trace) trace.seriesPlusPi = series;
  const eccentricity = eccentricityCorrection(input, square);
  if (trace) trace.eccentricityCorrection = eccentricity;
  series = nativeBinary128Add0x194c80(series, eccentricity);
  if (trace) trace.seriesPlusEccentricity = series;
  series = nativeBinary128Add0x194c80(series, nodeSineCorrection);
  if (trace) trace.series = series;

  let nutation = ZERO;
  for (const term of NUTATION_TERMS) {
    const angle = nativeBinary128Add0x194c80(
      term.phase,
      nativeBinary128Multiply0x195cd0(term.frequency, input),
    );
    nutation = nativeBinary128Add0x194c80(
      nutation,
      nativeBinary128Multiply0x195cd0(term.amplitude, nativeBinary128Cosl0x19a420(angle)),
    );
  }
  nutation = nativeBinary128Divide0x1952a0(negate(nutation), BILLION);
  if (trace) trace.nutation = nutation;

  const numerator = nativeBinary128Subtract0x196240(
    nativeBinary128Multiply0x195cd0(
      nativeBinary128Sinl0x19a430(series),
      nativeBinary128Cosl0x19a420(obliquity),
    ),
    nativeBinary128Multiply0x195cd0(
      nativeBinary128Tanl0x19a450(nutation),
      nativeBinary128Sinl0x19a430(obliquity),
    ),
  );
  const denominator = nativeBinary128Cosl0x19a420(series);
  if (trace) {
    trace.numerator = numerator;
    trace.denominator = denominator;
  }
  let angle = nativeBinary128Fmodl0x19a410(
    nativeBinary128Atan2l0x19a440(numerator, denominator),
    TWO_PI,
  );
  if (trace) trace.angleModulo = angle;
  if (nativeBinary128Compare0x195130(angle, ZERO) < 0) {
    angle = nativeBinary128Add0x194c80(angle, TWO_PI);
  }
  if (trace) trace.normalizedAngle = angle;

  const correctedAngle = nativeBinary128Subtract0x196240(
    angle,
    nativeBinary128Multiply0x195cd0(
      nodeSineCorrection,
      nativeBinary128Cosl0x19a420(obliquity),
    ),
  );
  if (trace) trace.correctedAngle = correctedAngle;
  let result = nativeBinary128Subtract0x196240(base, correctedAngle);
  if (trace) trace.baseMinusAngle = result;
  result = nativeBinary128Fmodl0x19a410(result, TWO_PI);
  if (trace) trace.resultModulo = result;
  if (nativeBinary128Compare0x195130(result, NEGATIVE_PI) <= 0) {
    result = nativeBinary128Add0x194c80(result, TWO_PI);
  } else if (nativeBinary128Compare0x1951f0(result, PI) > 0) {
    result = nativeBinary128Subtract0x196240(result, TWO_PI);
  }
  const dividedResult = nativeBinary128Divide0x1952a0(result, TWO_PI);
  if (trace) trace.result = dividedResult;
  return dividedResult;
}

export function nativeAngleTransformEvidenceContract(): NativeAngleTransformEvidenceContract {
  return {
    function: { address: "0x184970", endExclusive: "0x185152" },
    observedCaller: { functionAddress: "0x14dbd0", callAddress: "0x14df07" },
    directHelpers: [
      { address: "0x183d40", callAddresses: ["0x184ca3"] },
      { address: "0x19a410", callAddresses: ["0x184ff7", "0x18508d"] },
      { address: "0x19a420", callAddresses: ["0x184b91", "0x184db8", "0x184e61", "0x184eb7", "0x184f19", "0x184f6c", "0x184f8c", "0x185043"] },
      { address: "0x19a430", callAddresses: ["0x184b49", "0x184f5f", "0x184f7c"] },
      { address: "0x19a440", callAddresses: ["0x184fc3"] },
      { address: "0x19a450", callAddresses: ["0x184fa5"] },
    ],
    doubleDerivedConstants: {
      arcsecondsPerRadian: ARCSECONDS_PER_RADIAN_DOUBLE,
      baseCorrection: 20.5 / ARCSECONDS_PER_RADIAN_DOUBLE,
      eccentricityDivisor: ARCSECONDS_PER_RADIAN_DOUBLE,
    },
    characterizationVectorCount: 4,
    note: "binary128 astronomy helper only; no 0x14dbd0 output, calendar, or chart parity is claimed",
  };
}

function eccentricityCorrection(
  input: NativeBinary128Bits,
  square: NativeBinary128Bits,
): NativeBinary128Bits {
  let phase = addProduct(ECCENTRICITY_PHASE_BASE, ECCENTRICITY_PHASE_LINEAR, input);
  phase = subtractProduct(phase, ECCENTRICITY_PHASE_QUADRATIC, square);

  let amplitude = subtractProduct(ECCENTRICITY_AMPLITUDE_BASE, ECCENTRICITY_AMPLITUDE_LINEAR, input);
  amplitude = subtractProduct(amplitude, ECCENTRICITY_AMPLITUDE_QUADRATIC, square);

  let correction = nativeBinary128Multiply0x195cd0(amplitude, nativeBinary128Cosl0x19a420(phase));
  correction = nativeBinary128Add0x194c80(ONE, correction);
  correction = nativeBinary128Multiply0x195cd0(ECCENTRICITY_SCALE, correction);
  return nativeBinary128Divide0x1952a0(correction, ECCENTRICITY_DIVISOR);
}

function addProduct(
  accumulator: NativeBinary128Bits,
  coefficient: NativeBinary128Bits,
  value: NativeBinary128Bits,
): NativeBinary128Bits {
  return nativeBinary128Add0x194c80(
    accumulator,
    nativeBinary128Multiply0x195cd0(coefficient, value),
  );
}

function subtractProduct(
  accumulator: NativeBinary128Bits,
  coefficient: NativeBinary128Bits,
  value: NativeBinary128Bits,
): NativeBinary128Bits {
  return nativeBinary128Subtract0x196240(
    accumulator,
    nativeBinary128Multiply0x195cd0(coefficient, value),
  );
}

function negate(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low, high: input.high ^ 0x8000000000000000n };
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeAngleTransformError("native-angle-transform:non-finite-input");
  }
}

export class NativeAngleTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeAngleTransformError";
  }
}
