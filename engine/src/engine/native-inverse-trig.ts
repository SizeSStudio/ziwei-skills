import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Compare0x195130,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";

export type NativeInverseTrigEvidenceContract = {
  pltAddresses: { atan2l: string; tanl: string };
  implementationBasis: {
    project: string;
    referenceTag: string;
    entryFiles: string[];
    coefficientFiles: string[];
  };
  supportedPaths: {
    atan2l: string;
    tanl: string;
  };
  note: string;
};

const MASK64 = (1n << 64n) - 1n;
const SIGN_MASK = 0x8000000000000000n;
const EXPONENT_MASK = 0x7fffn;
const EXPONENT_BIAS = 0x3fff;

const ZERO = bits(0x0000000000000000n, 0x0000000000000000n);
const ONE = bits(0x0000000000000000n, 0x3fff000000000000n);
const TWO = nativeIntToBinary128Bits(2);
const ONE_AND_HALF = nativeDoubleToBinary128Bits(1.5);
const SEVEN_SIXTEENTHS = nativeDoubleToBinary128Bits(7 / 16);
const ELEVEN_SIXTEENTHS = nativeDoubleToBinary128Bits(11 / 16);
const NINETEEN_SIXTEENTHS = nativeDoubleToBinary128Bits(19 / 16);
const THIRTY_NINE_SIXTEENTHS = nativeDoubleToBinary128Bits(39 / 16);
const PI_OVER_FOUR = bits(0x8469898cc51701b8n, 0x3ffe921fb54442d1n);
const PI = bits(0x8469898cc51701b8n, 0x4000921fb54442d1n);
const PI_LO = bits(0xa67cc74020bbea64n, 0x3f8dcd129024e088n);

const ATAN_HI: readonly NativeBinary128Bits[] = [
  bits(0xf68adfc88bd97875n, 0x3ffddac670561bb4n),
  bits(0x8469898cc51701b8n, 0x3ffe921fb54442d1n),
  bits(0xb200f10f5e197794n, 0x3ffef730bd281f69n),
  bits(0x8469898cc51701b8n, 0x3fff921fb54442d1n),
];

const ATAN_LO: readonly NativeBinary128Bits[] = [
  bits(0xc39be01c59e2dcddn, 0x3f89a06dc282b0e4n),
  bits(0xa67cc74020bbea64n, 0x3f8bcd129024e088n),
  bits(0x9f231bccae27916cn, 0xbf8bebe566c99adan),
  bits(0xa67cc74020bbea64n, 0x3f8ccd129024e088n),
];

const ATAN_COEFFICIENTS: readonly NativeBinary128Bits[] = [
  bits(0x5555555555555551n, 0x3ffd555555555555n),
  bits(0x999999999999149en, 0xbffc999999999999n),
  bits(0x2492492490794362n, 0x3ffc249249249249n),
  bits(0xc71c71c1c2afe323n, 0xbffbc71c71c71c71n),
  bits(0x5d174185b65d7596n, 0x3ffb745d1745d174n),
  bits(0x3b118c1975e2a610n, 0xbffb3b13b13b13b1n),
  bits(0x1057d0a538cad4f9n, 0x3ffb111111111111n),
  bits(0x889e87fc4c058330n, 0xbffae1e1e1e1e1e1n),
  bits(0x8e037b9171f0f80cn, 0x3ffaaf286bca1ae2n),
  bits(0x788a5cc72d12dd95n, 0xbffa861861861632n),
  bits(0xac8236dd04294b9bn, 0x3ffa642c8590766cn),
  bits(0x58f3e5a99bc9e94bn, 0xbffa47ae1475d4d4n),
  bits(0x459a07edd01df529n, 0x3ffa2f684b8258f7n),
  bits(0x51610294d6980dcen, 0xbffa1a7b9140f096n),
  bits(0xf2467423a0a86e23n, 0x3ffa0841d983c8efn),
  bits(0x79fdacd9a9394763n, 0xbff9f0781f2d5643n),
  bits(0xbeed38882f4e9337n, 0x3ff9d3feee0c8b8dn),
  bits(0x7c8bae68a03d216fn, 0xbff9ba14c1da11fbn),
  bits(0xe4a8f661ae4eefe2n, 0x3ff9a078fbebf61bn),
  bits(0x4d6ffec7d9a23d57n, 0xbff9812953610bd4n),
  bits(0xe119cf2d75d7c25bn, 0x3ff94f98eb1394een),
  bits(0xb137a0499210fd65n, 0xbff8fa3b3b6b7ae1n),
  bits(0x7dcf338d5eaa9ba0n, 0x3ff81b46e01727fcn),
  bits(0x85ce62c980d9f92cn, 0xbff652d94b4071ffn),
];

