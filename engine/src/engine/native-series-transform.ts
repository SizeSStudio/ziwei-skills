import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  NativeBinary128Bits,
  nativeBinary128Add0x194c80,
  nativeBinary128BitsToInt,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "./native-numeric";
import { nativeBinary128Cosl0x19a420 } from "./native-trig";

export type NativeSeriesTransformEvidenceContract = {
  function: { address: string; endExclusive: string };
  fixedCaller: {
    functionAddress: string;
    callAddress: string;
    tableIndex: number;
    variant: number;
    precision: number;
  };
  additionalObservedCalls: Array<{
    functionAddress: string;
    callAddress: string;
    tableIndex: number;
    variant: number;
    precision: number;
  }>;
  pointerTable: {
    virtualAddress: string;
    entryIndex: number;
    relocationTarget: string;
  };
  tableAsset: {
    path: string;
    virtualAddress: string;
    sourceFileOffset: string;
    byteLength: number;
    valueWidthBytes: number;
    sha256: string;
  };
  fixedPath: {
    normalizedInputDivisor: number;
    orderCount: number;
    termStrideValues: number;
    termLayout: string[];
    maximumTableIndexInclusive: number;
    requiredPrefixBytes: number;
    requiredPrefixSha256: string;
  };
  directHelperAddresses: {
    cosl: string;
    floorl: string;
    int32ToBinary128: string;
    binary128ToInt32: string;
    compare: string[];
    add: string;
    subtract: string;
    multiply: string;
    divide: string;
  };
  note: string;
};

const TABLE_ASSET_NAME = "native-series-table-0x84cd0.bin";
const TABLE_BYTE_LENGTH = 0xa6a0;
const TABLE_VALUE_BYTES = 0x10;
const TABLE_SHA256 = "da7fd1a16f6f5181611673c00eba8a386080ac8bc18053a3e1b714a29e0a867b";
const REQUIRED_PREFIX_BYTES = 0x47d0;
const REQUIRED_PREFIX_SHA256 = "4b4f98802adf7d83863081342fe76f69b4271a76b86624aaed2415de6e70fcf8";

const ZERO = nativeIntToBinary128Bits(0);
const ONE = nativeIntToBinary128Bits(1);
const THREE = nativeIntToBinary128Bits(3);
const TEN = nativeIntToBinary128Bits(10);
const HALF = nativeDoubleToBinary128Bits(0.5);

const MODE_ZERO_CORRECTION_0 = nativeDoubleToBinary128Bits(-0.0728);
const MODE_ZERO_CORRECTION_1 = nativeDoubleToBinary128Bits(2.7702);
const MODE_ZERO_CORRECTION_2 = nativeDoubleToBinary128Bits(1.1019);
const MODE_ZERO_CORRECTION_3 = nativeDoubleToBinary128Bits(0.0996);
const MODE_ZERO_CORRECTION_DIVISOR = nativeDoubleToBinary128Bits(648000 / Math.PI);

let tableBytesCache: Buffer | undefined;

export function nativeSeriesTransformModeZero0x183d40(input: NativeBinary128Bits): NativeBinary128Bits {
  return nativeSeriesTransformTableZero0x183d40(input, 8);
}

export function nativeSeriesTransformTableZero0x183d40(
  input: NativeBinary128Bits,
  precision: number,
): NativeBinary128Bits {
  assertFinite(input);
  if (!Number.isInteger(precision) || precision < -0x80000000 || precision > 0x7fffffff) {
    throw new NativeSeriesTransformError(`native-series-transform:invalid-precision:${precision}`);
  }
  const scaledInput = nativeBinary128Divide0x1952a0(input, TEN);
  const intervalWidth = nativeBinary128Subtract0x196240(tableValue(2), tableValue(1));
  let accumulator = ZERO;
  let inputPower = ONE;

  for (let order = 0; order < 6; order += 1) {
    const lower = tableValue(1 + order);
    const upper = tableValue(2 + order);
    const delta = nativeBinary128Subtract0x196240(upper, lower);
    let selectedEnd = upper;

    if (nativeBinary128Compare0x195130(delta, ZERO) !== 0 && precision >= 0) {
      const scaledDelta = nativeBinary128Multiply0x195cd0(nativeIntToBinary128Bits(Math.imul(precision, 3)), delta);
      const normalizedDelta = nativeBinary128Divide0x1952a0(scaledDelta, intervalWidth);
      const rounded = nativeBinary128Floorl0x19a380(nativeBinary128Add0x194c80(normalizedDelta, HALF));
      let candidate = nativeBinary128Add0x194c80(rounded, lower);
      if (order !== 0) {
        candidate = nativeBinary128Add0x194c80(candidate, THREE);
      }
      if (nativeBinary128Compare0x1951f0(candidate, upper) <= 0) {
        selectedEnd = candidate;
      }
    }

    const firstTermIndex = nativeBinary128BitsToInt(lower);
    const endTermIndex = nativeBinary128BitsToInt(selectedEnd);
    let orderSum = ZERO;
    for (let index = firstTermIndex; index < endTermIndex; index += 3) {
      const phase = tableValue(index + 1);
      const frequencyTerm = nativeBinary128Multiply0x195cd0(scaledInput, tableValue(index + 2));
      const angle = nativeBinary128Add0x194c80(phase, frequencyTerm);
      const weightedCosine = nativeBinary128Multiply0x195cd0(
        tableValue(index),
        nativeBinary128Cosl0x19a420(angle),
      );
      orderSum = nativeBinary128Add0x194c80(orderSum, weightedCosine);
    }

    accumulator = nativeBinary128Add0x194c80(
      accumulator,
      nativeBinary128Multiply0x195cd0(orderSum, inputPower),
    );
    inputPower = nativeBinary128Multiply0x195cd0(inputPower, scaledInput);
  }

  const seriesValue = nativeBinary128Divide0x1952a0(accumulator, tableValue(0));
  return nativeBinary128Add0x194c80(seriesValue, modeZeroCorrection(scaledInput));
}

