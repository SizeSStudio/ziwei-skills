export type NativeBinary128Bits = {
  low: bigint;
  high: bigint;
};

export type NativeBinary128Comparison = -1 | 0 | 1;

type NativeBinary128FiniteParts = {
  sign: boolean;
  mantissa: bigint;
  binaryPower: number;
};

export type NativeBinary128HelperContracts = {
  representation: {
    exponentBits: number;
    fractionBits: number;
    exponentBias: number;
    signMask: bigint;
    exponentMask: bigint;
    highFractionMask: bigint;
  };
  conversions: {
    doubleToBinary128Address: string;
    binary128ToInt32Address: string;
    binary128ToUint64Address: string;
    int32ToBinary128Address: string;
    binary128ToDoubleAddress: string;
  };
  arithmetic: {
    addAddress: string;
    subtractWrapperAddress: string;
    multiplyAddress: string;
    divideAddress: string;
    compareHelperAddresses: string[];
    libmLongDoubleStubs: {
      floorl: string;
      fmodl: string;
      cosl: string;
      sinl: string;
      atan2l: string;
      tanl: string;
    };
    portedLibmLongDoubleStubs: string[];
    note: string;
  };
};

const MASK64 = (1n << 64n) - 1n;
const FRACTION_MASK112 = (1n << 112n) - 1n;
const HIDDEN_BIT_HIGH = 0x1000000000000n;
const SIGN_MASK = 0x8000000000000000n;
const HIGH_FRACTION_MASK = 0xffffffffffffn;
const DOUBLE_FRACTION_MASK = 0xfffffffffffffn;
const DOUBLE_EXPONENT_MASK = 0x7ffn;
const BINARY128_EXPONENT_BIAS = 0x3fff;
const DOUBLE_EXPONENT_BIAS = 0x3ff;
const DOUBLE_TO_BINARY128_EXPONENT_DELTA = 0x3c00n;

export function nativeIntToBinary128Bits(value: number): NativeBinary128Bits {
  assertSignedInt32(value, "value");
  if (value === 0) {
    return { low: 0n, high: 0n };
  }

  const sign = value < 0 ? SIGN_MASK : 0n;
  const magnitude = BigInt(Math.abs(value));
  const msbIndex = bitLength(magnitude) - 1;
  const exponent = BigInt(BINARY128_EXPONENT_BIAS + msbIndex);
  const fraction = normalizedFractionWithoutHiddenBit(magnitude, msbIndex);

  return splitBinary128(sign, exponent, fraction);
}

export function nativeDoubleToBinary128Bits(value: number): NativeBinary128Bits {
  const bits = doubleBits(value);
  const sign = bits & SIGN_MASK;
  const exponent = (bits >> 52n) & DOUBLE_EXPONENT_MASK;
  const fraction = bits & DOUBLE_FRACTION_MASK;

  if (exponent === 0n && fraction === 0n) {
    return { low: 0n, high: sign };
  }

  if (exponent === 0n) {
    const msbIndex = bitLength(fraction) - 1;
    const nativeExponent = BigInt(BINARY128_EXPONENT_BIAS - 1074 + msbIndex);
    return splitBinary128(sign, nativeExponent, normalizedFractionWithoutHiddenBit(fraction, msbIndex));
  }

  if (exponent === DOUBLE_EXPONENT_MASK) {
    return {
      low: (bits << 60n) & MASK64,
      high: sign | (0x7fffn << 48n) | (fraction >> 4n),
    };
  }

  return {
    low: (bits << 60n) & MASK64,
    high: sign | ((exponent + DOUBLE_TO_BINARY128_EXPONENT_DELTA) << 48n) | (fraction >> 4n),
  };
}

