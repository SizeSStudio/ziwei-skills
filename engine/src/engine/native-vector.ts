import type { NativeBinary128Bits } from "./native-numeric";

export type NativeVectorState<T> = {
  items: readonly T[];
  capacity: number;
};

export type NativeVectorAppendResult<T> = {
  helperAddress: string;
  elementBytes: number;
  items: T[];
  capacity: number;
  reallocated: boolean;
};

export type NativeVectorAppendHelperContract = {
  address: string;
  elementBytes: number;
  fastPathStoreAddress: string;
  reallocateStoreAddress: string;
  currentEndWriteAddress: string;
  note: string;
};

export type NativeVectorRangeAssignHelperContract = {
  address: string;
  elementBytes: number;
  capacityCompareAddress: string;
  allocateAddress: string;
  copyAddresses: string[];
  currentEndWriteAddresses: string[];
  note: string;
};

export type NativeVectorHelperContracts = {
  int32Append0x14bcb0: NativeVectorAppendHelperContract;
  binary128Append0x183000: NativeVectorAppendHelperContract;
  int32Append0x183110: NativeVectorAppendHelperContract;
  binary128RangeAssign0x183230: NativeVectorRangeAssignHelperContract;
  note: string;
};

export function nativeVectorHelperContracts(): NativeVectorHelperContracts {
  return {
    int32Append0x14bcb0: {
      address: "0x14bcb0",
      elementBytes: 4,
      fastPathStoreAddress: "0x14bcd1",
      reallocateStoreAddress: "0x14bd53",
      currentEndWriteAddress: "0x14bd98",
      note: "appends one dword and grows capacity to max(size + 1, oldCapacity * 2) when full",
    },
    binary128Append0x183000: {
      address: "0x183000",
      elementBytes: 16,
      fastPathStoreAddress: "0x183021",
      reallocateStoreAddress: "0x1830a3",
      currentEndWriteAddress: "0x1830ea",
      note: "appends one 16-byte record and grows capacity to max(size + 1, oldCapacity * 2) when full",
    },
    int32Append0x183110: {
      address: "0x183110",
      elementBytes: 4,
      fastPathStoreAddress: "0x183131",
      reallocateStoreAddress: "0x1831b3",
      currentEndWriteAddress: "0x1831f8",
      note: "same dword vector append shape as 0x14bcb0, used for the ctx+0x68 derived index table",
    },
    binary128RangeAssign0x183230: {
      address: "0x183230",
      elementBytes: 16,
      capacityCompareAddress: "0x18325b",
      allocateAddress: "0x1832ce",
      copyAddresses: ["0x1832f2", "0x183322", "0x183339", "0x183355"],
      currentEndWriteAddresses: ["0x1832fa", "0x183341", "0x183360"],
      note: "assigns/replaces the destination vector with a 16-byte record range; it is not an append helper",
    },
    note: "these are C++ vector helper shapes used by 0x182880 context refill; they do not imply calendar semantic parity",
  };
}

export function nativeAppendInt32Vector0x14bcb0(
  vector: NativeVectorState<number>,
  value: number,
): NativeVectorAppendResult<number> {
  assertSignedInt32(value, "value");
  return nativeAppendVectorItem(vector, value, nativeVectorHelperContracts().int32Append0x14bcb0);
}

export function nativeAppendInt32Vector0x183110(
  vector: NativeVectorState<number>,
  value: number,
): NativeVectorAppendResult<number> {
  assertSignedInt32(value, "value");
  return nativeAppendVectorItem(vector, value, nativeVectorHelperContracts().int32Append0x183110);
}

export function nativeAppendBinary128Vector0x183000(
  vector: NativeVectorState<NativeBinary128Bits>,
  value: NativeBinary128Bits,
): NativeVectorAppendResult<NativeBinary128Bits> {
  return nativeAppendVectorItem(vector, normalizeBinary128Bits(value), nativeVectorHelperContracts().binary128Append0x183000);
}

export function nativeAssignBinary128VectorRange0x183230(
  vector: NativeVectorState<NativeBinary128Bits>,
  sourceItems: readonly NativeBinary128Bits[],
): NativeVectorAppendResult<NativeBinary128Bits> {
  assertVectorState(vector);
  const items = sourceItems.map(normalizeBinary128Bits);
  const reallocated = items.length > vector.capacity;
  const capacity = reallocated ? nativeVectorRangeAssignCapacity(items.length, vector.capacity) : vector.capacity;

  return {
    helperAddress: nativeVectorHelperContracts().binary128RangeAssign0x183230.address,
    elementBytes: nativeVectorHelperContracts().binary128RangeAssign0x183230.elementBytes,
    items,
    capacity,
    reallocated,
  };
}

function nativeAppendVectorItem<T>(
  vector: NativeVectorState<T>,
  value: T,
  contract: NativeVectorAppendHelperContract,
): NativeVectorAppendResult<T> {
  assertVectorState(vector);
  const size = vector.items.length;
  const reallocated = size >= vector.capacity;
  const capacity = reallocated ? nativeVectorNextCapacity(size, vector.capacity) : vector.capacity;

  return {
    helperAddress: contract.address,
    elementBytes: contract.elementBytes,
    items: [...vector.items, value],
    capacity,
    reallocated,
  };
}

function nativeVectorNextCapacity(size: number, capacity: number): number {
  const required = size + 1;
  const doubled = capacity * 2;
  return Math.max(required, doubled);
}

function nativeVectorRangeAssignCapacity(sourceSize: number, capacity: number): number {
  return Math.max(sourceSize, capacity * 2);
}

function normalizeBinary128Bits(bits: NativeBinary128Bits): NativeBinary128Bits {
  return {
    low: BigInt.asUintN(64, bits.low),
    high: BigInt.asUintN(64, bits.high),
  };
}

function assertVectorState<T>(vector: NativeVectorState<T>): void {
  assertNonNegativeInteger(vector.capacity, "capacity");
  if (vector.capacity < vector.items.length) {
    throw new NativeVectorError(`capacity must be >= current vector size: ${vector.capacity} < ${vector.items.length}`);
  }
}

function assertSignedInt32(value: number, field: string): void {
  if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7fffffff) {
    throw new NativeVectorError(`${field} must fit signed int32 native dword append: ${value}`);
  }
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new NativeVectorError(`${field} must be a non-negative integer: ${value}`);
  }
}

export class NativeVectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeVectorError";
  }
}
