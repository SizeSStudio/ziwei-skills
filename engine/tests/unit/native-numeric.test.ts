import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeBinary128BitsToInt,
  nativeBinary128BitsToDouble,
  nativeBinary128BitsToUint64,
  nativeBinary128Add0x194c80,
  nativeBinary128Compare0x195130,
  nativeBinary128Compare0x1951f0,
  nativeBinary128Divide0x1952a0,
  nativeBinary128Floorl0x19a380,
  nativeBinary128Fmodl0x19a410,
  nativeBinary128Multiply0x195cd0,
  nativeBinary128Subtract0x196240,
  nativeBinary128HelperContracts,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

test("ports native int32 to binary128 conversion from 0x195c60", () => {
  assert.deepEqual(nativeIntToBinary128Bits(0), { low: 0n, high: 0n });
  assert.deepEqual(nativeIntToBinary128Bits(1), { low: 0n, high: 0x3fff000000000000n });
  assert.deepEqual(nativeIntToBinary128Bits(-1), { low: 0n, high: 0xbfff000000000000n });
  assert.deepEqual(nativeIntToBinary128Bits(2), { low: 0n, high: 0x4000000000000000n });
  assert.deepEqual(nativeIntToBinary128Bits(3), { low: 0n, high: 0x4000800000000000n });
});

test("ports native double to binary128 conversion from 0x195a00", () => {
  assert.deepEqual(nativeDoubleToBinary128Bits(1), { low: 0n, high: 0x3fff000000000000n });
  assert.deepEqual(nativeDoubleToBinary128Bits(0.5), { low: 0n, high: 0x3ffe000000000000n });
  assert.deepEqual(nativeDoubleToBinary128Bits(3.5), { low: 0n, high: 0x4000c00000000000n });
  assert.deepEqual(nativeDoubleToBinary128Bits(-3.5), { low: 0n, high: 0xc000c00000000000n });
  assert.deepEqual(nativeDoubleToBinary128Bits(-0), { low: 0n, high: 0x8000000000000000n });
});

test("ports native binary128 to int32 conversion from 0x195b60", () => {
  for (const value of [0, 1, -1, 2, 3, -3, 12345, -12345, 0x7fffffff, -0x80000000]) {
    assert.equal(nativeBinary128BitsToInt(nativeIntToBinary128Bits(value)), value);
  }

  assert.equal(nativeBinary128BitsToInt(nativeDoubleToBinary128Bits(3.5)), 3);
  assert.equal(nativeBinary128BitsToInt(nativeDoubleToBinary128Bits(-3.5)), -3);
  assert.equal(nativeBinary128BitsToInt({ low: 0n, high: 0x401f000000000000n }), 0x7fffffff);
  assert.equal(nativeBinary128BitsToInt({ low: 0n, high: 0xc01f000000000000n }), -0x80000000);
});

test("ports native binary128 to uint64 conversion from 0x195be0", () => {
  assert.equal(nativeBinary128BitsToUint64(nativeIntToBinary128Bits(-1)), 0n);
  assert.equal(nativeBinary128BitsToUint64(nativeDoubleToBinary128Bits(0.5)), 0n);
  assert.equal(nativeBinary128BitsToUint64(nativeIntToBinary128Bits(1)), 1n);
  assert.equal(nativeBinary128BitsToUint64(nativeDoubleToBinary128Bits(3.5)), 3n);
  assert.equal(nativeBinary128BitsToUint64(binary128PowerOfTwo(63)), 1n << 63n);
  assert.equal(nativeBinary128BitsToUint64(binary128PowerOfTwo(64)), (1n << 64n) - 1n);
  assert.equal(nativeBinary128BitsToUint64({ low: 0n, high: 0x7fff000000000000n }), (1n << 64n) - 1n);
});