export function nativeBinary128BitsToInt(bits: NativeBinary128Bits): number {
  const normalized = normalizeBits(bits);
  const high = normalized.high;
  const low = normalized.low;
  const exponent = Number((high >> 48n) & 0x7fffn);
  const sign = (high & SIGN_MASK) !== 0n;

  if (exponent < BINARY128_EXPONENT_BIAS) {
    return 0;
  }

  if (exponent >= 0x401f) {
    return sign ? -0x80000000 : 0x7fffffff;
  }

  const unbiasedExponent = exponent - BINARY128_EXPONENT_BIAS;
  const fraction = ((high & HIGH_FRACTION_MASK) << 64n) | low;
  const mantissa = (1n << 112n) | fraction;
  const rawInteger =
    unbiasedExponent <= 112
      ? mantissa >> BigInt(112 - unbiasedExponent)
      : mantissa << BigInt(unbiasedExponent - 112);
  const signedInteger = sign ? -rawInteger : rawInteger;

  return Number(BigInt.asIntN(32, signedInteger));
}

export function nativeBinary128BitsToUint64(bits: NativeBinary128Bits): bigint {
  const normalized = normalizeBits(bits);
  const high = normalized.high;
  const low = normalized.low;
  const exponent = Number((high >> 48n) & 0x7fffn);
  const sign = (high & SIGN_MASK) !== 0n;

  if (sign || exponent < BINARY128_EXPONENT_BIAS) {
    return 0n;
  }

  if (exponent >= 0x403f) {
    return MASK64;
  }

  const unbiasedExponent = exponent - BINARY128_EXPONENT_BIAS;
  const fraction = ((high & HIGH_FRACTION_MASK) << 64n) | low;
  const mantissa = (1n << 112n) | fraction;

  return unbiasedExponent <= 112
    ? mantissa >> BigInt(112 - unbiasedExponent)
    : mantissa << BigInt(unbiasedExponent - 112);
}

export function nativeBinary128BitsToDouble(bits: NativeBinary128Bits): number {
  const normalized = normalizeBits(bits);
  const sign = normalized.high & SIGN_MASK;
  const exponent = Number((normalized.high >> 48n) & 0x7fffn);
  const fraction = ((normalized.high & HIGH_FRACTION_MASK) << 64n) | normalized.low;

  if (exponent === 0 && fraction === 0n) {
    return doubleFromBits(sign);
  }

  if (exponent === 0x7fff) {
    if (fraction === 0n) {
      return doubleFromBits(sign | (DOUBLE_EXPONENT_MASK << 52n));
    }
    const payload = fraction >> 60n;
    const normalizedPayload = payload === 0n ? 0x8000000000000n : payload & DOUBLE_FRACTION_MASK;
    return doubleFromBits(sign | (DOUBLE_EXPONENT_MASK << 52n) | normalizedPayload);
  }

  const mantissa = exponent === 0 ? fraction : (1n << 112n) | fraction;
  const binaryPower = exponent === 0 ? 1 - BINARY128_EXPONENT_BIAS - 112 : exponent - BINARY128_EXPONENT_BIAS - 112;
  const valueExponent = bitLength(mantissa) - 1 + binaryPower;

  if (valueExponent > 1023) {
    return doubleFromBits(sign | (DOUBLE_EXPONENT_MASK << 52n));
  }

  if (valueExponent >= -1022) {
    return finiteNormalDoubleFromBinary128(sign, mantissa, binaryPower, valueExponent);
  }

  return finiteSubnormalDoubleFromBinary128(sign, mantissa, binaryPower);
}

export function nativeBinary128Compare0x195130(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
): NativeBinary128Comparison {
  return nativeBinary128Compare(left, right, 1);
}

export function nativeBinary128Compare0x1951f0(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
): NativeBinary128Comparison {
  return nativeBinary128Compare(left, right, -1);
}

export function nativeBinary128Add0x194c80(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Add(left, right);
}

export function nativeBinary128Divide0x1952a0(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
): NativeBinary128Bits {
  return nativeBinary128Divide(left, right);
}

export function nativeBinary128Multiply0x195cd0(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
): NativeBinary128Bits {
  return nativeBinary128Multiply(left, right);
}