const TAN_T3 = bits(0x5555555555555553n, 0x3ffd555555555555n);
const TAN_ODD_R: readonly NativeBinary128Bits[] = [
  bits(0x1111111111111eb5n, 0x3ffc111111111111n),
  bits(0x9f32d6bbe09d8bcdn, 0x3ff9664f4882c10fn),
  bits(0xfb5fed8e84e27b37n, 0x3ff6d6d3d0e157ddn),
  bits(0x477dfcf726649efen, 0x3ff4355824803674n),
  bits(0x0ed942dfdc518d6cn, 0x3ff1967e18afcb18n),
  bits(0xc81be49eff7afd50n, 0x3fef0b132d39f055n),
  bits(0x13df38d0fbc00267n, 0x3fec5ef2daf21d11n),
  bits(0x0e0bdd701057dfe3n, 0x3fe9cd2a5a292b18n),
  bits(0x9a520f98f50081fcn, 0x3fe72f3190f4718an),
  nativeDoubleToBinary128Bits(0.000000011981013102001973),
  nativeDoubleToBinary128Bits(0.0000000034664378216909893),
  nativeDoubleToBinary128Bits(0.0000000029449552300483952),
  nativeDoubleToBinary128Bits(0.0000000015468200913196612),
  nativeDoubleToBinary128Bits(1.4912469681508012e-10),
];

const TAN_ODD_V: readonly NativeBinary128Bits[] = [
  bits(0xba1ba1ba1b694cd6n, 0x3ffaba1ba1ba1ba1n),
  bits(0xc8f5b4f5762322een, 0x3ff8226e355e6c23n),
  bits(0x2b5fce9ee7c2c92en, 0x3ff57da36452b75en),
  bits(0x6e0aceb716f614c2n, 0x3ff2f57d7734d165n),
  bits(0x5bc7e2aa79b9f2cdn, 0x3ff0497d8eea21e9n),
  bits(0xbfa2fbc1059d90b6n, 0x3fedb0f72d33eff7n),
  bits(0x4988cdaa04c96626n, 0x3feb1c77d6eac023n),
  bits(0xc01a31d0a6f7d518n, 0x3fe875c7357d0298n),
  nativeDoubleToBinary128Bits(0.000000028443389121318352),
  nativeDoubleToBinary128Bits(0.000000003830357804495807),
  nativeDoubleToBinary128Bits(-0.0000000015090641701997785),
  nativeDoubleToBinary128Bits(-0.0000000022006995706097711),
  nativeDoubleToBinary128Bits(-0.00000000061311613386849674),
];

export function nativeBinary128Tanl0x19a450(input: NativeBinary128Bits): NativeBinary128Bits {
  const normalized = normalize(input);
  assertFinite(normalized);
  if (rawExponent(normalized) === 0) {
    return normalized;
  }
  if (nativeBinary128Compare0x195130(absolute(normalized), PI_OVER_FOUR) >= 0) {
    throw new NativeInverseTrigError("native-inverse-trig:tanl-unported-argument-reduction");
  }
  return kernelTanDirect(normalized);
}