export function nativeSeriesTransformTableSha2560x84cd0(): string {
  return createHash("sha256").update(tableBytes()).digest("hex");
}

export function nativeSeriesTransformEvidenceContract(): NativeSeriesTransformEvidenceContract {
  return {
    function: { address: "0x183d40", endExclusive: "0x1842a2" },
    fixedCaller: {
      functionAddress: "0x186e40",
      callAddress: "0x186f9b",
      tableIndex: 0,
      variant: 0,
      precision: 8,
    },
    additionalObservedCalls: [
      { functionAddress: "0x184970", callAddress: "0x184ca3", tableIndex: 0, variant: 0, precision: 50 },
      { functionAddress: "0x185800", callAddress: "0x18581e", tableIndex: 0, variant: 0, precision: -1 },
      { functionAddress: "0x1861d0", callAddress: "0x1863cc", tableIndex: 0, variant: 0, precision: 10 },
      { functionAddress: "0x1861d0", callAddress: "0x18671c", tableIndex: 0, variant: 0, precision: -1 },
    ],
    pointerTable: {
      virtualAddress: "0x1a0290",
      entryIndex: 0,
      relocationTarget: "0x84cd0",
    },
    tableAsset: {
      path: "assets/native-series-table-0x84cd0.bin",
      virtualAddress: "0x84cd0",
      sourceFileOffset: "0x84cd0",
      byteLength: TABLE_BYTE_LENGTH,
      valueWidthBytes: TABLE_VALUE_BYTES,
      sha256: TABLE_SHA256,
    },
    fixedPath: {
      normalizedInputDivisor: 10,
      orderCount: 6,
      termStrideValues: 3,
      termLayout: ["amplitude", "phase", "frequency"],
      maximumTableIndexInclusive: 1148,
      requiredPrefixBytes: REQUIRED_PREFIX_BYTES,
      requiredPrefixSha256: REQUIRED_PREFIX_SHA256,
    },
    directHelperAddresses: {
      cosl: "0x19a420",
      floorl: "0x19a380",
      int32ToBinary128: "0x195c60",
      binary128ToInt32: "0x195b60",
      compare: ["0x195130", "0x1951f0"],
      add: "0x194c80",
      subtract: "0x196240",
      multiply: "0x195cd0",
      divide: "0x1952a0",
    },
    note: "table-zero variant-zero numeric series transform only; no 0x1861d0, calendar, astrology, or chart parity is claimed",
  };
}

function modeZeroCorrection(scaledInput: NativeBinary128Bits): NativeBinary128Bits {
  const squared = nativeBinary128Multiply0x195cd0(scaledInput, scaledInput);
  const cubed = nativeBinary128Multiply0x195cd0(squared, scaledInput);
  let correction = nativeBinary128Subtract0x196240(
    MODE_ZERO_CORRECTION_0,
    nativeBinary128Multiply0x195cd0(MODE_ZERO_CORRECTION_1, scaledInput),
  );
  correction = nativeBinary128Subtract0x196240(
    correction,
    nativeBinary128Multiply0x195cd0(MODE_ZERO_CORRECTION_2, squared),
  );
  correction = nativeBinary128Subtract0x196240(
    correction,
    nativeBinary128Multiply0x195cd0(MODE_ZERO_CORRECTION_3, cubed),
  );
  return nativeBinary128Divide0x1952a0(correction, MODE_ZERO_CORRECTION_DIVISOR);
}

function tableValue(index: number): NativeBinary128Bits {
  if (!Number.isInteger(index) || index < 0 || index * TABLE_VALUE_BYTES + TABLE_VALUE_BYTES > TABLE_BYTE_LENGTH) {
    throw new NativeSeriesTransformError(`native-series-transform:table-index:${index}`);
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
      throw new NativeSeriesTransformError(
        `native-series-transform:table-size:${bytes.length}:expected:${TABLE_BYTE_LENGTH}`,
      );
    }
    tableBytesCache = bytes;
  }
  return tableBytesCache;
}

function assertFinite(input: NativeBinary128Bits): void {
  if (((input.high >> 48n) & 0x7fffn) === 0x7fffn) {
    throw new NativeSeriesTransformError("native-series-transform:non-finite-input");
  }
}

export class NativeSeriesTransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeSeriesTransformError";
  }
}