export function nativeBinary128Subtract0x196240(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
): NativeBinary128Bits {
  const normalizedRight = normalizeBits(right);
  return nativeBinary128Add(left, {
    low: normalizedRight.low,
    high: normalizedRight.high ^ SIGN_MASK,
  });
}

export function nativeBinary128Floorl0x19a380(bits: NativeBinary128Bits): NativeBinary128Bits {
  const normalized = normalizeBits(bits);
  const exponent = Number((normalized.high >> 48n) & 0x7fffn);
  const fraction = ((normalized.high & HIGH_FRACTION_MASK) << 64n) | normalized.low;
  const negative = (normalized.high & SIGN_MASK) !== 0n;

  if (exponent === 0x7fff) {
    return fraction === 0n ? normalized : quietBinary128NaN(normalized);
  }

  if (exponent === 0 && fraction === 0n) {
    return normalized;
  }

  const unbiasedExponent = exponent - BINARY128_EXPONENT_BIAS;
  if (unbiasedExponent < 0) {
    return negative ? nativeIntToBinary128Bits(-1) : { low: 0n, high: 0n };
  }

  if (unbiasedExponent >= 112) {
    return normalized;
  }

  const fractionalBits = 112 - unbiasedExponent;
  const fractionalMask = (1n << BigInt(fractionalBits)) - 1n;
  if ((fraction & fractionalMask) === 0n) {
    return normalized;
  }

  const truncated = splitBinary128(
    negative ? SIGN_MASK : 0n,
    BigInt(exponent),
    fraction & ~fractionalMask & FRACTION_MASK112,
  );
  return negative ? nativeBinary128Add(truncated, nativeIntToBinary128Bits(-1)) : truncated;
}

export function nativeBinary128Fmodl0x19a410(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
): NativeBinary128Bits {
  const a = normalizeBits(left);
  const b = normalizeBits(right);

  if (isBinary128NaN(a)) {
    return quietBinary128NaN(a);
  }
  if (isBinary128NaN(b)) {
    return quietBinary128NaN(b);
  }
  if (isBinary128Infinity(a) || isBinary128Zero(b)) {
    return canonicalQuietNaN();
  }
  if (isBinary128Infinity(b) || isBinary128Zero(a)) {
    return a;
  }

  const dividend = finiteParts(a);
  const divisor = finiteParts(b);
  const powerDifference = dividend.binaryPower - divisor.binaryPower;
  let remainder: bigint;
  let remainderPower: number;

  if (powerDifference >= 0) {
    remainder = (dividend.mantissa << BigInt(powerDifference)) % divisor.mantissa;
    remainderPower = divisor.binaryPower;
  } else {
    const alignedDivisor = divisor.mantissa << BigInt(-powerDifference);
    remainder = dividend.mantissa % alignedDivisor;
    remainderPower = dividend.binaryPower;
  }

  if (remainder === 0n) {
    return { low: 0n, high: dividend.sign ? SIGN_MASK : 0n };
  }

  return binary128FromSignedMantissa(dividend.sign ? -remainder : remainder, remainderPower);
}

export function nativeBinary128HelperContracts(): NativeBinary128HelperContracts {
  return {
    representation: {
      exponentBits: 15,
      fractionBits: 112,
      exponentBias: BINARY128_EXPONENT_BIAS,
      signMask: SIGN_MASK,
      exponentMask: 0x7fffn,
      highFractionMask: HIGH_FRACTION_MASK,
    },
    conversions: {
      doubleToBinary128Address: "0x195a00",
      binary128ToInt32Address: "0x195b60",
      binary128ToUint64Address: "0x195be0",
      int32ToBinary128Address: "0x195c60",
      binary128ToDoubleAddress: "0x196270",
    },
    arithmetic: {
      addAddress: "0x194c80",
      subtractWrapperAddress: "0x196240",
      multiplyAddress: "0x195cd0",
      divideAddress: "0x1952a0",
      compareHelperAddresses: ["0x195130", "0x1951f0"],
      libmLongDoubleStubs: {
        floorl: "0x19a380",
        fmodl: "0x19a410",
        cosl: "0x19a420",
        sinl: "0x19a430",
        atan2l: "0x19a440",
        tanl: "0x19a450",
      },
      portedLibmLongDoubleStubs: ["floorl", "fmodl", "cosl-medium", "sinl-medium", "atan2l-finite", "tanl-direct-kernel"],
      note: "addresses are mapped for native dependency tracking; arithmetic, finite atan2l, direct-kernel tanl, and the listed scoped libm helpers are static ports, but no calendar or chart parity is implied",
    },
  };
}

