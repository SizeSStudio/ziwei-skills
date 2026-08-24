import test from "node:test";
import assert from "node:assert/strict";
import {
  NativeTrigError,
  nativeBinary128Cosl0x19a420,
  nativeBinary128Sinl0x19a430,
  nativeTrigEvidenceContract,
} from "../../src/engine/native-trig";
import { NativeBinary128Bits, nativeIntToBinary128Bits } from "../../src/engine/native-numeric";

type TrigVector = {
  label: string;
  input: NativeBinary128Bits;
  sin: NativeBinary128Bits;
  cos: NativeBinary128Bits;
};

const vectors: readonly TrigVector[] = [
  {
    label: "positive zero",
    input: bits(0x0000000000000000n, 0x0000000000000000n),
    sin: bits(0x0000000000000000n, 0x0000000000000000n),
    cos: bits(0x0000000000000000n, 0x3fff000000000000n),
  },
  {
    label: "negative zero",
    input: bits(0x0000000000000000n, 0x8000000000000000n),
    sin: bits(0x0000000000000000n, 0x8000000000000000n),
    cos: bits(0x0000000000000000n, 0x3fff000000000000n),
  },
  {
    label: "one half stays in the direct kernel",
    input: bits(0x0000000000000000n, 0x3ffe000000000000n),
    sin: bits(0xfe8764bc364fd838n, 0x3ffdeaee8744b05en),
    cos: bits(0xf9db7bbb3b45f5f6n, 0x3ffec1528065b7d4n),
  },
  {
    label: "pi over four reaches argument reduction",
    input: bits(0x8469898cc51701b8n, 0x3ffe921fb54442d1n),
    sin: bits(0xc908b2fb1366ea95n, 0x3ffe6a09e667f3bcn),
    cos: bits(0xc908b2fb1366ea96n, 0x3ffe6a09e667f3bcn),
  },
  {
    label: "one",
    input: bits(0x0000000000000000n, 0x3fff000000000000n),
    sin: bits(0xe0418dd3d2138a1fn, 0x3ffeaed548f090cen),
    cos: bits(0xb923848cdb2ed0e4n, 0x3ffe14a280fb5068n),
  },
  {
    label: "ten",
    input: bits(0x0000000000000000n, 0x4002400000000000n),
    sin: bits(0x259cff6457c049c4n, 0xbffe1689ef5f34f5n),
    cos: bits(0xf209efc54173329dn, 0xbffead9ac890c6b1n),
  },
  {
    label: "one million exercises medium argument reduction",
    input: bits(0x0000000000000000n, 0x4012e84800000000n),
    sin: bits(0x74991ccb49ba6e52n, 0xbffd6664b2568d86n),
    cos: bits(0xc6aec89a83199fe2n, 0x3ffedf9df9906d32n),
  },
  {
    label: "four hundred million matches the upstream characterization range",
    input: bits(0x0000000000000000n, 0x401b7d7840000000n),
    sin: bits(0x9fa98de38369812an, 0x3ffefe3a98019263n),
    cos: bits(0x98e5e49f52cfd190n, 0x3ffb54660d580539n),
  },
  {
    label: "negative one preserves odd and even symmetry",
    input: bits(0x0000000000000000n, 0xbfff000000000000n),
    sin: bits(0xe0418dd3d2138a1fn, 0xbffeaed548f090cen),
    cos: bits(0xb923848cdb2ed0e4n, 0x3ffe14a280fb5068n),
  },
  {
    label: "negative one million preserves reduced quadrant",
    input: bits(0x0000000000000000n, 0xc012e84800000000n),
    sin: bits(0x74991ccb49ba6e52n, 0x3ffd6664b2568d86n),
    cos: bits(0xc6aec89a83199fe2n, 0x3ffedf9df9906d32n),
  },
];

test("ports the APK libm binary128 sinl and cosl dependency for the verified medium range", () => {
  for (const vector of vectors) {
    assert.deepEqual(nativeBinary128Sinl0x19a430(vector.input), vector.sin, `${vector.label}: sinl`);
    assert.deepEqual(nativeBinary128Cosl0x19a420(vector.input), vector.cos, `${vector.label}: cosl`);
  }
});

test("rejects non-finite and unported large argument-reduction inputs explicitly", () => {
  const infinity = bits(0n, 0x7fff000000000000n);
  const aboveInt32Quotient = nativeIntToBinary128Bits(0x7fffffff);
  const scaledPastRange = bits(aboveInt32Quotient.low, 0x401f000000000000n);

  for (const input of [infinity, scaledPastRange]) {
    assert.throws(() => nativeBinary128Sinl0x19a430(input), NativeTrigError);
    assert.throws(() => nativeBinary128Cosl0x19a420(input), NativeTrigError);
  }
});

test("exports the native PLT and AOSP ld128 implementation evidence boundary", () => {
  assert.deepEqual(nativeTrigEvidenceContract(), {
    pltAddresses: { cosl: "0x19a420", sinl: "0x19a430" },
    implementationBasis: {
      project: "AOSP bionic FreeBSD msun ld128",
      referenceTag: "android-12.0.0_r1",
      entryFiles: ["src/s_cosl.c", "src/s_sinl.c"],
      kernelFiles: ["ld128/k_cosl.c", "ld128/k_sinl.c", "ld128/e_rem_pio2l.h"],
    },
    supportedArgumentReduction: {
      kind: "medium",
      quotientRange: "signed-int32",
      rounding: "binary128 round-to-nearest-even",
    },
    validation: {
      independentReference: "mpmath-1.3.0-250-decimal-digits",
      exactBinary128Vectors: vectors.length,
      exactMathematicalVectorPairs: 8,
      maximumMathematicalUlpDistance: 1,
      maximumCharacterizedMagnitude: 400000000,
    },
    note: "libm numeric dependency only; no calendar, astrology, 0x183d40, 0x186e40, or chart parity is claimed",
  });
});

function bits(low: bigint, high: bigint): NativeBinary128Bits {
  return { low, high };
}