test("ports native binary128 to double conversion from 0x196270", () => {
  assert.equal(doubleBits(nativeBinary128BitsToDouble({ low: 0n, high: 0n })), 0n);
  assert.equal(doubleBits(nativeBinary128BitsToDouble({ low: 0n, high: 0x8000000000000000n })), 0x8000000000000000n);

  for (const value of [1, 0.5, 3.5, -3.5, 12345.25, Number.MIN_VALUE]) {
    assert.equal(doubleBits(nativeBinary128BitsToDouble(nativeDoubleToBinary128Bits(value))), doubleBits(value));
  }

  assert.equal(
    doubleBits(nativeBinary128BitsToDouble({ low: 0n, high: 0x7fff000000000000n })),
    0x7ff0000000000000n,
  );
  assert.equal(
    doubleBits(nativeBinary128BitsToDouble({ low: 0n, high: 0xffff000000000000n })),
    0xfff0000000000000n,
  );
});

test("rounds binary128 to double with native round-to-nearest-even behavior", () => {
  assert.equal(
    doubleBits(nativeBinary128BitsToDouble({ low: 1n << 59n, high: 0x3fff000000000000n })),
    0x3ff0000000000000n,
  );
  assert.equal(
    doubleBits(nativeBinary128BitsToDouble({ low: (1n << 59n) + 1n, high: 0x3fff000000000000n })),
    0x3ff0000000000001n,
  );
});

test("ports native binary128 compare helper 0x195130 with positive unordered polarity", () => {
  assert.equal(nativeBinary128Compare0x195130(nativeIntToBinary128Bits(1), nativeIntToBinary128Bits(2)), -1);
  assert.equal(nativeBinary128Compare0x195130(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(1)), 1);
  assert.equal(nativeBinary128Compare0x195130(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(2)), 0);
  assert.equal(nativeBinary128Compare0x195130(nativeIntToBinary128Bits(-2), nativeIntToBinary128Bits(-1)), -1);
  assert.equal(nativeBinary128Compare0x195130({ low: 0n, high: 0x8000000000000000n }, { low: 0n, high: 0n }), 0);
  assert.equal(nativeBinary128Compare0x195130({ low: 0n, high: 0x7fff000000000000n }, nativeIntToBinary128Bits(2)), 1);
  assert.equal(nativeBinary128Compare0x195130({ low: 1n, high: 0x7fff000000000000n }, nativeIntToBinary128Bits(2)), 1);
});

test("ports native binary128 compare helper 0x1951f0 with negative unordered polarity", () => {
  assert.equal(nativeBinary128Compare0x1951f0(nativeIntToBinary128Bits(1), nativeIntToBinary128Bits(2)), -1);
  assert.equal(nativeBinary128Compare0x1951f0(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(1)), 1);
  assert.equal(nativeBinary128Compare0x1951f0(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(2)), 0);
  assert.equal(nativeBinary128Compare0x1951f0(nativeIntToBinary128Bits(-1), nativeIntToBinary128Bits(-2)), 1);
  assert.equal(nativeBinary128Compare0x1951f0({ low: 0n, high: 0x8000000000000000n }, { low: 0n, high: 0n }), 0);
  assert.equal(nativeBinary128Compare0x1951f0({ low: 0n, high: 0xffff000000000000n }, nativeIntToBinary128Bits(2)), -1);
  assert.equal(nativeBinary128Compare0x1951f0({ low: 1n, high: 0x7fff000000000000n }, nativeIntToBinary128Bits(2)), -1);
});

test("ports native binary128 add helper 0x194c80 for finite values and native rounding", () => {
  assert.deepEqual(
    nativeBinary128Add0x194c80(nativeIntToBinary128Bits(1), nativeIntToBinary128Bits(2)),
    nativeIntToBinary128Bits(3),
  );
  assert.deepEqual(
    nativeBinary128Add0x194c80(nativeIntToBinary128Bits(-2), nativeIntToBinary128Bits(-3)),
    nativeIntToBinary128Bits(-5),
  );
  assert.deepEqual(
    nativeBinary128Add0x194c80(nativeIntToBinary128Bits(1), nativeIntToBinary128Bits(-1)),
    { low: 0n, high: 0n },
  );

  assert.deepEqual(
    nativeBinary128Add0x194c80(nativeIntToBinary128Bits(1), binary128PowerOfTwo(-113)),
    nativeIntToBinary128Bits(1),
  );
  assert.deepEqual(
    nativeBinary128Add0x194c80(nativeIntToBinary128Bits(1), { low: 1n, high: 0x3f8e000000000000n }),
    { low: 1n, high: 0x3fff000000000000n },
  );
});

