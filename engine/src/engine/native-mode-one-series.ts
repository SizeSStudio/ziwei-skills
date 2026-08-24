import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeBinary128Cosl0x19a420 } from "./native-trig";

export type NativeModeOneSeriesEvidenceContract = {
  function: { address: string; endExclusive: string };
  fixedCaller: {
    functionAddress: string;
    callAddress: string;
    tableIndex: number;
    precision: number;
  };
  additionalObservedCalls: Array<{
    functionAddress: string;
    callAddress: string;
    tableIndex: number;
    precision: number;
  }>;
  offsetTable: {
    virtualAddress: string;
    entryIndex: number;
    signedRelativeOffset: string;
    relocationTableAddress: string;
  };
  orderTables: Array<{
    pointerSlot: string;
    relocationTarget: string;
    valueCount: number;
  }>;
  tableAsset: {
    path: string;
    virtualAddress: string;
    sourceFileOffset: string;
    endExclusive: string;
    byteLength: number;
    valueWidthBytes: number;
    sha256: string;
  };
  fixedPath: {
    orderValueCounts: number[];
    termStrideValues: number;
    termLayout: string[];
    phaseNormalizers: number[];
    positiveCorrectionThreshold: number;
  };
  directHelperAddresses: {
    doubleToBinary128: string;
    int32ToBinary128: string;
    compare: string[];
    add: string;
    subtract: string;
    multiply: string;
    divide: string;
    cosl: string;
  };
  note: string;
};

const TABLE_ASSET_NAME = "native-mode-one-table-0xdf6a0.bin";
const TABLE_BYTE_LENGTH = 0xde60;
const TABLE_VALUE_BYTES = 0x10;
const TABLE_SHA256 = "697fb572347570e6cf8eb5bcc128406fb4e63e30bd8fad2354ea1fdc12cacf87";
const ORDER_START_VALUES = [0, 2652, 3546] as const;
const ORDER_VALUE_COUNTS = [2652, 894, 12] as const;
const TERM_STRIDE_VALUES = 6;

const ZERO = nativeIntToBinary128Bits(0);
const ONE = nativeIntToBinary128Bits(1);
const TEN = nativeIntToBinary128Bits(10);
const TEN_THOUSAND = nativeDoubleToBinary128Bits(10000);
const ONE_HUNDRED_MILLION = nativeDoubleToBinary128Bits(100000000);
const ARC_SECONDS_PER_RADIAN = nativeDoubleToBinary128Bits(648000 / Math.PI);

let tableBytesCache: Buffer | undefined;

export function nativeModeOneSeriesTransform0x1842b0(input: NativeBinary128Bits): NativeBinary128Bits {
  return nativeModeOneSeriesTransformTableZero0x1842b0(input, 20);
}

