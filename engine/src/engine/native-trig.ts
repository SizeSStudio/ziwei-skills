import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Compare0x195130,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";

export type NativeTrigEvidenceContract = {
  pltAddresses: { cosl: string; sinl: string };
  implementationBasis: {
    project: string;
    referenceTag: string;
    entryFiles: string[];
    kernelFiles: string[];
  };
  supportedArgumentReduction: {
    kind: string;
    quotientRange: string;
    rounding: string;
  };
  validation: {
    independentReference: string;
    exactBinary128Vectors: number;
    exactMathematicalVectorPairs: number;
    maximumMathematicalUlpDistance: number;
    maximumCharacterizedMagnitude: number;
  };
  note: string;
};

const MASK64 = (1n << 64n) - 1n;
const SIGN_MASK = 0x8000000000000000n;
const HIGH_FRACTION_MASK = 0xffffffffffffn;
const EXPONENT_MASK = 0x7fffn;
const EXPONENT_BIAS = 0x3fff;

const ZERO = bits(0x0000000000000000n, 0x0000000000000000n);
const ONE = bits(0x0000000000000000n, 0x3fff000000000000n);
const HALF = nativeDoubleToBinary128Bits(0.5);
const PI_OVER_FOUR = bits(0x8469898cc51701b8n, 0x3ffe921fb54442d1n);

const INV_PI_OVER_TWO = bits(0x2a53f84eafa3ea6an, 0x3ffe45f306dc9c88n);
const PI_OVER_TWO_1 = bits(0x8469800000000000n, 0x3fff921fb54442d1n);
const PI_OVER_TWO_1_TAIL = bits(0x344a4093822299f3n, 0x3fba3198a2e03707n);
const PI_OVER_TWO_2 = bits(0x344a400000000000n, 0x3fba3198a2e03707n);
const PI_OVER_TWO_2_TAIL = bits(0x0105df531d89cd91n, 0x3f7127044533e63an);
const PI_OVER_TWO_3 = bits(0x0105e00000000000n, 0x3f7127044533e63an);
const PI_OVER_TWO_3_TAIL = bits(0xb5f78671cbfb2210n, 0xbf2859c4ec64ddaen);

const COS_COEFFICIENTS: readonly NativeBinary128Bits[] = [
  bits(0x5555555555555548n, 0x3ffa555555555555n),
  bits(0x6c16c16c16bf5c98n, 0xbff56c16c16c16c1n),
  bits(0xa01a019fffc4b13dn, 0x3fefa01a01a01a01n),
  bits(0xc72eef94869cac2an, 0xbfe927e4fb7789f5n),
  bits(0x7b51b5f62ea9599an, 0x3fe21eed8eff8d89n),
  bits(0xc2a38fc44bbc8df5n, 0xbfda93974a8c07c9n),
  bits(0xdda73725a8cb76c2n, 0x3fd2ae7f3e733b48n),
  nativeDoubleToBinary128Bits(-0.1561920696721507929516718307820958119868e-15),
  nativeDoubleToBinary128Bits(0.4110317413744594971475941557607804508039e-18),
  nativeDoubleToBinary128Bits(-0.8896592467191938803288521958313920156409e-21),
  nativeDoubleToBinary128Bits(0.1601061435794535138244346256065192782581e-23),
];

const SIN_COEFFICIENTS: readonly NativeBinary128Bits[] = [
  bits(0x5555555555555555n, 0xbffc555555555555n),
  bits(0x111111111111107fn, 0x3ff8111111111111n),
  bits(0xa01a01a019f8f785n, 0xbff2a01a01a01a01n),
  bits(0x38faac1c557167fen, 0x3fec71de3a556c73n),
  bits(0x38fe73426974ae93n, 0xbfe5ae64567f544en),
  bits(0x97c5c00cfa3d6509n, 0x3fde6124613a86d0n),
  bits(0xdc97972aded68d8dn, 0xbfd6ae7f3e733b81n),
  bits(0x9d8ab423f5c47870n, 0x3fce952c77030a96n),
  nativeDoubleToBinary128Bits(-0.82206352458348947812512122163446202498005154296863e-17),
  nativeDoubleToBinary128Bits(0.19572940011906109418080609928334380560135358385256e-19),
  nativeDoubleToBinary128Bits(-0.38680813379701966970673724299207480965452616911420e-22),
  nativeDoubleToBinary128Bits(0.64038150078671872796678569586315881020659912139412e-25),
];

