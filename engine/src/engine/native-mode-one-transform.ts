import { nativeModeOneSeriesTransform0x1842b0 } from "./native-mode-one-series";
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

export type NativeModeOneTransformEvidenceContract = {
  function: { address: string; endExclusive: string };
  caller: { functionAddress: string; callAddress: string; observedCallCount: number };
  nestedSeriesCall: {
    callAddress: string;
    targetAddress: string;
    tableIndex: number;
    precision: number;
  };
  trigCalls: {
    coslTarget: string;
    coslCallAddresses: string[];
    sinlTarget: string;
    sinlCallAddresses: string[];
  };
  constants: {
    doubleVirtualAddresses: string[];
    integerSineAmplitudes: number[];
  };
  directHelperAddresses: {
    doubleToBinary128: string;
    int32ToBinary128: string;
    add: string;
    subtract: string;
    multiply: string;
    divide: string;
  };
  note: string;
};

const NORMALIZATION_DIVISOR = double(7771.37714500204);
const NORMALIZATION_OFFSET = double(1.08472);

export function nativeModeOneTransform0x1868e0(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFinite(input);

  let normalized = divide(add(input, NORMALIZATION_OFFSET), NORMALIZATION_DIVISOR);
  const provisionalSquared = multiply(normalized, normalized);
  let initialCorrection = multiply(double(-3.309e-5), provisionalSquared);

  let phase = add(double(0.784758), multiply(double(8328.6914246), normalized));
  phase = add(phase, multiply(double(0.000152292), provisionalSquared));
  initialCorrection = add(initialCorrection, multiply(double(0.10976), cosine(phase)));

  phase = add(double(0.1874), multiply(double(7214.0628654), normalized));
  phase = subtract(phase, multiply(double(0.00021848), provisionalSquared));
  initialCorrection = add(initialCorrection, multiply(double(0.02224), cosine(phase)));

  phase = add(double(4.669257), multiply(double(628.307585), normalized));
  initialCorrection = subtract(initialCorrection, multiply(double(0.03342), cosine(phase)));
  normalized = subtract(normalized, divide(initialCorrection, NORMALIZATION_DIVISOR));

  let seriesValue = nativeModeOneSeriesTransform0x1842b0(normalized);
  let seriesCorrection = add(double(4.8950632), multiply(double(628.3319653318), normalized));
  let quadratic = multiply(double(5.297e-6), normalized);
  quadratic = multiply(quadratic, normalized);
  seriesCorrection = add(seriesCorrection, quadratic);

  const sharedLinearPhase = multiply(double(628.307585), normalized);
  phase = add(double(4.669257), sharedLinearPhase);
  seriesCorrection = add(seriesCorrection, multiply(double(0.0334166), cosine(phase)));

  phase = add(double(2.67823), sharedLinearPhase);
  let weightedCosine = multiply(double(0.0002061), cosine(phase));
  weightedCosine = multiply(weightedCosine, normalized);
  seriesCorrection = add(seriesCorrection, weightedCosine);

  phase = add(double(4.6261), multiply(double(1256.61517), normalized));
  seriesCorrection = add(seriesCorrection, multiply(double(0.000349), cosine(phase)));
  seriesCorrection = subtract(seriesCorrection, double(20.5 / (648000 / Math.PI)));
  seriesValue = subtract(seriesValue, seriesCorrection);

  let residualDivisor = double(7771.38);
  phase = add(double(0.7848), multiply(double(8328.691425), normalized));
  let phaseQuadratic = multiply(double(0.0001523), normalized);
  phaseQuadratic = multiply(phaseQuadratic, normalized);
  phase = add(phase, phaseQuadratic);
  residualDivisor = subtract(residualDivisor, multiply(nativeIntToBinary128Bits(914), sine(phase)));

  phase = add(double(2.543), multiply(double(15542.7543), normalized));
  residualDivisor = subtract(residualDivisor, multiply(nativeIntToBinary128Bits(179), sine(phase)));

  phase = add(double(0.1874), multiply(double(7214.0629), normalized));
  residualDivisor = subtract(residualDivisor, multiply(nativeIntToBinary128Bits(160), sine(phase)));

  const residual = divide(subtract(input, seriesValue), residualDivisor);
  return add(normalized, residual);
}

export function nativeModeOneTransformEvidenceContract(): NativeModeOneTransformEvidenceContract {
  return {
    function: { address: "0x1868e0", endExclusive: "0x186e3e" },
    caller: { functionAddress: "0x181490", callAddress: "0x18168f", observedCallCount: 1 },
    nestedSeriesCall: {
      callAddress: "0x186ae0",
      targetAddress: "0x1842b0",
      tableIndex: 0,
      precision: 20,
    },
    trigCalls: {
      coslTarget: "0x19a420",
      coslCallAddresses: ["0x1869b3", "0x186a3e", "0x186aa3", "0x186b97", "0x186bdf", "0x186c4d"],
      sinlTarget: "0x19a430",
      sinlCallAddresses: ["0x186d31", "0x186d93", "0x186df5"],
    },
    constants: {
      doubleVirtualAddresses: [
        "0x83298", "0x832a8", "0x832b0", "0x832c0", "0x832d0", "0x832d8", "0x83308",
        "0x83370", "0x83378", "0x833e0", "0x833f0", "0x833f8", "0x83400", "0x83430",
        "0x83478", "0x83518", "0x83538", "0x83550", "0x83598", "0x835a8", "0x835b0",
        "0x835c0", "0x835e0", "0x83600", "0x83630", "0x83668", "0x836c8", "0x836e0",
        "0x83720", "0x83728", "0x83758",
      ],
      integerSineAmplitudes: [914, 179, 160],
    },
    directHelperAddresses: {
      doubleToBinary128: "0x195a00",
      int32ToBinary128: "0x195c60",
      add: "0x194c80",
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
    },
    note: "mode-one numeric transform only; no 0x181490 outer path, calendar, astrology, or chart parity is claimed",
  };
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
    throw new NativeModeOneTransformError("native-mode-one-transform:non-finite-input");
  }
}

export class NativeModeOneTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeModeOneTransformError";
  }
}