export function nativeModeOneSeriesTransformTableZero0x1842b0(
  input: NativeBinary128Bits,
  precision: number,
): NativeBinary128Bits {
  assertFinite(input);
  if (precision !== 3 && precision !== 20 && precision !== -1) {
    throw new NativeModeOneSeriesError(`native-mode-one-series:unported-precision:${precision}`);
  }

  const squared = nativeBinary128Multiply0x195cd0(input, input);
  const cubed = nativeBinary128Multiply0x195cd0(squared, input);
  const quartic = nativeBinary128Multiply0x195cd0(cubed, input);
  const quintic = nativeBinary128Multiply0x195cd0(quartic, input);
  const inputAfterTen = nativeBinary128Subtract0x196240(input, TEN);

  let accumulator = nativeBinary128Multiply0x195cd0(
    primaryPolynomial(input, squared, cubed, quartic),
    ARC_SECONDS_PER_RADIAN,
  );
  accumulator = nativeBinary128Add0x194c80(
    accumulator,
    secondaryPolynomial(input, squared, cubed, quartic, quintic),
  );

  if (nativeBinary128Compare0x1951f0(inputAfterTen, ZERO) > 0) {
    accumulator = nativeBinary128Add0x194c80(accumulator, positiveTailCorrection(inputAfterTen));
  }

  const normalizedSquared = nativeBinary128Divide0x1952a0(squared, TEN_THOUSAND);
  const normalizedCubed = nativeBinary128Divide0x1952a0(cubed, ONE_HUNDRED_MILLION);
  const normalizedQuartic = nativeBinary128Divide0x1952a0(quartic, ONE_HUNDRED_MILLION);
  let inputPower = ONE;

  for (let order = 0; order < ORDER_VALUE_COUNTS.length; order += 1) {
    let orderSum = ZERO;
    const start = ORDER_START_VALUES[order];
    const end = start + ORDER_VALUE_COUNTS[order];
    for (let index = start; index < end; index += TERM_STRIDE_VALUES) {
      let phase = nativeBinary128Add0x194c80(
        tableValue(index + 1),
        nativeBinary128Multiply0x195cd0(input, tableValue(index + 2)),
      );
      phase = nativeBinary128Add0x194c80(
        phase,
        nativeBinary128Multiply0x195cd0(normalizedSquared, tableValue(index + 3)),
      );
      phase = nativeBinary128Add0x194c80(
        phase,
        nativeBinary128Multiply0x195cd0(normalizedCubed, tableValue(index + 4)),
      );
      phase = nativeBinary128Add0x194c80(
        phase,
        nativeBinary128Multiply0x195cd0(normalizedQuartic, tableValue(index + 5)),
      );
      const weightedCosine = nativeBinary128Multiply0x195cd0(
        tableValue(index),
        nativeBinary128Cosl0x19a420(phase),
      );
      orderSum = nativeBinary128Add0x194c80(orderSum, weightedCosine);
    }

    accumulator = nativeBinary128Add0x194c80(
      accumulator,
      nativeBinary128Multiply0x195cd0(orderSum, inputPower),
    );
    inputPower = nativeBinary128Multiply0x195cd0(inputPower, input);
  }

  return nativeBinary128Divide0x1952a0(accumulator, ARC_SECONDS_PER_RADIAN);
}

export function nativeModeOneSeriesTableSha2560xdf6a0(): string {
  return createHash("sha256").update(tableBytes()).digest("hex");
}

export function nativeModeOneSeriesEvidenceContract(): NativeModeOneSeriesEvidenceContract {
  return {
    function: { address: "0x1842b0", endExclusive: "0x184969" },
    fixedCaller: {
      functionAddress: "0x1868e0",
      callAddress: "0x186ae0",
      tableIndex: 0,
      precision: 20,
    },
    additionalObservedCalls: [
      { functionAddress: "0x1859c0", callAddress: "0x185a27", tableIndex: 0, precision: 3 },
      { functionAddress: "0x1859c0", callAddress: "0x185dd3", tableIndex: 0, precision: 20 },
      { functionAddress: "0x1859c0", callAddress: "0x185fe0", tableIndex: 0, precision: -1 },
    ],
    offsetTable: {
      virtualAddress: "0x84cc0",
      entryIndex: 0,
      signedRelativeOffset: "0x11b610",
      relocationTableAddress: "0x1a02d0",
    },
    orderTables: [
      { pointerSlot: "0x1a02d0", relocationTarget: "0xdf6a0", valueCount: 2652 },
      { pointerSlot: "0x1a02d8", relocationTarget: "0xe9c60", valueCount: 894 },
      { pointerSlot: "0x1a02e0", relocationTarget: "0xed440", valueCount: 12 },
    ],
    tableAsset: {
      path: "assets/native-mode-one-table-0xdf6a0.bin",
      virtualAddress: "0xdf6a0",
      sourceFileOffset: "0xdf6a0",
      endExclusive: "0xed500",
      byteLength: TABLE_BYTE_LENGTH,
      valueWidthBytes: TABLE_VALUE_BYTES,
      sha256: TABLE_SHA256,
    },
    fixedPath: {
      orderValueCounts: [...ORDER_VALUE_COUNTS],
      termStrideValues: TERM_STRIDE_VALUES,
      termLayout: ["amplitude", "phase", "linear", "quadratic", "cubic", "quartic"],
      phaseNormalizers: [1, 1, 10000, 100000000, 100000000],
      positiveCorrectionThreshold: 10,
    },
    directHelperAddresses: {
      doubleToBinary128: "0x195a00",
      int32ToBinary128: "0x195c60",
      compare: ["0x195130", "0x1951f0"],
      add: "0x194c80",
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
      cosl: "0x19a420",
    },
    note: "fixed table-zero precision-20 numeric series only; no 0x1868e0, calendar, astrology, or chart parity is claimed",
  };
}