function splitBinary128(sign: bigint, exponent: bigint, fraction: bigint): NativeBinary128Bits {
  return {
    low: fraction & MASK64,
    high: sign | (exponent << 48n) | (fraction >> 64n),
  };
}

function normalizedFractionWithoutHiddenBit(magnitude: bigint, msbIndex: number): bigint {
  return (magnitude << BigInt(112 - msbIndex)) & FRACTION_MASK112;
}

function doubleBits(value: number): bigint {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, true);
  return view.getBigUint64(0, true);
}

function doubleFromBits(bits: bigint): number {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, bits & MASK64, true);
  return view.getFloat64(0, true);
}

function finiteNormalDoubleFromBinary128(
  sign: bigint,
  mantissa: bigint,
  binaryPower: number,
  valueExponent: number,
): number {
  let roundedMantissa = roundScaledIntegerToNearestEven(mantissa, binaryPower - valueExponent + 52);
  let doubleExponent = valueExponent;

  if (roundedMantissa === 1n << 53n) {
    roundedMantissa >>= 1n;
    doubleExponent += 1;
  }

  if (doubleExponent > 1023) {
    return doubleFromBits(sign | (DOUBLE_EXPONENT_MASK << 52n));
  }

  const exponentBits = BigInt(doubleExponent + DOUBLE_EXPONENT_BIAS);
  const fractionBits = roundedMantissa - (1n << 52n);
  return doubleFromBits(sign | (exponentBits << 52n) | (fractionBits & DOUBLE_FRACTION_MASK));
}

function finiteSubnormalDoubleFromBinary128(sign: bigint, mantissa: bigint, binaryPower: number): number {
  const roundedFraction = roundScaledIntegerToNearestEven(mantissa, binaryPower + 1074);

  if (roundedFraction === 0n) {
    return doubleFromBits(sign);
  }

  if (roundedFraction >= 1n << 52n) {
    return doubleFromBits(sign | (1n << 52n));
  }

  return doubleFromBits(sign | roundedFraction);
}

function nativeBinary128Compare(
  left: NativeBinary128Bits,
  right: NativeBinary128Bits,
  unorderedResult: NativeBinary128Comparison,
): NativeBinary128Comparison {
  const a = normalizeBits(left);
  const b = normalizeBits(right);

  if (isBinary128NaN(a) || isBinary128NaN(b)) {
    return unorderedResult;
  }

  if (isBinary128Zero(a) && isBinary128Zero(b)) {
    return 0;
  }

  const leftNegative = (a.high & SIGN_MASK) !== 0n;
  const rightNegative = (b.high & SIGN_MASK) !== 0n;

  if (leftNegative !== rightNegative) {
    return leftNegative ? -1 : 1;
  }

  const magnitudeComparison = compareBinary128Magnitude(a, b);
  return leftNegative ? invertComparison(magnitudeComparison) : magnitudeComparison;
}

