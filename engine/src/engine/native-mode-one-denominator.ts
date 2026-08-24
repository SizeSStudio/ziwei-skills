import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeBinary128Sinl0x19a430 } from "./native-trig";

export type NativeModeOneDenominatorEvidenceContract = {
  function: { address: string; endExclusive: string };
  caller: { functionAddress: string; callAddress: string; observedCallCount: number };
  termCount: number;
  integerAmplitudes: number[];
  doubleConstantVirtualAddresses: string[];
  trigTarget: string;
  note: string;
};

type LinearTerm = {
  amplitude: number;
  phase: number;
  frequency: number;
  subtractFrequency?: boolean;
};

const LINEAR_TERMS: readonly LinearTerm[] = [
  { amplitude: 179, phase: 2.543, frequency: 15542.7543 },
  { amplitude: 160, phase: 0.1874, frequency: 7214.0629 },
  { amplitude: 62, phase: 3.14, frequency: 16657.3828 },
  { amplitude: 34, phase: 4.827, frequency: 16866.9323 },
  { amplitude: 22, phase: 4.9, frequency: 23871.4457 },
  { amplitude: 12, phase: 2.59, frequency: 14914.4523 },
  { amplitude: 7, phase: 0.23, frequency: 6585.7609 },
  { amplitude: 5, phase: 0.9, frequency: 25195.624 },
  { amplitude: 5, phase: 2.32, frequency: 7700.3895, subtractFrequency: true },
  { amplitude: 5, phase: 3.88, frequency: 8956.9934 },
  { amplitude: 5, phase: 0.49, frequency: 7771.3771 },
];

export function nativeModeOneDenominator0x185160(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFinite(input);

  let primaryPhase = add(double(0.7848), multiply(double(8328.691425), input));
  let quadratic = multiply(double(0.0001523), input);
  quadratic = multiply(quadratic, input);
  primaryPhase = add(primaryPhase, quadratic);
  const primaryTerm = multiply(nativeIntToBinary128Bits(914), sine(primaryPhase));
  const primaryAccumulator = subtract(double(8399.71), primaryTerm);

  let remainingTerms = linearTerm(LINEAR_TERMS[0], input);
  for (let index = 1; index < LINEAR_TERMS.length; index += 1) {
    remainingTerms = add(remainingTerms, linearTerm(LINEAR_TERMS[index], input));
  }
  return subtract(primaryAccumulator, remainingTerms);
}

export function nativeModeOneDenominatorEvidenceContract(): NativeModeOneDenominatorEvidenceContract {
  return {
    function: { address: "0x185160", endExclusive: "0x18561c" },
    caller: { functionAddress: "0x1859c0", callAddress: "0x185c11", observedCallCount: 1 },
    termCount: 12,
    integerAmplitudes: [914, 179, 160, 62, 34, 22, 12, 7, 5, 5, 5, 5],
    doubleConstantVirtualAddresses: [
      "0x832b0", "0x83308", "0x83310", "0x83328", "0x83338", "0x83360", "0x833a0",
      "0x833e0", "0x833e8", "0x83418", "0x83460", "0x834a8", "0x83530", "0x83550",
      "0x83570", "0x83598", "0x835a0", "0x835e0", "0x835e8", "0x835f0", "0x83650",
      "0x83690", "0x836c0", "0x836e0", "0x83710", "0x83740",
    ],
    trigTarget: "0x19a430",
    note: "numeric denominator correction only; no 0x1859c0, calendar, astrology, or chart parity is claimed",
  };
}

function linearTerm(term: LinearTerm, input: NativeBinary128Bits): NativeBinary128Bits {
  const frequency = multiply(double(term.frequency), input);
  const phase = term.subtractFrequency
    ? subtract(double(term.phase), frequency)
    : add(double(term.phase), frequency);
  return multiply(nativeIntToBinary128Bits(term.amplitude), sine(phase));
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

function sine(value: NativeBinary128Bits): NativeBinary128Bits {
  return nativeBinary128Sinl0x19a430(value);
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeModeOneDenominatorError("native-mode-one-denominator:non-finite-input");
  }
}

export class NativeModeOneDenominatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeModeOneDenominatorError";
  }
}
