import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeAngleTransformError,
  nativeAngleTransform0x184970,
  nativeAngleTransformEvidenceContract,
} from "../../src/engine/native-angle-transform";
import {
  NativeBinary128Bits,
  nativeBinary128Divide0x1952a0,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const vectors: readonly { label: string; input: NativeBinary128Bits; expected: NativeBinary128Bits }[] = [
  {
    label: "J2000 origin",
    input: nativeIntToBinary128Bits(0),
    expected: bits(0xfb781ff58deff9d5n, 0xbff62aa316117c38n),
  },
  {
    label: "negative one fiftieth century",
    input: nativeDoubleToBinary128Bits(-0.02),
    expected: bits(0xffa6cd45562546d6n, 0xbff62aafcaef9acbn),
  },
  {
    label: "positive one fiftieth century",
    input: nativeDoubleToBinary128Bits(0.02),
    expected: bits(0xb38bf61f812c3854n, 0xbff62b31720e8ad1n),
  },
  {
    label: "1998 fixture day offset",
    input: nativeBinary128Divide0x1952a0(
      nativeIntToBinary128Bits(-680),
      nativeIntToBinary128Bits(36525),
    ),
    expected: bits(0x3ce25f9609d093c6n, 0xbff8389dcc616b7cn),
  },
];

test("ports the complete binary128 orchestration in helper 0x184970", () => {
  for (const vector of vectors) {
    assert.deepEqual(nativeAngleTransform0x184970(vector.input), vector.expected, vector.label);
  }
});

test("rejects non-finite inputs before invoking the helper graph", () => {
  assert.throws(
    () => nativeAngleTransform0x184970(bits(0n, 0x7fff000000000000n)),
    NativeAngleTransformError,
  );
});

test("exports the disassembled helper graph and double-derived constants", () => {
  assert.deepEqual(nativeAngleTransformEvidenceContract(), {
    function: { address: "0x184970", endExclusive: "0x185152" },
    observedCaller: { functionAddress: "0x14dbd0", callAddress: "0x14df07" },
    directHelpers: [
      { address: "0x183d40", callAddresses: ["0x184ca3"] },
      { address: "0x19a410", callAddresses: ["0x184ff7", "0x18508d"] },
      { address: "0x19a420", callAddresses: ["0x184b91", "0x184db8", "0x184e61", "0x184eb7", "0x184f19", "0x184f6c", "0x184f8c", "0x185043"] },
      { address: "0x19a430", callAddresses: ["0x184b49", "0x184f5f", "0x184f7c"] },
      { address: "0x19a440", callAddresses: ["0x184fc3"] },
      { address: "0x19a450", callAddresses: ["0x184fa5"] },
    ],
    doubleDerivedConstants: {
      arcsecondsPerRadian: 206264.80624709636,
      baseCorrection: 0.00009938680462745487,
      eccentricityDivisor: 206264.80624709636,
    },
    characterizationVectorCount: vectors.length,
    note: "binary128 astronomy helper only; no 0x14dbd0 output, calendar, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