function nativeBinary128Add(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  const a = normalizeBits(left);
  const b = normalizeBits(right);

  if (isBinary128NaN(a)) {
    return quietBinary128NaN(a);
  }
  if (isBinary128NaN(b)) {
    return quietBinary128NaN(b);
  }
  if (isBinary128Infinity(a) || isBinary128Infinity(b)) {
    return addBinary128Infinities(a, b);
  }
  if (isBinary128Zero(a) && isBinary128Zero(b)) {
    return { low: 0n, high: (a.high & SIGN_MASK) !== 0n && (b.high & SIGN_MASK) !== 0n ? SIGN_MASK : 0n };
  }
  if (isBinary128Zero(a)) {
    return b;
  }
  if (isBinary128Zero(b)) {
    return a;
  }

  const leftParts = finiteParts(a);
  const rightParts = finiteParts(b);
  const commonPower = Math.min(leftParts.binaryPower, rightParts.binaryPower);
  const leftMagnitude = leftParts.mantissa << BigInt(leftParts.binaryPower - commonPower);
  const rightMagnitude = rightParts.mantissa << BigInt(rightParts.binaryPower - commonPower);
  const signedSum = (leftParts.sign ? -leftMagnitude : leftMagnitude) + (rightParts.sign ? -rightMagnitude : rightMagnitude);

  return binary128FromSignedMantissa(signedSum, commonPower);
}

function nativeBinary128Divide(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  const a = normalizeBits(left);
  const b = normalizeBits(right);
  const sign = (a.high ^ b.high) & SIGN_MASK;

  if (isBinary128NaN(a)) {
    return quietBinary128NaN(a);
  }
  if (isBinary128NaN(b)) {
    return quietBinary128NaN(b);
  }
  if ((isBinary128Infinity(a) && isBinary128Infinity(b)) || (isBinary128Zero(a) && isBinary128Zero(b))) {
    return canonicalQuietNaN();
  }
  if (isBinary128Infinity(a)) {
    return binary128Infinity(sign);
  }
  if (isBinary128Infinity(b)) {
    return { low: 0n, high: sign };
  }
  if (isBinary128Zero(a)) {
    return { low: 0n, high: sign };
  }
  if (isBinary128Zero(b)) {
    return binary128Infinity(sign);
  }

  const leftParts = finiteParts(a);
  const rightParts = finiteParts(b);

  return binary128FromUnsignedRational(
    leftParts.mantissa,
    rightParts.mantissa,
    leftParts.binaryPower - rightParts.binaryPower,
    sign,
  );
}

function nativeBinary128Multiply(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  const a = normalizeBits(left);
  const b = normalizeBits(right);
  const sign = (a.high ^ b.high) & SIGN_MASK;

  if (isBinary128NaN(a)) {
    return quietBinary128NaN(a);
  }
  if (isBinary128NaN(b)) {
    return quietBinary128NaN(b);
  }
  if ((isBinary128Infinity(a) && isBinary128Zero(b)) || (isBinary128Zero(a) && isBinary128Infinity(b))) {
    return canonicalQuietNaN();
  }
  if (isBinary128Infinity(a) || isBinary128Infinity(b)) {
    return binary128Infinity(sign);
  }
  if (isBinary128Zero(a) || isBinary128Zero(b)) {
    return { low: 0n, high: sign };
  }

  const leftParts = finiteParts(a);
  const rightParts = finiteParts(b);
  const product = leftParts.mantissa * rightParts.mantissa;
  const signedProduct = leftParts.sign !== rightParts.sign ? -product : product;

  return binary128FromSignedMantissa(signedProduct, leftParts.binaryPower + rightParts.binaryPower);
}

