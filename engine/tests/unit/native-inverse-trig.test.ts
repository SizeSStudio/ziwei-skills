import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeInverseTrigError,
  nativeBinary128Atan2l0x19a440,
  nativeBinary128Tanl0x19a450,
  nativeInverseTrigEvidenceContract,
} from "../../src/engine/native-inverse-trig";
import {
  NativeBinary128Bits,
  nativeDoubleToBinary128Bits,
  nativeIntToBinary128Bits,
} from "../../src/engine/native-numeric";

const ZERO = bits(0n, 0n);
const NEGATIVE_ZERO = bits(0n, 0x8000000000000000n);
const ONE = nativeIntToBinary128Bits(1);
const NEGATIVE_ONE = nativeIntToBinary128Bits(-1);
const PI_OVER_FOUR = bits(0x8469898cc51701b8n, 0x3ffe921fb54442d1n);
const THREE_PI_OVER_FOUR = bits(0x234f272993d1414an, 0x40002d97c7f3321dn);

test("ports the direct binary128 tanl kernel consumed by helper 0x184970", () => {
  assert.deepEqual(nativeBinary128Tanl0x19a450(ZERO), ZERO);
  assert.deepEqual(nativeBinary128Tanl0x19a450(NEGATIVE_ZERO), NEGATIVE_ZERO);
  assert.deepEqual(
    nativeBinary128Tanl0x19a450(nativeDoubleToBinary128Bits(0.000001)),
    bits(0x31f45f0c3ed47e25n, 0x3feb0c6f7a0b5f3bn),
  );
  assert.deepEqual(
    nativeBinary128Tanl0x19a450(nativeDoubleToBinary128Bits(-0.25)),
    bits(0x5e63940188965c29n, 0xbffd05785a43c4c5n),
  );
});

test("ports finite binary128 atan2l quadrants and signed zero", () => {
  assert.deepEqual(nativeBinary128Atan2l0x19a440(ZERO, ONE), ZERO);
  assert.deepEqual(nativeBinary128Atan2l0x19a440(NEGATIVE_ZERO, ONE), NEGATIVE_ZERO);
  assert.deepEqual(nativeBinary128Atan2l0x19a440(ONE, ONE), PI_OVER_FOUR);
  assert.deepEqual(nativeBinary128Atan2l0x19a440(ONE, NEGATIVE_ONE), THREE_PI_OVER_FOUR);
  assert.deepEqual(
    nativeBinary128Atan2l0x19a440(NEGATIVE_ONE, NEGATIVE_ONE),
    bits(THREE_PI_OVER_FOUR.low, THREE_PI_OVER_FOUR.high ^ 0x8000000000000000n),
  );
});

test("rejects non-finite inputs and unported tanl argument reduction", () => {
  const infinity = bits(0n, 0x7fff000000000000n);
  assert.throws(() => nativeBinary128Tanl0x19a450(infinity), NativeInverseTrigError);
  assert.throws(() => nativeBinary128Atan2l0x19a440(ONE, infinity), NativeInverseTrigError);
  assert.throws(() => nativeBinary128Tanl0x19a450(ONE), /tanl-unported-argument-reduction/);
});

test("exports the Bionic source and supported-path boundary", () => {
  assert.deepEqual(nativeInverseTrigEvidenceContract(), {
    pltAddresses: { atan2l: "0x19a440", tanl: "0x19a450" },
    implementationBasis: {
      project: "AOSP bionic FreeBSD msun ld128",
      referenceTag: "android-12.0.0_r1",
      entryFiles: ["src/e_atan2l.c", "src/s_atanl.c", "src/s_tanl.c"],
      coefficientFiles: ["ld128/invtrig.c", "ld128/invtrig.h", "ld128/k_tanl.c"],
    },
    supportedPaths: {
      atan2l: "all finite binary128 inputs",
      tanl: "direct kernel for abs(input) < pi/4, the only path consumed by 0x184970",
    },
    note: "libm numeric dependency only; tanl medium/large argument reduction and chart parity are not claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
