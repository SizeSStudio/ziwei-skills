import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeContextAssetsEvidenceContract,
  nativeContextCompressedMarkerSha256,
  nativeContextDecodedMarkerSha256,
  nativeContextInitialRecords,
  nativeContextMarkerString,
} from "../../src/engine/native-context-assets";

test("loads the two constructor record vectors as exact APK binary128 values", () => {
  const modeOne = nativeContextInitialRecords(1);
  const modeZero = nativeContextInitialRecords(0);

  assert.equal(modeOne.length, 23);
  assert.deepEqual(modeOne[0], {
    low: 0xc000000000000000n,
    high: 0x401363e223b23ee1n,
  });
  assert.deepEqual(modeOne.at(-1), {
    low: 0x0000000000000000n,
    high: 0x4013db6200000000n,
  });

  assert.equal(modeZero.length, 71);
  assert.deepEqual(modeZero[0], {
    low: 0xe000000000000000n,
    high: 0x4013908ca7add377n,
  });
  assert.deepEqual(modeZero.at(-1), {
    low: 0x4000000000000000n,
    high: 0x40141b771e147ae1n,
  });
});

test("decodes the constructor marker strings with the APK 30-token replacement map", () => {
  const modeOne = nativeContextMarkerString(1);
  const modeZero = nativeContextMarkerString(0);

  assert.equal(modeOne.length, 23_952);
  assert.match(modeOne, /^[012]+$/);
  assert.equal(modeZero.length, 2_989);
  assert.match(modeZero, /^[012]+$/);

  assert.equal(nativeContextCompressedMarkerSha256(1), "17c97a17976079a632a68422a2fc160a32f3e884fe3dbaa9c3fb5e7b6193c375");
  assert.equal(nativeContextCompressedMarkerSha256(0), "8b1f9549856d5d1427e195d35c02d501df721cbf653f07df31dc242aa031e33f");
  assert.equal(nativeContextDecodedMarkerSha256(1), "5ca9680330f2338cad3fdbf1764ced44e10991bf17dbfca62111de67a5017e4d");
  assert.equal(nativeContextDecodedMarkerSha256(0), "d9b6a19950a2bf468ff82175e1e52a7d231850e6de966e507a9ec3e4df75c0df");
});

test("exports constructor addresses and bit-preservation evidence", () => {
  assert.deepEqual(nativeContextAssetsEvidenceContract(), {
    constructor: { address: "0x17f450", endExclusive: "0x17f883" },
    recordVectors: [
      {
        mode: 1,
        contextPointerOffset: "0x0",
        virtualAddress: "0x83f30",
        sourceFileOffset: "0x83f30",
        byteLength: 0x170,
        recordCount: 23,
        sha256: "e997e6f431e53a919e9bbf4974e6cf4a0719372ba371efde8f83c2ec17370580",
        copyAddress: "0x17f7d2",
      },
      {
        mode: 0,
        contextPointerOffset: "0x8",
        virtualAddress: "0x840a0",
        sourceFileOffset: "0x840a0",
        byteLength: 0x470,
        recordCount: 71,
        sha256: "7b58c8e2b9114146018e8c2b66241935e8cc370df03a3ab7c78acaf2c166bf08",
        copyAddress: "0x17f823",
      },
    ],
    markerDecoder: {
      functionAddress: "0x17fa10",
      replacementHelperAddress: "0x1813d0",
      replacementCount: 30,
      compressedLengths: { modeOne: 2031, modeZero: 437 },
      decodedLengths: { modeOne: 23952, modeZero: 2989 },
    },
    note: "constructor assets and marker run-length decoding only; no calendar semantics are claimed",
  });
});
