import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeTransformError,
  nativePiecewiseTransform0x183380,
  nativePiecewiseTransformBranch0x183380,
  nativeTransformEvidenceContracts,
  nativeTransformTableSha2560x84510,
  nativeTransformWrapper0x183830,
} from "../../src/engine/native-transform";

test("ports native wrapper 0x183830 with exact binary128 operation order", () => {
  const vectors = [
    {
      label: "zero input",
      input: { low: 0x0n, high: 0x0n },
      expected: { low: 0x3fb72ea61d950c84n, high: 0x3ff48392975eb568n },
    },
    {
      label: "interior table row",
      input: { low: 0x9c00000000000000n, high: 0x4008c88d99999999n },
      expected: { low: 0x64ee2cc0a9e87c66n, high: 0x3ff4869b5072cf32n },
    },
    {
      label: "2015 boundary",
      input: { low: 0x3500000000000000n, high: 0x400b566a33333333n },
      expected: { low: 0x091a2b3c4d5e6f81n, high: 0x3ff4a2b3c4d5e6f8n },
    },
    {
      label: "2115 boundary",
      input: { low: 0x6820000000000000n, high: 0x400e4825c6666666n },
      expected: { low: 0x9459de88bee768aan, high: 0x3ff67aebf5bead27n },
    },
    {
      label: "negative 500 boundary",
      input: { low: 0x0258000000000000n, high: 0xc012bdda48000000n },
      expected: { low: 0xd6a9264e209dc598n, high: 0x3ffc97ba375f31aen },
    },
  ];

  for (const vector of vectors) {
    assert.deepEqual(nativeTransformWrapper0x183830(vector.input), vector.expected, vector.label);
  }
});

test("selects exact table rows at native 0x183380 boundaries", () => {
  assert.deepEqual(nativePiecewiseTransform0x183380({ low: 0n, high: 0xc007f40000000000n }), {
    low: 0n,
    high: 0x400d0cc400000000n,
  });
  assert.deepEqual(nativePiecewiseTransform0x183380({ low: 0n, high: 0x4009f40000000000n }), {
    low: 0xf000000000000000n,
    high: 0x4004fef5c28f5c28n,
  });
  assert.deepEqual(nativePiecewiseTransform0x183380({ low: 0n, high: 0x4009f54000000000n }), {
    low: 0xd000000000000000n,
    high: 0x400502ccccccccccn,
  });
});

test("implements the native 2015 bridge and 2115 quadratic boundary", () => {
  assert.deepEqual(nativePiecewiseTransform0x183380({ low: 0n, high: 0x4009f7c000000000n }), {
    low: 0n,
    high: 0x4005140000000000n,
  });
  assert.deepEqual(nativePiecewiseTransform0x183380({ low: 0n, high: 0x400a086000000000n }), {
    low: 0xae147ae147ae147cn,
    high: 0x4006f38e147ae147n,
  });
});

test("matches independent exact-binary128 characterization vectors across native branches", () => {
  // Expected bits come from /tmp/ziwei-0x183380-independent-evaluator.py, which reads the APK x86_64 table slice and follows 0x183380 disassembly without importing this port.
  const vectors = [
    {
      label: "table row 18 interior input with nonzero low limb",
      input: { low: 0x0123456789abcdefn, high: 0x4009f4a000000000n },
      expectedBranch: "table-row-18",
      expected: { low: 0x7bac114b5225c63fn, high: 0x4005017ae147ae14n },
    },
    {
      label: "one ULP below 1900 selects table row 12",
      input: { low: 0xffffffffffffffffn, high: 0x4009daffffffffffn },
      expectedBranch: "table-row-12",
      expected: { low: 0xab000000000001d8n, high: 0xc000999999999999n },
    },
    {
      label: "one ULP above 1900 selects table row 13",
      input: { low: 0x0000000000000001n, high: 0x4009db0000000000n },
      expectedBranch: "table-row-13",
      expected: { low: 0x5ffffffffffffdf1n, high: 0xc000266666666666n },
    },
    {
      label: "one ULP below 2015 remains in table row 19",
      input: { low: 0xffffffffffffffffn, high: 0x4009f7bfffffffffn },
      expectedBranch: "table-row-19",
      expected: { low: 0xd03ffffffffffffan, high: 0x400512ccccccccccn },
    },
    {
      label: "2015 selects the bridge",
      input: { low: 0x0000000000000000n, high: 0x4009f7c000000000n },
      expectedBranch: "bridge",
      expected: { low: 0x0000000000000000n, high: 0x4005140000000000n },
    },
    {
      label: "one ULP above 2015 remains in the bridge",
      input: { low: 0x0000000000000001n, high: 0x4009f7c000000000n },
      expectedBranch: "bridge",
      expected: { low: 0x0000000000000018n, high: 0x4005140000000000n },
    },
    {
      label: "one ULP below 2115 remains in the bridge",
      input: { low: 0xffffffffffffffffn, high: 0x400a085fffffffffn },
      expectedBranch: "bridge",
      expected: { low: 0xae147ae147ae1459n, high: 0x4006f38e147ae147n },
    },
    {
      label: "2115 remains in the bridge boundary path",
      input: { low: 0x0000000000000000n, high: 0x400a086000000000n },
      expectedBranch: "bridge",
      expected: { low: 0xae147ae147ae147cn, high: 0x4006f38e147ae147n },
    },
    {
      label: "one ULP above 2115 selects the quadratic path",
      input: { low: 0x0000000000000001n, high: 0x400a086000000000n },
      expectedBranch: "quadratic",
      expected: { low: 0xae147ae147ae1498n, high: 0x4006f38e147ae147n },
    },
  ];

  for (const vector of vectors) {
    assert.equal(nativePiecewiseTransformBranch0x183380(vector.input), vector.expectedBranch, `${vector.label}: branch`);
    const actual = nativePiecewiseTransform0x183380(vector.input);
    assert.equal(actual.low, vector.expected.low, `${vector.label}: low limb`);
    assert.equal(actual.high, vector.expected.high, `${vector.label}: high limb`);
  }
});

test("rejects non-finite binary128 inputs with a neutral transform error", () => {
  for (const input of [
    { low: 0n, high: 0x7fff000000000000n },
    { low: 1n, high: 0x7fff800000000000n },
    { low: 0n, high: 0xffff000000000000n },
  ]) {
    assert.throws(() => nativePiecewiseTransform0x183380(input), NativeTransformError);
    assert.throws(() => nativeTransformWrapper0x183830(input), NativeTransformError);
  }
});

test("exports native transform evidence without calendar or chart semantics", () => {
  assert.deepEqual(nativeTransformEvidenceContracts(), {
    functions: {
      piecewiseTransform: { address: "0x183380", fdeStart: "0x183380", fdeEndExclusive: "0x183827" },
      wrapper: { address: "0x183830", fdeStart: "0x183830", fdeEndExclusive: "0x183897" },
    },
    table: {
      virtualAddress: "0x84510",
      fileOffset: "0x84510",
      rowStrideBytes: 0x50,
      rowCount: 21,
      valueWidthBytes: 0x10,
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
  });
});

test("matches the SHA-256 of the raw 0x690-byte APK table slice at 0x84510", () => {
  assert.equal(nativeTransformTableSha2560x84510(), "eccd3c79a1ab13ca5ada8cfbe6aafc9a64e8d1c29ef7d8cd27df2bcd9ede42ef");
});
