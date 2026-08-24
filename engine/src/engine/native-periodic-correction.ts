import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeBinary128Sinl0x19a430 } from "./native-trig";

type NativePeriodicTerm = {
  amplitudeBase: NativeBinary128Bits;
  amplitudeLinear: NativeBinary128Bits;
  phaseBase: NativeBinary128Bits;
  phaseLinear: NativeBinary128Bits;
  phaseQuadratic: NativeBinary128Bits;
};

export type NativePeriodicCorrectionEvidenceContract = {
  function: { address: string; endExclusive: string };
  observedCallers: string[];
  termCount: number;
  sinlCallAddresses: string[];
  amplitudeSlopeDouble: { address: string; value: number };
  binary128ConstantAddresses: string[];
  finalDivisors: Array<{ kind: string; value: number | string; callAddress: string }>;
  characterizationVectorCount: number;
  note: string;
};

const ZERO = nativeIntToBinary128Bits(0);
const ONE_HUNDRED = nativeIntToBinary128Bits(100);
const FINAL_DIVISOR = nativeDoubleToBinary128Bits(648000 / Math.PI);

const TERMS: readonly NativePeriodicTerm[] = [
  term(
    bits(0x0000000000000000n, 0xc009ae0000000000n),
    nativeDoubleToBinary128Bits(-1.742),
    bits(0xd000000000000000n, 0x40001758e219652bn),
    bits(0x9000000000000000n, 0xc0040e0e703afb7en),
    bits(0xf000000000000000n, 0x3ff02dfd694ccab3n),
  ),
  term(
    bits(0x0000000000000000n, 0xc006080000000000n), ZERO,
    bits(0xc000000000000000n, 0x4000c0e219652bd3n),
    bits(0x5000000000000000n, 0x40093a2a7dd44135n),
    bits(0x2000000000000000n, 0x3fee711947cfa26an),
  ),
  term(
    bits(0x0000000000000000n, 0xc003700000000000n), ZERO,
    bits(0x6000000000000000n, 0x3fff566666666666n),
    bits(0xc000000000000000n, 0x400d067dac3c9eecn),
    bits(0x9000000000000000n, 0xbff0abd1aa821f29n),
  ),
  term(
    bits(0x0000000000000000n, 0x4003500000000000n), ZERO,
    bits(0x9000000000000000n, 0x4001175a858793ddn),
    bits(0x9000000000000000n, 0xc0050e0e703afb7en),
    bits(0xf000000000000000n, 0x3ff12dfd694ccab3n),
  ),
  term(
    bits(0x0000000000000000n, 0xc002c00000000000n), ZERO,
    bits(0xb000000000000000n, 0x3ffa47ae147ae147n),
    bits(0x3000000000000000n, 0xc0083a26a7ef9db2n), ZERO,
  ),
  term(
    bits(0x0000000000000000n, 0x4001c00000000000n), ZERO,
    bits(0x1000000000000000n, 0x40002e147ae147aen),
    bits(0x5000000000000000n, 0x400c0445872b020cn), ZERO,
  ),
  term(
    bits(0x0000000000000000n, 0xc001400000000000n), ZERO,
    bits(0xe000000000000000n, 0x4000bae147ae147an),
    bits(0xe000000000000000n, 0x4009d73dd2f1a9fbn), ZERO,
  ),
  term(
    bits(0x0000000000000000n, 0xc001000000000000n), ZERO,
    bits(0x3000000000000000n, 0x40015c28f5c28f5cn),
    bits(0x3000000000000000n, 0x400d0704b3333333n), ZERO,
  ),
  term(
    bits(0x0000000000000000n, 0xc000800000000000n), ZERO,
    bits(0x5000000000000000n, 0x4000d851eb851eb8n),
    bits(0x4000000000000000n, 0x400d88a070a3d70an), ZERO,
  ),
  term(
    bits(0x0000000000000000n, 0x4000000000000000n), ZERO,
    bits(0x6000000000000000n, 0x4000c66666666666n),
    bits(0x7000000000000000n, 0x40083a2e56041893n), ZERO,
  ),
];

export function nativePeriodicCorrection0x1838a0(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFinite(input);
  const squaredInput = nativeBinary128Multiply0x195cd0(input, input);
  let accumulator = ZERO;

  for (const current of TERMS) {
    let amplitude = nativeBinary128Multiply0x195cd0(current.amplitudeLinear, input);
    amplitude = nativeBinary128Add0x194c80(current.amplitudeBase, amplitude);

    let phase = nativeBinary128Multiply0x195cd0(current.phaseLinear, input);
    phase = nativeBinary128Add0x194c80(current.phaseBase, phase);
    const quadraticPhase = nativeBinary128Multiply0x195cd0(current.phaseQuadratic, squaredInput);
    phase = nativeBinary128Add0x194c80(phase, quadraticPhase);

    const weightedSine = nativeBinary128Multiply0x195cd0(
      amplitude,
      nativeBinary128Sinl0x19a430(phase),
    );
    accumulator = nativeBinary128Add0x194c80(accumulator, weightedSine);
  }

  accumulator = nativeBinary128Divide0x1952a0(accumulator, ONE_HUNDRED);
  return nativeBinary128Divide0x1952a0(accumulator, FINAL_DIVISOR);
}

export function nativePeriodicCorrectionEvidenceContract(): NativePeriodicCorrectionEvidenceContract {
  return {
    function: { address: "0x1838a0", endExclusive: "0x183d33" },
    observedCallers: ["0x18582b", "0x1863d9", "0x186729"],
    termCount: TERMS.length,
    sinlCallAddresses: [
      "0x18392b", "0x18399f", "0x183a13", "0x183a87", "0x183afb",
      "0x183b58", "0x183bb5", "0x183c12", "0x183c6f", "0x183ccc",
    ],
    amplitudeSlopeDouble: { address: "0x833b8", value: -1.742 },
    binary128ConstantAddresses: [
      "0x83050", "0x83020", "0x82fb0", "0x83070", "0x83220", "0x83010", "0x82ea0", "0x83150",
      "0x830f0", "0x82eb0", "0x83080", "0x82fc0", "0x831c0", "0x82fd0", "0x83100", "0x82f40",
      "0x82f00", "0x83110", "0x82f10", "0x83160", "0x82ff0", "0x83120", "0x83170", "0x83190",
      "0x82ec0", "0x83000", "0x83090", "0x830a0", "0x830c0", "0x83130", "0x82f50", "0x82e90",
      "0x83140", "0x83230",
    ],
    finalDivisors: [
      { kind: "int32", value: 100, callAddress: "0x183cfe" },
      { kind: "double-expression", value: "648000/pi", callAddress: "0x183d28" },
    ],
    characterizationVectorCount: 7,
    note: "numeric periodic correction only; no 0x1861d0, calendar, astrology, or chart parity is claimed",
  };
}

function term(
  amplitudeBase: NativeBinary128Bits,
  amplitudeLinear: NativeBinary128Bits,
  phaseBase: NativeBinary128Bits,
  phaseLinear: NativeBinary128Bits,
  phaseQuadratic: NativeBinary128Bits,
): NativePeriodicTerm {
  return { amplitudeBase, amplitudeLinear, phaseBase, phaseLinear, phaseQuadratic };
}

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativePeriodicCorrectionError("native-periodic-correction:non-finite-input");
  }
}

export class NativePeriodicCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativePeriodicCorrectionError";
  }
}