export function nativeBinary128Cosl0x19a420(input: NativeBinary128Bits): NativeBinary128Bits {
  const normalized = normalize(input);
  assertSupportedFinite(normalized);
  const magnitude = absolute(normalized);

  if (rawExponent(magnitude) === 0) {
    return ONE;
  }
  if (nativeBinary128Compare0x195130(magnitude, PI_OVER_FOUR) < 0) {
    return kernelCosl(magnitude, ZERO);
  }

  const reduced = reducePiOverTwoMedium(normalized);
  switch (reduced.quotient & 3) {
    case 0:
      return kernelCosl(reduced.high, reduced.low);
    case 1:
      return negate(kernelSinl(reduced.high, reduced.low, true));
    case 2:
      return negate(kernelCosl(reduced.high, reduced.low));
    default:
      return kernelSinl(reduced.high, reduced.low, true);
  }
}

export function nativeBinary128Sinl0x19a430(input: NativeBinary128Bits): NativeBinary128Bits {
  const normalized = normalize(input);
  assertSupportedFinite(normalized);
  const negative = (normalized.high & SIGN_MASK) !== 0n;
  const magnitude = absolute(normalized);

  if (rawExponent(magnitude) === 0) {
    return normalized;
  }
  if (nativeBinary128Compare0x195130(magnitude, PI_OVER_FOUR) < 0) {
    const direct = kernelSinl(magnitude, ZERO, false);
    return negative ? negate(direct) : direct;
  }

  const reduced = reducePiOverTwoMedium(normalized);
  switch (reduced.quotient & 3) {
    case 0:
      return kernelSinl(reduced.high, reduced.low, true);
    case 1:
      return kernelCosl(reduced.high, reduced.low);
    case 2:
      return negate(kernelSinl(reduced.high, reduced.low, true));
    default:
      return negate(kernelCosl(reduced.high, reduced.low));
  }
}

export function nativeTrigEvidenceContract(): NativeTrigEvidenceContract {
  return {
    pltAddresses: { cosl: "0x19a420", sinl: "0x19a430" },
    implementationBasis: {
      project: "AOSP bionic FreeBSD msun ld128",
      referenceTag: "android-12.0.0_r1",
      entryFiles: ["src/s_cosl.c", "src/s_sinl.c"],
      kernelFiles: ["ld128/k_cosl.c", "ld128/k_sinl.c", "ld128/e_rem_pio2l.h"],
    },
    supportedArgumentReduction: {
      kind: "medium",
      quotientRange: "signed-int32",
      rounding: "binary128 round-to-nearest-even",
    },
    validation: {
      independentReference: "mpmath-1.3.0-250-decimal-digits",
      exactBinary128Vectors: 10,
      exactMathematicalVectorPairs: 8,
      maximumMathematicalUlpDistance: 1,
      maximumCharacterizedMagnitude: 400000000,
    },
    note: "libm numeric dependency only; no calendar, astrology, 0x183d40, 0x186e40, or chart parity is claimed",
  };
}

function reducePiOverTwoMedium(input: NativeBinary128Bits): {
  quotient: number;
  high: NativeBinary128Bits;
  low: NativeBinary128Bits;
} {
  const quotient = roundNearestEvenInt32(nativeBinary128Multiply0x195cd0(input, INV_PI_OVER_TWO));
  const fn = nativeIntToBinary128Bits(quotient);
  const inputExponent = rawExponent(absolute(input));

  let r = nativeBinary128Subtract0x196240(input, nativeBinary128Multiply0x195cd0(fn, PI_OVER_TWO_1));
  let w = nativeBinary128Multiply0x195cd0(fn, PI_OVER_TWO_1_TAIL);
  let high = nativeBinary128Subtract0x196240(r, w);

  if (inputExponent - rawExponent(absolute(high)) > 51) {
    const previousR = r;
    w = nativeBinary128Multiply0x195cd0(fn, PI_OVER_TWO_2);
    r = nativeBinary128Subtract0x196240(previousR, w);
    const cancellation = nativeBinary128Subtract0x196240(
      nativeBinary128Subtract0x196240(previousR, r),
      w,
    );
    w = nativeBinary128Subtract0x196240(
      nativeBinary128Multiply0x195cd0(fn, PI_OVER_TWO_2_TAIL),
      cancellation,
    );
    high = nativeBinary128Subtract0x196240(r, w);

    if (inputExponent - rawExponent(absolute(high)) > 119) {
      const secondPreviousR = r;
      w = nativeBinary128Multiply0x195cd0(fn, PI_OVER_TWO_3);
      r = nativeBinary128Subtract0x196240(secondPreviousR, w);
      const secondCancellation = nativeBinary128Subtract0x196240(
        nativeBinary128Subtract0x196240(secondPreviousR, r),
        w,
      );
      w = nativeBinary128Subtract0x196240(
        nativeBinary128Multiply0x195cd0(fn, PI_OVER_TWO_3_TAIL),
        secondCancellation,
      );
      high = nativeBinary128Subtract0x196240(r, w);
    }
  }

  const low = nativeBinary128Subtract0x196240(nativeBinary128Subtract0x196240(r, high), w);
  return { quotient, high, low };
}