function binary128FromUnsignedRational(
  numerator: bigint,
  denominator: bigint,
  binaryPower: number,
  sign: bigint,
): NativeBinary128Bits {
  if (numerator === 0n) {
    return { low: 0n, high: sign };
  }

  let valueExponent = floorLog2Ratio(numerator, denominator) + binaryPower;

  if (valueExponent > BINARY128_EXPONENT_BIAS) {
    return binary128Infinity(sign);
  }

  if (valueExponent >= -0x3ffe) {
    let roundedMantissa = roundScaledRationalToNearestEven(
      numerator,
      denominator,
      binaryPower - valueExponent + 112,
    );
    if (roundedMantissa === 1n << 113n) {
      roundedMantissa >>= 1n;
      valueExponent += 1;
      if (valueExponent > BINARY128_EXPONENT_BIAS) {
        return binary128Infinity(sign);
      }
    }
    const exponent = BigInt(valueExponent + BINARY128_EXPONENT_BIAS);
    return splitBinary128(sign, exponent, roundedMantissa - (1n << 112n));
  }

  const roundedFraction = roundScaledRationalToNearestEven(
    numerator,
    denominator,
    binaryPower + BINARY128_EXPONENT_BIAS + 111,
  );
  if (roundedFraction === 0n) {
    return { low: 0n, high: sign };
  }
  if (roundedFraction >= 1n << 112n) {
    return splitBinary128(sign, 1n, roundedFraction - (1n << 112n));
  }
  return {
    low: roundedFraction & MASK64,
    high: sign | (roundedFraction >> 64n),
  };
}

function finiteParts(bits: NativeBinary128Bits): NativeBinary128FiniteParts {
  const exponent = Number((bits.high >> 48n) & 0x7fffn);
  const fraction = ((bits.high & HIGH_FRACTION_MASK) << 64n) | bits.low;
  return {
    sign: (bits.high & SIGN_MASK) !== 0n,
    mantissa: exponent === 0 ? fraction : (1n << 112n) | fraction,
    binaryPower: exponent === 0 ? 1 - BINARY128_EXPONENT_BIAS - 112 : exponent - BINARY128_EXPONENT_BIAS - 112,
  };
}

function binary128FromSignedMantissa(signedMantissa: bigint, binaryPower: number): NativeBinary128Bits {
  if (signedMantissa === 0n) {
    return { low: 0n, high: 0n };
  }

  const sign = signedMantissa < 0n ? SIGN_MASK : 0n;
  const mantissa = signedMantissa < 0n ? -signedMantissa : signedMantissa;
  let valueExponent = bitLength(mantissa) - 1 + binaryPower;

  if (valueExponent > BINARY128_EXPONENT_BIAS) {
    return binary128Infinity(sign);
  }

  if (valueExponent >= -0x3ffe) {
    let roundedMantissa = roundScaledIntegerToNearestEven(mantissa, binaryPower - valueExponent + 112);
    if (roundedMantissa === 1n << 113n) {
      roundedMantissa >>= 1n;
      valueExponent += 1;
      if (valueExponent > BINARY128_EXPONENT_BIAS) {
        return binary128Infinity(sign);
      }
    }
    const exponent = BigInt(valueExponent + BINARY128_EXPONENT_BIAS);
    return splitBinary128(sign, exponent, roundedMantissa - (1n << 112n));
  }

  const roundedFraction = roundScaledIntegerToNearestEven(mantissa, binaryPower + BINARY128_EXPONENT_BIAS + 111);
  if (roundedFraction === 0n) {
    return { low: 0n, high: sign };
  }
  if (roundedFraction >= 1n << 112n) {
    return splitBinary128(sign, 1n, roundedFraction - (1n << 112n));
  }
  return {
    low: roundedFraction & MASK64,
    high: sign | (roundedFraction >> 64n),
  };
}

