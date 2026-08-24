import test from "node:test";
import assert from "node:assert/strict";
import { nativeIntToBinary128Bits } from "../../src/engine/native-numeric";
import {
  NativeVectorError,
  nativeAssignBinary128VectorRange0x183230,
  nativeAppendBinary128Vector0x183000,
  nativeAppendInt32Vector0x14bcb0,
  nativeAppendInt32Vector0x183110,
  nativeVectorHelperContracts,
} from "../../src/engine/native-vector";

test("documents native vector append helper contracts used by 0x182880", () => {
  assert.deepEqual(nativeVectorHelperContracts(), {
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
  });
});

test("ports native int32 vector append fast path and growth behavior", () => {
  assert.deepEqual(nativeAppendInt32Vector0x14bcb0({ items: [10, 20], capacity: 4 }, 30), {
    helperAddress: "0x14bcb0",
    elementBytes: 4,
    items: [10, 20, 30],
    capacity: 4,
    reallocated: false,
  });

  assert.deepEqual(nativeAppendInt32Vector0x14bcb0({ items: [10, 20], capacity: 2 }, 30), {
    helperAddress: "0x14bcb0",
    elementBytes: 4,
    items: [10, 20, 30],
    capacity: 4,
    reallocated: true,
  });

  assert.deepEqual(nativeAppendInt32Vector0x14bcb0({ items: [], capacity: 0 }, -1), {
    helperAddress: "0x14bcb0",
    elementBytes: 4,
    items: [-1],
    capacity: 1,
    reallocated: true,
  });

  assert.deepEqual(nativeAppendInt32Vector0x183110({ items: [0, 1, 2], capacity: 3 }, 3), {
    helperAddress: "0x183110",
    elementBytes: 4,
    items: [0, 1, 2, 3],
    capacity: 6,
    reallocated: true,
  });
});

test("ports native 16-byte vector append behavior for binary128 records", () => {
  const one = nativeIntToBinary128Bits(1);
  const two = nativeIntToBinary128Bits(2);

  assert.deepEqual(nativeAppendBinary128Vector0x183000({ items: [one], capacity: 1 }, two), {
    helperAddress: "0x183000",
    elementBytes: 16,
    items: [one, two],
    capacity: 2,
    reallocated: true,
  });
});

test("ports native 0x183230 range assignment for 16-byte record vectors", () => {
  const one = nativeIntToBinary128Bits(1);
  const two = nativeIntToBinary128Bits(2);
  const three = nativeIntToBinary128Bits(3);

  assert.deepEqual(nativeAssignBinary128VectorRange0x183230({ items: [one, two, three], capacity: 4 }, [three]), {
    helperAddress: "0x183230",
    elementBytes: 16,
    items: [three],
    capacity: 4,
    reallocated: false,
  });

  assert.deepEqual(nativeAssignBinary128VectorRange0x183230({ items: [one], capacity: 1 }, [one, two, three]), {
    helperAddress: "0x183230",
    elementBytes: 16,
    items: [one, two, three],
    capacity: 3,
    reallocated: true,
  });

  assert.deepEqual(nativeAssignBinary128VectorRange0x183230({ items: [one, two], capacity: 4 }, []), {
    helperAddress: "0x183230",
    elementBytes: 16,
    items: [],
    capacity: 4,
    reallocated: false,
  });
});

test("rejects vector states that native pointer arithmetic cannot represent", () => {
  assert.throws(
    () => nativeAppendInt32Vector0x14bcb0({ items: [1, 2], capacity: 1 }, 3),
    NativeVectorError,
  );
  assert.throws(() => nativeAppendInt32Vector0x14bcb0({ items: [], capacity: 0 }, 0x80000000), NativeVectorError);
});