export function nativeBinary128Atan2l0x19a440(
  yInput: NativeBinary128Bits,
  xInput: NativeBinary128Bits,
): NativeBinary128Bits {
  const y = normalize(yInput);
  const x = normalize(xInput);
  assertFinite(y);
  assertFinite(x);

  if (sameBits(x, ONE)) {
    return nativeBinary128Atanl(y);
  }

  const yNegative = isNegative(y);
  const xNegative = isNegative(x);
  let quadrant = (yNegative ? 1 : 0) | (xNegative ? 2 : 0);

  if (isZero(y)) {
    if (!xNegative) {
      return y;
    }
    return yNegative ? negate(PI) : PI;
  }
  if (isZero(x)) {
    return yNegative ? negate(ATAN_HI[3]) : ATAN_HI[3];
  }

  const exponentDifference = rawExponent(y) - rawExponent(x);
  let angle: NativeBinary128Bits;
  if (exponentDifference > 115) {
    angle = nativeBinary128Add0x194c80(ATAN_HI[3], ATAN_LO[3]);
    quadrant &= 1;
  } else if (xNegative && exponentDifference < -115) {
    angle = ZERO;
  } else {
    const ratio = nativeBinary128Divide0x1952a0(y, x);
    angle = nativeBinary128Atanl(absolute(ratio));
  }

  switch (quadrant) {
    case 0:
      return angle;
    case 1:
      return negate(angle);
    case 2:
      return nativeBinary128Subtract0x196240(
        PI,
        nativeBinary128Subtract0x196240(angle, PI_LO),
      );
    default:
      return nativeBinary128Subtract0x196240(
        nativeBinary128Subtract0x196240(angle, PI_LO),
        PI,
      );
  }
}

export function nativeInverseTrigEvidenceContract(): NativeInverseTrigEvidenceContract {
  return {
    pltAddresses: { atan2l: "0x19a440", tanl: "0x19a450" },
    implementationBasis: {
      project: "AOSP bionic FreeBSD msun ld128",
      referenceTag: "android-12.0.0_r1",
      entryFiles: ["src/e_atan2l.c", "src/s_atanl.c", "src/s_tanl.c"],
      coefficientFiles: ["ld128/invtrig.c", "ld128/invtrig.h", "ld128/k_tanl.c"],
    },
    supportedPaths: {
      atan2l: "all finite binary128 inputs",
      tanl: "direct kernel for abs(input) < pi/4, the only path consumed by 0x184970",
    },
    note: "libm numeric dependency only; tanl medium/large argument reduction and chart parity are not claimed",
  };
}

function nativeBinary128Atanl(input: NativeBinary128Bits): NativeBinary128Bits {
  const normalized = normalize(input);
  const negative = isNegative(normalized);
  const exponent = rawExponent(normalized);
  if (exponent >= EXPONENT_BIAS + 113) {
    const angle = nativeBinary128Add0x194c80(ATAN_HI[3], ATAN_LO[3]);
    return negative ? negate(angle) : angle;
  }

  const magnitude = absolute(normalized);
  let reduced = normalized;
  let id = -1;
  if (nativeBinary128Compare0x195130(magnitude, SEVEN_SIXTEENTHS) < 0) {
    if (exponent < EXPONENT_BIAS - 56) {
      return normalized;
    }
  } else {
    reduced = magnitude;
    if (nativeBinary128Compare0x195130(reduced, NINETEEN_SIXTEENTHS) < 0) {
      if (nativeBinary128Compare0x195130(reduced, ELEVEN_SIXTEENTHS) < 0) {
        id = 0;
        reduced = nativeBinary128Divide0x1952a0(
          nativeBinary128Subtract0x196240(nativeBinary128Multiply0x195cd0(TWO, reduced), ONE),
          nativeBinary128Add0x194c80(TWO, reduced),
        );
      } else {
        id = 1;
        reduced = nativeBinary128Divide0x1952a0(
          nativeBinary128Subtract0x196240(reduced, ONE),
          nativeBinary128Add0x194c80(reduced, ONE),
        );
      }
    } else if (nativeBinary128Compare0x195130(reduced, THIRTY_NINE_SIXTEENTHS) < 0) {
      id = 2;
      reduced = nativeBinary128Divide0x1952a0(
        nativeBinary128Subtract0x196240(reduced, ONE_AND_HALF),
        nativeBinary128Add0x194c80(
          ONE,
          nativeBinary128Multiply0x195cd0(ONE_AND_HALF, reduced),
        ),
      );
    } else {
      id = 3;
      reduced = nativeBinary128Divide0x1952a0(negate(ONE), reduced);
    }
  }

  const square = nativeBinary128Multiply0x195cd0(reduced, reduced);
  const fourth = nativeBinary128Multiply0x195cd0(square, square);
  const even = nativeBinary128Multiply0x195cd0(square, horner(fourth, selectParity(0)));
  const odd = nativeBinary128Multiply0x195cd0(fourth, horner(fourth, selectParity(1)));
  const polynomial = nativeBinary128Add0x194c80(even, odd);

  if (id < 0) {
    return nativeBinary128Subtract0x196240(
      reduced,
      nativeBinary128Multiply0x195cd0(reduced, polynomial),
    );
  }

  const correction = nativeBinary128Subtract0x196240(
    nativeBinary128Multiply0x195cd0(reduced, polynomial),
    ATAN_LO[id],
  );
  const angle = nativeBinary128Subtract0x196240(
    ATAN_HI[id],
    nativeBinary128Subtract0x196240(correction, reduced),
  );
  return negative ? negate(angle) : angle;
}