function addBinary128Infinities(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Bits {
  if (isBinary128Infinity(left) && isBinary128Infinity(right) && (left.high & SIGN_MASK) !== (right.high & SIGN_MASK)) {
    return canonicalQuietNaN();
  }
  return isBinary128Infinity(left) ? left : right;
}

function binary128Infinity(sign: bigint): NativeBinary128Bits {
  return {
    low: 0n,
    high: sign | (0x7fffn << 48n),
  };
}

function quietBinary128NaN(bits: NativeBinary128Bits): NativeBinary128Bits {
  return {
    low: bits.low,
    high: (bits.high | 0x800000000000n) & MASK64,
  };
}

function canonicalQuietNaN(): NativeBinary128Bits {
  return { low: 0n, high: 0x7fff800000000000n };
}

function isBinary128NaN(bits: NativeBinary128Bits): boolean {
  return ((bits.high >> 48n) & 0x7fffn) === 0x7fffn && (((bits.high & HIGH_FRACTION_MASK) << 64n) | bits.low) !== 0n;
}

function isBinary128Infinity(bits: NativeBinary128Bits): boolean {
  return ((bits.high >> 48n) & 0x7fffn) === 0x7fffn && (((bits.high & HIGH_FRACTION_MASK) << 64n) | bits.low) === 0n;
}

function isBinary128Zero(bits: NativeBinary128Bits): boolean {
  return (bits.high & ~SIGN_MASK) === 0n && bits.low === 0n;
}

function compareBinary128Magnitude(left: NativeBinary128Bits, right: NativeBinary128Bits): NativeBinary128Comparison {
  const leftHighMagnitude = left.high & ~SIGN_MASK;
  const rightHighMagnitude = right.high & ~SIGN_MASK;

  if (leftHighMagnitude < rightHighMagnitude) {
    return -1;
  }
  if (leftHighMagnitude > rightHighMagnitude) {
    return 1;
  }
  if (left.low < right.low) {
    return -1;
  }
  if (left.low > right.low) {
    return 1;
  }
  return 0;
}

function invertComparison(value: NativeBinary128Comparison): NativeBinary128Comparison {
  return value === 0 ? 0 : value === 1 ? -1 : 1;
}

function roundScaledIntegerToNearestEven(value: bigint, shift: number): bigint {
  if (shift >= 0) {
    return value << BigInt(shift);
  }
  return roundShiftRightToNearestEven(value, -shift);
}

function roundScaledRationalToNearestEven(numerator: bigint, denominator: bigint, shift: number): bigint {
  if (shift >= 0) {
    return roundRationalToNearestEven(numerator << BigInt(shift), denominator);
  }
  return roundRationalToNearestEven(numerator, denominator << BigInt(-shift));
}

function roundRationalToNearestEven(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  const twiceRemainder = remainder << 1n;

  if (twiceRemainder > denominator || (twiceRemainder === denominator && (quotient & 1n) === 1n)) {
    return quotient + 1n;
  }

  return quotient;
}

function roundShiftRightToNearestEven(value: bigint, shift: number): bigint {
  const shiftBits = BigInt(shift);
  const quotient = value >> shiftBits;
  const remainder = value & ((1n << shiftBits) - 1n);
  const midpoint = 1n << (shiftBits - 1n);

  if (remainder > midpoint || (remainder === midpoint && (quotient & 1n) === 1n)) {
    return quotient + 1n;
  }

  return quotient;
}

function floorLog2Ratio(numerator: bigint, denominator: bigint): number {
  let exponent = bitLength(numerator) - bitLength(denominator);

  if (compareWithShifted(numerator, denominator, exponent) < 0) {
    exponent -= 1;
  }

  return exponent;
}

function compareWithShifted(left: bigint, right: bigint, shift: number): NativeBinary128Comparison {
  const scaledLeft = shift < 0 ? left << BigInt(-shift) : left;
  const scaledRight = shift >= 0 ? right << BigInt(shift) : right;

  if (scaledLeft < scaledRight) {
    return -1;
  }
  if (scaledLeft > scaledRight) {
    return 1;
  }
  return 0;
}

function bitLength(value: bigint): number {
  if (value <= 0n) {
    throw new NativeNumericError(`bitLength requires a positive bigint: ${value}`);
  }
  return value.toString(2).length;
}

function normalizeBits(bits: NativeBinary128Bits): NativeBinary128Bits {
  return {
    low: bits.low & MASK64,
    high: bits.high & MASK64,
  };
}

function assertSignedInt32(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new NativeNumericError(`${field} must be an integer: ${value}`);
  }
  if (value < -0x80000000 || value > 0x7fffffff) {
    throw new NativeNumericError(`${field} must fit signed int32 native arithmetic: ${value}`);
  }
}

export class NativeNumericError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeNumericError";
  }
}
