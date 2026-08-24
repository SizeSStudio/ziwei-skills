import { createHash } from "node:crypto";
import {
  type NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";

type NativeTransformRow = readonly [
  x0: NativeBinary128Bits,
  c0: NativeBinary128Bits,
  c1: NativeBinary128Bits,
  c2: NativeBinary128Bits,
  c3: NativeBinary128Bits,
];

export type NativePiecewiseTransformBranch = "bridge" | "quadratic" | `table-row-${number}`;

type NativePiecewiseTransformSelection =
  | {
      kind: "table";
      branch: NativePiecewiseTransformBranch;
      rowIndex: number;
    }
  | {
      kind: "bridge" | "quadratic";
      branch: "bridge" | "quadratic";
    };

export type NativeTransformEvidenceContracts = {
  functions: {
    piecewiseTransform: { address: string; fdeStart: string; fdeEndExclusive: string };
    wrapper: { address: string; fdeStart: string; fdeEndExclusive: string };
  };
  table: {
    virtualAddress: string;
    fileOffset: string;
    rowStrideBytes: number;
    rowCount: number;
    valueWidthBytes: number;
    rowLayout: string[];
  };
  directHelperAddresses: {
    doubleToBinary128: string;
    int32ToBinary128: string;
    compare: string[];
    add: string;
    boundaryAddCallSites: string[];
    subtract: string;
    multiply: string;
    divide: string;
  };
  wrapperConstants: {
    daysPerYearDouble: number;
    epochOffsetInt32: number;
    secondsPerDayDouble: number;
  };
  inputContract: {
    finiteOnly: boolean;
    roundingMode: string;
  };
  note: string;
};

const MASK64 = (1n << 64n) - 1n;
const BINARY128_EXPONENT_MASK = 0x7fffn;
const NATIVE_TRANSFORM_TABLE_ROW_BYTES = 0x50;
const NATIVE_TRANSFORM_VALUE_BYTES = 0x10;

function binary128(low: bigint, high: bigint): NativeBinary128Bits {
  return Object.freeze({ low, high });
}

const BINARY128_INT_NEGATIVE_20 = binary128FromInt(-20);
const BINARY128_INT_10 = binary128FromInt(10);
const BINARY128_INT_31 = binary128FromInt(31);
const BINARY128_INT_100 = binary128FromInt(100);
const BINARY128_INT_1820 = binary128FromInt(1820);
const BINARY128_INT_2000 = binary128FromInt(2000);
const BINARY128_DOUBLE_365_2425 = binary128FromDouble(365.2425);
const BINARY128_DOUBLE_86400 = binary128FromDouble(86400);

// Raw little-endian binary128 words from VA/file offset 0x84510, stride 0x50.
const NATIVE_TRANSFORM_TABLE: readonly NativeTransformRow[] = [
  [
    binary128(0x0000000000000000n, 0xc00af40000000000n),
    binary128(0x3000000000000000n, 0x400fa753b3333333n),
    binary128(0x6000000000000000n, 0xc00c976666666666n),
    binary128(0x0000000000000000n, 0x4007880000000000n),
    binary128(0x0000000000000000n, 0x0000000000000000n),
  ],
  [
    binary128(0x0000000000000000n, 0xc007f40000000000n),
    binary128(0x0000000000000000n, 0x400d0cc400000000n),
    binary128(0x3000000000000000n, 0xc00839e8f5c28f5cn),
    binary128(0xc000000000000000n, 0x400302b851eb851en),
    binary128(0x9000000000000000n, 0xbffd5d7dbf487fcbn),
  ],
  [
    binary128(0x0000000000000000n, 0xc0062c0000000000n),
    binary128(0xd000000000000000n, 0x400c7d44ccccccccn),
    binary128(0x3000000000000000n, 0xc0075a68f5c28f5cn),
    binary128(0x9000000000000000n, 0x400159cac083126en),
    binary128(0x0000000000000000n, 0xbffc463f141205bcn),
  ],
  [
    binary128(0x0000000000000000n, 0x40062c0000000000n),
    binary128(0x6000000000000000n, 0x400c1cce66666666n),
    binary128(0xe000000000000000n, 0xc007482147ae147an),
    binary128(0x7000000000000000n, 0xbfffa5a1cac08312n),
    binary128(0x6000000000000000n, 0x3ffa34d6a161e4f7n),
  ],
  [
    binary128(0x0000000000000000n, 0x4007f40000000000n),
    binary128(0x0000000000000000n, 0x400b64b800000000n),
    binary128(0x3000000000000000n, 0xc0078768f5c28f5cn),
    binary128(0x8000000000000000n, 0x3ffed47ae147ae14n),
    binary128(0x4000000000000000n, 0x3ffd420c49ba5e35n),
  ],
  [
    binary128(0x0000000000000000n, 0x4008c20000000000n),
    binary128(0xd000000000000000n, 0x400a136cccccccccn),
    binary128(0x3000000000000000n, 0xc0071b7333333333n),
    binary128(0x5000000000000000n, 0x4002a116872b020cn),
    binary128(0x2000000000000000n, 0xbffc6c226809d495n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009450000000000n),
    binary128(0xa000000000000000n, 0x4007ea1999999999n),
    binary128(0xd000000000000000n, 0xc004caccccccccccn),
    binary128(0xe000000000000000n, 0x40000ae147ae147an),
    binary128(0x2000000000000000n, 0xbff7d7dbf487fcb9n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009900000000000n),
    binary128(0x0000000000000000n, 0x4005e00000000000n),
    binary128(0xf000000000000000n, 0xc00239eb851eb851n),
    binary128(0x0000000000000000n, 0xbfff883126e978d5n),
    binary128(0x5000000000000000n, 0x3ffc1f559b3d07c8n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009a90000000000n),
    binary128(0x6000000000000000n, 0x4002466666666666n),
    binary128(0xf000000000000000n, 0xbffed1eb851eb851n),
    binary128(0x2000000000000000n, 0x3ffe051eb851eb85n),
    binary128(0xb000000000000000n, 0xbffa2f1a9fbe76c8n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009c20000000000n),
    binary128(0xd000000000000000n, 0x4002acccccccccccn),
    binary128(0xa000000000000000n, 0xbffe70a3d70a3d70n),
    binary128(0x2000000000000000n, 0x3ffc9db22d0e5604n),
    binary128(0x5000000000000000n, 0xbff93c36113404ean),
  ],
  [
    binary128(0x0000000000000000n, 0x4009c98000000000n),
    binary128(0x3000000000000000n, 0x4001f33333333333n),
    binary128(0x6000000000000000n, 0xbfffcf5c28f5c28fn),
    binary128(0x9000000000000000n, 0x3ffda9fbe76c8b43n),
    binary128(0x0000000000000000n, 0xbff994af4f0d844dn),
  ],
  [
    binary128(0x0000000000000000n, 0x4009d10000000000n),
    binary128(0xa000000000000000n, 0x4002099999999999n),
    binary128(0x4000000000000000n, 0xbffc0a3d70a3d70an),
    binary128(0x6000000000000000n, 0xbffd9fbe76c8b439n),
    binary128(0xf000000000000000n, 0x3ff9de69ad42c3c9n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009d60000000000n),
    binary128(0xa000000000000000n, 0xc001599999999999n),
    binary128(0xb000000000000000n, 0x3ffd47ae147ae147n),
    binary128(0x6000000000000000n, 0xbffc76c8b4395810n),
    binary128(0x5000000000000000n, 0x3ff91b71758e2196n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009db0000000000n),
    binary128(0x6000000000000000n, 0xc000266666666666n),
    binary128(0xb000000000000000n, 0x400007ae147ae147n),
    binary128(0xf000000000000000n, 0x3ffc5a1cac083126n),
    binary128(0x9000000000000000n, 0xbff8ba5e353f7cedn),
  ],
  [
    binary128(0x0000000000000000n, 0x4009e00000000000n),
    binary128(0x3000000000000000n, 0x4003533333333333n),
    binary128(0xa000000000000000n, 0x3fffb0a3d70a3d70n),
    binary128(0xb000000000000000n, 0xbffd374bc6a7ef9dn),
    binary128(0x2000000000000000n, 0x3ff9119ce075f6fdn),
  ],
  [
    binary128(0x0000000000000000n, 0x4009e50000000000n),
    binary128(0x3000000000000000n, 0x4003833333333333n),
    binary128(0x5000000000000000n, 0x3fff3851eb851eb8n),
    binary128(0xc000000000000000n, 0xbffb0624dd2f1a9fn),
    binary128(0x3000000000000000n, 0x3ff69652bd3c3611n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009ea0000000000n),
    binary128(0xa000000000000000n, 0x4004099999999999n),
    binary128(0x2000000000000000n, 0x3ffe051eb851eb85n),
    binary128(0x5000000000000000n, 0x3ffcd916872b020cn),
    binary128(0x4000000000000000n, 0xbff8652bd3c36113n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009ef0000000000n),
    binary128(0x0000000000000000n, 0x4004980000000000n),
    binary128(0x4000000000000000n, 0x3fff4a3d70a3d70an),
    binary128(0x9000000000000000n, 0xbff9a9fbe76c8b43n),
    binary128(0xd000000000000000n, 0x3ff6a36e2eb1c432n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009f40000000000n),
    binary128(0xf000000000000000n, 0x4004fef5c28f5c28n),
    binary128(0xa000000000000000n, 0x3ffb999999999999n),
    binary128(0x0000000000000000n, 0x0000000000000000n),
    binary128(0x0000000000000000n, 0x0000000000000000n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009f54000000000n),
    binary128(0xd000000000000000n, 0x400502ccccccccccn),
    binary128(0xa000000000000000n, 0x3ffd999999999999n),
    binary128(0x0000000000000000n, 0x0000000000000000n),
    binary128(0x0000000000000000n, 0x0000000000000000n),
  ],
  [
    binary128(0x0000000000000000n, 0x4009f7c000000000n),
    binary128(0x0000000000000000n, 0x4005140000000000n),
    binary128(0x8000000000000000n, 0xbffb61869835158bn),
    binary128(0x5000000000000000n, 0x3ff398f1d3ed527en),
    binary128(0x1000000000000000n, 0xbff14f8b588e368fn),
  ],
];

const CUTOVER_2015_TABLE_ROW_INDEX = NATIVE_TRANSFORM_TABLE.length - 1;
const CUTOVER_2015_TABLE_ROW = NATIVE_TRANSFORM_TABLE[CUTOVER_2015_TABLE_ROW_INDEX];
const [CUTOVER_2015, BRIDGE_VALUE_AT_2015] = CUTOVER_2015_TABLE_ROW;

export function nativePiecewiseTransform0x183380(input: NativeBinary128Bits): NativeBinary128Bits {
  const selection = selectNativePiecewiseTransformBranch(input);

  if (selection.kind === "table") {
    return transformTableRow(input, selection.rowIndex);
  }

  return transformAtOrAbove2015(input, selection);
}

export function nativePiecewiseTransformBranch0x183380(input: NativeBinary128Bits): NativePiecewiseTransformBranch {
  return selectNativePiecewiseTransformBranch(input).branch;
}

function selectNativePiecewiseTransformBranch(input: NativeBinary128Bits): NativePiecewiseTransformSelection {
  assertFiniteBinary128(input);

  if (nativeBinary128Compare0x1951f0(input, CUTOVER_2015) >= 0) {
    const upperBridgeBoundary = nativeBinary128Add0x194c80(CUTOVER_2015, BINARY128_INT_100);
    return nativeBinary128Compare0x1951f0(input, upperBridgeBoundary) > 0
      ? { kind: "quadratic", branch: "quadratic" }
      : { kind: "bridge", branch: "bridge" };
  }

  let rowIndex = 0;
  for (let nextRowIndex = 1; nextRowIndex < NATIVE_TRANSFORM_TABLE.length; nextRowIndex += 1) {
    if (nativeBinary128Compare0x195130(input, NATIVE_TRANSFORM_TABLE[nextRowIndex][0]) < 0) {
      break;
    }
    rowIndex = nextRowIndex;
  }

  return { kind: "table", branch: `table-row-${rowIndex}`, rowIndex };
}

function transformTableRow(input: NativeBinary128Bits, rowIndex: number): NativeBinary128Bits {
  const [x0, c0, c1, c2, c3] = NATIVE_TRANSFORM_TABLE[rowIndex];
  const nextX0 = NATIVE_TRANSFORM_TABLE[rowIndex + 1][0];
  const offset = nativeBinary128Subtract0x196240(input, x0);
  const width = nativeBinary128Subtract0x196240(nextX0, x0);
  const normalizedOffset = nativeBinary128Divide0x1952a0(offset, width);
  const scaledOffset = nativeBinary128Multiply0x195cd0(normalizedOffset, BINARY128_INT_10);
  const scaledOffsetSquared = nativeBinary128Multiply0x195cd0(scaledOffset, scaledOffset);
  const scaledOffsetCubed = nativeBinary128Multiply0x195cd0(scaledOffsetSquared, scaledOffset);

  const linearTerm = nativeBinary128Multiply0x195cd0(c1, scaledOffset);
  let result = nativeBinary128Add0x194c80(c0, linearTerm);
  const quadraticTerm = nativeBinary128Multiply0x195cd0(c2, scaledOffsetSquared);
  result = nativeBinary128Add0x194c80(result, quadraticTerm);
  const cubicTerm = nativeBinary128Multiply0x195cd0(c3, scaledOffsetCubed);
  return nativeBinary128Add0x194c80(result, cubicTerm);
}

export function nativeTransformWrapper0x183830(input: NativeBinary128Bits): NativeBinary128Bits {
  assertFiniteBinary128(input);

  const yearsFromInput = nativeBinary128Divide0x1952a0(input, BINARY128_DOUBLE_365_2425);
  const shiftedInput = nativeBinary128Add0x194c80(yearsFromInput, BINARY128_INT_2000);
  const transformed = nativePiecewiseTransform0x183380(shiftedInput);
  return nativeBinary128Divide0x1952a0(transformed, BINARY128_DOUBLE_86400);
}

export function nativeTransformTableSha2560x84510(): string {
  const bytes = Buffer.alloc(NATIVE_TRANSFORM_TABLE.length * NATIVE_TRANSFORM_TABLE_ROW_BYTES);
  let offset = 0;

  for (const row of NATIVE_TRANSFORM_TABLE) {
    for (const value of row) {
      bytes.writeBigUInt64LE(value.low, offset);
      bytes.writeBigUInt64LE(value.high, offset + 8);
      offset += NATIVE_TRANSFORM_VALUE_BYTES;
    }
  }

  return createHash("sha256").update(bytes).digest("hex");
}

export function nativeTransformEvidenceContracts(): NativeTransformEvidenceContracts {
  return {
    functions: {
      piecewiseTransform: { address: "0x183380", fdeStart: "0x183380", fdeEndExclusive: "0x183827" },
      wrapper: { address: "0x183830", fdeStart: "0x183830", fdeEndExclusive: "0x183897" },
    },
    table: {
      virtualAddress: "0x84510",
      fileOffset: "0x84510",
      rowStrideBytes: NATIVE_TRANSFORM_TABLE_ROW_BYTES,
      rowCount: NATIVE_TRANSFORM_TABLE.length,
      valueWidthBytes: NATIVE_TRANSFORM_VALUE_BYTES,
      rowLayout: ["x0", "c0", "c1", "c2", "c3"],
    },
    directHelperAddresses: {
      doubleToBinary128: "0x195a00",
      int32ToBinary128: "0x195c60",
      compare: ["0x195130", "0x1951f0"],
      add: "0x194c80",
      boundaryAddCallSites: ["0x1833bb", "0x1834bf"],
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
    },
    wrapperConstants: {
      daysPerYearDouble: 365.2425,
      epochOffsetInt32: 2000,
      secondsPerDayDouble: 86400,
    },
    inputContract: {
      finiteOnly: true,
      roundingMode: "round-to-nearest-even",
    },
    note: "numeric substrate only; no calendar, astrology, 0x181490, or chart parity is claimed",
  };
}

function transformAtOrAbove2015(
  input: NativeBinary128Bits,
  selection: Exclude<NativePiecewiseTransformSelection, { kind: "table" }>,
): NativeBinary128Bits {
  const normalizedInput = nativeBinary128Divide0x1952a0(
    nativeBinary128Subtract0x196240(input, BINARY128_INT_1820),
    BINARY128_INT_100,
  );
  const result = quadraticAbove2015(normalizedInput);

  if (selection.kind === "quadratic") {
    return result;
  }

  const normalizedCutover = nativeBinary128Divide0x1952a0(
    nativeBinary128Subtract0x196240(CUTOVER_2015, BINARY128_INT_1820),
    BINARY128_INT_100,
  );
  const cutoverDelta = nativeBinary128Subtract0x196240(
    quadraticAbove2015(normalizedCutover),
    BRIDGE_VALUE_AT_2015,
  );
  const distanceFromUpperBoundary = nativeBinary128Subtract0x196240(
    nativeBinary128Add0x194c80(CUTOVER_2015, BINARY128_INT_100),
    input,
  );
  const correction = nativeBinary128Divide0x1952a0(
    nativeBinary128Multiply0x195cd0(cutoverDelta, distanceFromUpperBoundary),
    BINARY128_INT_100,
  );
  return nativeBinary128Subtract0x196240(result, correction);
}

function quadraticAbove2015(normalizedInput: NativeBinary128Bits): NativeBinary128Bits {
  const scaled = nativeBinary128Multiply0x195cd0(BINARY128_INT_31, normalizedInput);
  const squaredTerm = nativeBinary128Multiply0x195cd0(scaled, normalizedInput);
  return nativeBinary128Add0x194c80(BINARY128_INT_NEGATIVE_20, squaredTerm);
}

function binary128FromInt(value: number): NativeBinary128Bits {
  return binary128FromConverted(nativeIntToBinary128Bits(value));
}

function binary128FromDouble(value: number): NativeBinary128Bits {
  return binary128FromConverted(nativeDoubleToBinary128Bits(value));
}

function binary128FromConverted(value: NativeBinary128Bits): NativeBinary128Bits {
  return binary128(value.low, value.high);
}

function assertFiniteBinary128(input: NativeBinary128Bits): void {
  const exponent = ((input.high & MASK64) >> 48n) & BINARY128_EXPONENT_MASK;
  if (exponent === BINARY128_EXPONENT_MASK) {
    throw new NativeTransformError("native transform input must be finite binary128");
  }
}

export class NativeTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeTransformError";
  }
}