function primaryPolynomial(
  input: NativeBinary128Bits,
  squared: NativeBinary128Bits,
  cubed: NativeBinary128Bits,
  quartic: NativeBinary128Bits,
): NativeBinary128Bits {
  let value = nativeDoubleToBinary128Bits(3.81034409);
  value = nativeBinary128Add0x194c80(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(8399.684730072), input),
  );
  value = nativeBinary128Subtract0x196240(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(3.319e-5), squared),
  );
  value = nativeBinary128Add0x194c80(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(3.11e-8), cubed),
  );
  return nativeBinary128Subtract0x196240(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(2.033e-10), quartic),
  );
}

function secondaryPolynomial(
  input: NativeBinary128Bits,
  squared: NativeBinary128Bits,
  cubed: NativeBinary128Bits,
  quartic: NativeBinary128Bits,
  quintic: NativeBinary128Bits,
): NativeBinary128Bits {
  let value = nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(5028.792262), input);
  value = nativeBinary128Add0x194c80(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(1.1124406), squared),
  );
  value = nativeBinary128Add0x194c80(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(7.699e-5), cubed),
  );
  value = nativeBinary128Subtract0x196240(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(2.3479e-5), quartic),
  );
  return nativeBinary128Subtract0x196240(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(1.78e-8), quintic),
  );
}

function positiveTailCorrection(inputAfterTen: NativeBinary128Bits): NativeBinary128Bits {
  let value = nativeDoubleToBinary128Bits(-0.866);
  value = nativeBinary128Add0x194c80(
    value,
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(1.43), inputAfterTen),
  );
  let squaredTerm = nativeBinary128Multiply0x195cd0(
    nativeDoubleToBinary128Bits(0.054),
    inputAfterTen,
  );
  squaredTerm = nativeBinary128Multiply0x195cd0(squaredTerm, inputAfterTen);
  return nativeBinary128Add0x194c80(value, squaredTerm);
}

function tableValue(index: number): NativeBinary128Bits {
  if (!Number.isInteger(index) || index < 0 || index * TABLE_VALUE_BYTES + TABLE_VALUE_BYTES > TABLE_BYTE_LENGTH) {
    throw new NativeModeOneSeriesError(`native-mode-one-series:table-index:${index}`);
  }
  const bytes = tableBytes();
  const offset = index * TABLE_VALUE_BYTES;
  return {
    low: bytes.readBigUInt64LE(offset),
    high: bytes.readBigUInt64LE(offset + 8),
  };
}

function tableBytes(): Buffer {
  if (tableBytesCache === undefined) {
    const path = resolve(__dirname, "../../../assets", TABLE_ASSET_NAME);
    const bytes = readFileSync(path);
    if (bytes.length !== TABLE_BYTE_LENGTH) {
      throw new NativeModeOneSeriesError(
        `native-mode-one-series:table-size:${bytes.length}:expected:${TABLE_BYTE_LENGTH}`,
      );
    }
    tableBytesCache = bytes;
  }
  return tableBytesCache;
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeModeOneSeriesError("native-mode-one-series:non-finite-input");
  }
}

export class NativeModeOneSeriesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeModeOneSeriesError";
  }
}