test("ports native binary128 subtract wrapper 0x196240 as sign-flip into add", () => {
  assert.deepEqual(
    nativeBinary128Subtract0x196240(nativeIntToBinary128Bits(5), nativeIntToBinary128Bits(2)),
    nativeIntToBinary128Bits(3),
  );
  assert.deepEqual(
    nativeBinary128Subtract0x196240(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(5)),
    nativeIntToBinary128Bits(-3),
  );
  assert.deepEqual(
    nativeBinary128Subtract0x196240({ low: 1n, high: 0x3fff000000000000n }, nativeIntToBinary128Bits(1)),
    binary128PowerOfTwo(-112),
  );
});

test("ports native binary128 multiply helper 0x195cd0 for finite values and native rounding", () => {
  assert.deepEqual(
    nativeBinary128Multiply0x195cd0(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(3)),
    nativeIntToBinary128Bits(6),
  );
  assert.deepEqual(
    nativeBinary128Multiply0x195cd0(nativeIntToBinary128Bits(-2), nativeIntToBinary128Bits(3)),
    nativeIntToBinary128Bits(-6),
  );
  assert.deepEqual(
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(0.5), nativeDoubleToBinary128Bits(0.5)),
    nativeDoubleToBinary128Bits(0.25),
  );
  assert.deepEqual(
    nativeBinary128Multiply0x195cd0(nativeDoubleToBinary128Bits(1.5), nativeDoubleToBinary128Bits(1.5)),
    nativeDoubleToBinary128Bits(2.25),
  );

  assert.deepEqual(
    nativeBinary128Multiply0x195cd0(
      { low: 1n, high: 0x3fff000000000000n },
      { low: 1n, high: 0x3fff000000000000n },
    ),
    { low: 2n, high: 0x3fff000000000000n },
  );
});

test("ports native binary128 multiply helper 0x195cd0 special finite boundaries", () => {
  assert.deepEqual(
    nativeBinary128Multiply0x195cd0({ low: 0n, high: 0n }, nativeIntToBinary128Bits(-3)),
    { low: 0n, high: 0x8000000000000000n },
  );
  assert.deepEqual(
    nativeBinary128Multiply0x195cd0({ low: 0n, high: 0x7fff000000000000n }, nativeIntToBinary128Bits(-2)),
    { low: 0n, high: 0xffff000000000000n },
  );
});

test("ports native binary128 divide helper 0x1952a0 for finite values and native rounding", () => {
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeIntToBinary128Bits(6), nativeIntToBinary128Bits(2)),
    nativeIntToBinary128Bits(3),
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeIntToBinary128Bits(-3), nativeIntToBinary128Bits(2)),
    nativeDoubleToBinary128Bits(-1.5),
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeDoubleToBinary128Bits(0.5), nativeDoubleToBinary128Bits(0.25)),
    nativeIntToBinary128Bits(2),
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeIntToBinary128Bits(1), nativeIntToBinary128Bits(3)),
    { low: 0x5555555555555555n, high: 0x3ffd555555555555n },
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeIntToBinary128Bits(2), nativeIntToBinary128Bits(3)),
    { low: 0x5555555555555555n, high: 0x3ffe555555555555n },
  );
});

test("ports native binary128 divide helper 0x1952a0 special finite boundaries", () => {
  assert.deepEqual(
    nativeBinary128Divide0x1952a0({ low: 0n, high: 0n }, nativeIntToBinary128Bits(-3)),
    { low: 0n, high: 0x8000000000000000n },
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeIntToBinary128Bits(3), { low: 0n, high: 0x8000000000000000n }),
    { low: 0n, high: 0xffff000000000000n },
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0({ low: 0n, high: 0x7fff000000000000n }, nativeIntToBinary128Bits(-2)),
    { low: 0n, high: 0xffff000000000000n },
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0(nativeIntToBinary128Bits(-2), { low: 0n, high: 0x7fff000000000000n }),
    { low: 0n, high: 0x8000000000000000n },
  );
  assert.deepEqual(
    nativeBinary128Divide0x1952a0({ low: 0n, high: 0x7fff000000000000n }, { low: 0n, high: 0xffff000000000000n }),
    { low: 0n, high: 0x7fff800000000000n },
  );
});