function kernelTanDirect(x: NativeBinary128Bits): NativeBinary128Bits {
  const square = nativeBinary128Multiply0x195cd0(x, x);
  const fourth = nativeBinary128Multiply0x195cd0(square, square);
  const r = horner(fourth, TAN_ODD_R);
  const v = nativeBinary128Multiply0x195cd0(square, horner(fourth, TAN_ODD_V));
  const cubic = nativeBinary128Multiply0x195cd0(square, x);
  let correction = nativeBinary128Multiply0x195cd0(
    square,
    nativeBinary128Multiply0x195cd0(cubic, nativeBinary128Add0x194c80(r, v)),
  );
  correction = nativeBinary128Add0x194c80(
    correction,
    nativeBinary128Multiply0x195cd0(TAN_T3, cubic),
  );
  return nativeBinary128Add0x194c80(x, correction);
}

function selectParity(parity: 0 | 1): NativeBinary128Bits[] {
  const selected: NativeBinary128Bits[] = [];
  for (let index = parity; index < ATAN_COEFFICIENTS.length; index += 2) {
    selected.push(ATAN_COEFFICIENTS[index]);
  }
  return selected;
}

function horner(
  input: NativeBinary128Bits,
  coefficients: readonly NativeBinary128Bits[],
): NativeBinary128Bits {
  let result = coefficients[coefficients.length - 1];
  for (let index = coefficients.length - 2; index >= 0; index -= 1) {
    result = nativeBinary128Add0x194c80(
      coefficients[index],
      nativeBinary128Multiply0x195cd0(input, result),
    );
  }
  return result;
}

function assertFinite(input: NativeBinary128Bits): void {
  if (rawExponent(input) === Number(EXPONENT_MASK)) {
    throw new NativeInverseTrigError("native-inverse-trig:non-finite-input");
  }
}

function rawExponent(input: NativeBinary128Bits): number {
  return Number((input.high >> 48n) & EXPONENT_MASK);
}

function isNegative(input: NativeBinary128Bits): boolean {
  return (input.high & SIGN_MASK) !== 0n;
}

function isZero(input: NativeBinary128Bits): boolean {
  return (input.high & ~SIGN_MASK) === 0n && input.low === 0n;
}

function absolute(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low, high: input.high & ~SIGN_MASK };
}

function negate(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low, high: input.high ^ SIGN_MASK };
}

function sameBits(left: NativeBinary128Bits, right: NativeBinary128Bits): boolean {
  return left.low === right.low && left.high === right.high;
}

function normalize(input: NativeBinary128Bits): NativeBinary128Bits {
  return { low: input.low & MASK64, high: input.high & MASK64 };
}

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return Object.freeze({ low, high });
}

export class NativeInverseTrigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeInverseTrigError";
  }
}