function kernelCosl(x: NativeBinary128Bits, y: NativeBinary128Bits): NativeBinary128Bits {
  const z = nativeBinary128Multiply0x195cd0(x, x);
  const polynomial = horner(z, COS_COEFFICIENTS);
  const r = nativeBinary128Multiply0x195cd0(z, polynomial);
  const halfZ = nativeBinary128Multiply0x195cd0(HALF, z);
  const w = nativeBinary128Subtract0x196240(ONE, halfZ);
  const roundingCorrection = nativeBinary128Subtract0x196240(
    nativeBinary128Subtract0x196240(ONE, w),
    halfZ,
  );
  const polynomialCorrection = nativeBinary128Subtract0x196240(
    nativeBinary128Multiply0x195cd0(z, r),
    nativeBinary128Multiply0x195cd0(x, y),
  );
  return nativeBinary128Add0x194c80(
    w,
    nativeBinary128Add0x194c80(roundingCorrection, polynomialCorrection),
  );
}

function kernelSinl(
  x: NativeBinary128Bits,
  y: NativeBinary128Bits,
  hasTail: boolean,
): NativeBinary128Bits {
  const z = nativeBinary128Multiply0x195cd0(x, x);
  const v = nativeBinary128Multiply0x195cd0(z, x);
  const remainder = horner(z, SIN_COEFFICIENTS.slice(1));

  if (!hasTail) {
    return nativeBinary128Add0x194c80(
      x,
      nativeBinary128Multiply0x195cd0(
        v,
        nativeBinary128Add0x194c80(SIN_COEFFICIENTS[0], nativeBinary128Multiply0x195cd0(z, remainder)),
      ),
    );
  }

  const halfYMinusVR = nativeBinary128Subtract0x196240(
    nativeBinary128Multiply0x195cd0(HALF, y),
    nativeBinary128Multiply0x195cd0(v, remainder),
  );
  const correctedTail = nativeBinary128Subtract0x196240(
    nativeBinary128Subtract0x196240(nativeBinary128Multiply0x195cd0(z, halfYMinusVR), y),
    nativeBinary128Multiply0x195cd0(v, SIN_COEFFICIENTS[0]),
  );
  return nativeBinary128Subtract0x196240(x, correctedTail);
}

function horner(z: NativeBinary128Bits, coefficients: readonly NativeBinary128Bits[]): NativeBinary128Bits {
  let result = coefficients[coefficients.length - 1];
  for (let index = coefficients.length - 2; index >= 0; index -= 1) {
    result = nativeBinary128Add0x194c80(
      coefficients[index],
      nativeBinary128Multiply0x195cd0(z, result),
    );
  }
  return result;
}

function roundNearestEvenInt32(input: NativeBinary128Bits): number {
  const exponent = rawExponent(absolute(input));
  if (exponent === 0) {
    return 0;
  }

  const unbiasedExponent = exponent - EXPONENT_BIAS;
  const fraction = ((input.high & HIGH_FRACTION_MASK) << 64n) | input.low;
  const mantissa = (1n << 112n) | fraction;
  let magnitude: bigint;

  if (unbiasedExponent < -1) {
    magnitude = 0n;
  } else if (unbiasedExponent >= 112) {
    magnitude = mantissa << BigInt(unbiasedExponent - 112);
  } else {
    const shift = 112 - unbiasedExponent;
    const shiftBits = BigInt(shift);
    magnitude = mantissa >> shiftBits;
    const remainder = mantissa & ((1n << shiftBits) - 1n);
    const midpoint = 1n << (shiftBits - 1n);
    if (remainder > midpoint || (remainder === midpoint && (magnitude & 1n) === 1n)) {
      magnitude += 1n;
    }
  }

  const signed = (input.high & SIGN_MASK) !== 0n ? -magnitude : magnitude;
  if (signed < -0x80000000n || signed > 0x7fffffffn) {
    throw new NativeTrigError("native-trig:unsupported-large-argument-reduction");
  }
  return Number(signed);
}

function assertSupportedFinite(input: NativeBinary128Bits): void {
  if (rawExponent(input) === Number(EXPONENT_MASK)) {
    throw new NativeTrigError("native-trig:non-finite-input");
  }
}

function rawExponent(input: NativeBinary128Bits): number {
  return Number((input.high >> 48n) & EXPONENT_MASK);
}

function absolute(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low, high: input.high & ~SIGN_MASK };
}

function negate(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low, high: input.high ^ SIGN_MASK };
}

function normalize(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low & MASK64, high: input.high & MASK64 };
}

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return Object.freeze({ low, high });
}

export class NativeTrigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeTrigError";
  }
}