test("ports the floorl PLT dependency used by 0x181490 without double rounding", () => {
  assert.deepEqual(nativeBinary128Floorl0x19a380(nativeDoubleToBinary128Bits(3.5)), nativeIntToBinary128Bits(3));
  assert.deepEqual(nativeBinary128Floorl0x19a380(nativeDoubleToBinary128Bits(-3.5)), nativeIntToBinary128Bits(-4));
  assert.deepEqual(nativeBinary128Floorl0x19a380(nativeDoubleToBinary128Bits(0.5)), { low: 0n, high: 0n });
  assert.deepEqual(nativeBinary128Floorl0x19a380(nativeDoubleToBinary128Bits(-0.5)), nativeIntToBinary128Bits(-1));
  assert.deepEqual(nativeBinary128Floorl0x19a380(nativeIntToBinary128Bits(-3)), nativeIntToBinary128Bits(-3));
  assert.deepEqual(nativeBinary128Floorl0x19a380({ low: 0n, high: 0x8000000000000000n }), {
    low: 0n,
    high: 0x8000000000000000n,
  });
  assert.deepEqual(nativeBinary128Floorl0x19a380({ low: 0n, high: 0x7fff000000000000n }), {
    low: 0n,
    high: 0x7fff000000000000n,
  });
  assert.deepEqual(nativeBinary128Floorl0x19a380({ low: 1n, high: 0x7fff000000000000n }), {
    low: 1n,
    high: 0x7fff800000000000n,
  });
});

test("ports the fmodl PLT dependency used by 0x181490 with binary128 remainder semantics", () => {
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410(nativeDoubleToBinary128Bits(5.5), nativeIntToBinary128Bits(2)),
    nativeDoubleToBinary128Bits(1.5),
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410(nativeDoubleToBinary128Bits(-5.5), nativeIntToBinary128Bits(2)),
    nativeDoubleToBinary128Bits(-1.5),
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410(nativeDoubleToBinary128Bits(5.5), nativeIntToBinary128Bits(-2)),
    nativeDoubleToBinary128Bits(1.5),
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410(nativeDoubleToBinary128Bits(0.5), nativeIntToBinary128Bits(2)),
    nativeDoubleToBinary128Bits(0.5),
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410({ low: 0n, high: 0x8000000000000000n }, nativeIntToBinary128Bits(2)),
    { low: 0n, high: 0x8000000000000000n },
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410(nativeIntToBinary128Bits(2), { low: 0n, high: 0x7fff000000000000n }),
    nativeIntToBinary128Bits(2),
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410({ low: 0n, high: 0x7fff000000000000n }, nativeIntToBinary128Bits(2)),
    { low: 0n, high: 0x7fff800000000000n },
  );
  assert.deepEqual(
    nativeBinary128Fmodl0x19a410(nativeIntToBinary128Bits(2), { low: 0n, high: 0n }),
    { low: 0n, high: 0x7fff800000000000n },
  );
});

test("documents native binary128 helper addresses without claiming full arithmetic port", () => {
  assert.deepEqual(nativeBinary128HelperContracts(), {
    representation: {
      exponentBits: 15,
      fractionBits: 112,
      exponentBias: 0x3fff,
      signMask: 0x8000000000000000n,
      exponentMask: 0x7fffn,
      highFractionMask: 0xffffffffffffn,
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
  });
});

function doubleBits(value: number): bigint {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, true);
  return view.getBigUint64(0, true);
}

function binary128PowerOfTwo(power: number) {
  return { low: 0n, high: BigInt(power + 0x3fff) << 48n };
}
