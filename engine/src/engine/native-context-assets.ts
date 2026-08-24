import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NativeBinary128Bits } from "./native-numeric";

export type NativeContextMode = 0 | 1;

export type NativeContextAssetsEvidenceContract = {
  constructor: { address: string; endExclusive: string };
  recordVectors: Array<{
    mode: NativeContextMode;
    contextPointerOffset: string;
    virtualAddress: string;
    sourceFileOffset: string;
    byteLength: number;
    recordCount: number;
    sha256: string;
    copyAddress: string;
  }>;
  markerDecoder: {
    functionAddress: string;
    replacementHelperAddress: string;
    replacementCount: number;
    compressedLengths: { modeOne: number; modeZero: number };
    decodedLengths: { modeOne: number; modeZero: number };
  };
  note: string;
};

type RecordAsset = {
  name: string;
  byteLength: number;
  sha256: string;
};

type MarkerAsset = {
  name: string;
  compressedLength: number;
  compressedSha256: string;
  decodedLength: number;
  decodedSha256: string;
};

const RECORD_BYTES = 0x10;
const RECORD_ASSETS: Record<NativeContextMode, RecordAsset> = {
  1: {
    name: "native-context-records-mode-one-0x83f30.bin",
    byteLength: 0x170,
    sha256: "e997e6f431e53a919e9bbf4974e6cf4a0719372ba371efde8f83c2ec17370580",
  },
  0: {
    name: "native-context-records-mode-zero-0x840a0.bin",
    byteLength: 0x470,
    sha256: "7b58c8e2b9114146018e8c2b66241935e8cc370df03a3ab7c78acaf2c166bf08",
  },
};
const MARKER_ASSETS: Record<NativeContextMode, MarkerAsset> = {
  1: {
    name: "native-context-markers-mode-one-compressed.txt",
    compressedLength: 2031,
    compressedSha256: "17c97a17976079a632a68422a2fc160a32f3e884fe3dbaa9c3fb5e7b6193c375",
    decodedLength: 23952,
    decodedSha256: "5ca9680330f2338cad3fdbf1764ced44e10991bf17dbfca62111de67a5017e4d",
  },
  0: {
    name: "native-context-markers-mode-zero-compressed.txt",
    compressedLength: 437,
    compressedSha256: "8b1f9549856d5d1427e195d35c02d501df721cbf653f07df31dc242aa031e33f",
    decodedLength: 2989,
    decodedSha256: "d9b6a19950a2bf468ff82175e1e52a7d231850e6de966e507a9ec3e4df75c0df",
  },
};

// 0x17fa10 expands zero runs before the marker strings are stored at ctx+0xa0/0xb8.
const MARKER_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["J", "00"],
  ["I", "000"],
  ["H", "0000"],
  ["G", "00000"],
  ...Array.from("tsrqponmlkjihgfedcba", (token, index) => [
    token,
    `${"0".repeat(index + 1)}2`,
  ] as const),
  ...Array.from("FEDCBA", (token, index) => [
    token,
    `${"0".repeat(index + 1)}1`,
  ] as const),
];

const recordCache = new Map<NativeContextMode, readonly NativeBinary128Bits[]>();
const compressedMarkerCache = new Map<NativeContextMode, string>();
const decodedMarkerCache = new Map<NativeContextMode, string>();

export function nativeContextInitialRecords(mode: NativeContextMode): readonly NativeBinary128Bits[] {
  let records = recordCache.get(mode);
  if (records === undefined) {
    const asset = RECORD_ASSETS[mode];
    const bytes = readAsset(asset.name);
    assertLengthAndHash(bytes, asset.byteLength, asset.sha256, `records-mode-${mode}`);
    const loaded: NativeBinary128Bits[] = [];
    for (let offset = 0; offset < bytes.length; offset += RECORD_BYTES) {
      loaded.push({
        low: bytes.readBigUInt64LE(offset),
        high: bytes.readBigUInt64LE(offset + 8),
      });
    }
    records = loaded;
    recordCache.set(mode, records);
  }
  return records;
}

export function nativeContextMarkerString(mode: NativeContextMode): string {
  let decoded = decodedMarkerCache.get(mode);
  if (decoded === undefined) {
    decoded = compressedMarker(mode);
    for (const [token, replacement] of MARKER_REPLACEMENTS) {
      decoded = decoded.split(token).join(replacement);
    }
    const asset = MARKER_ASSETS[mode];
    assertLengthAndHash(
      Buffer.from(decoded, "ascii"),
      asset.decodedLength,
      asset.decodedSha256,
      `decoded-markers-mode-${mode}`,
    );
    if (!/^[012]+$/.test(decoded)) {
      throw new NativeContextAssetsError(`native-context-assets:decoded-alphabet:mode-${mode}`);
    }
    decodedMarkerCache.set(mode, decoded);
  }
  return decoded;
}

export function nativeContextCompressedMarkerSha256(mode: NativeContextMode): string {
  return sha256(Buffer.from(compressedMarker(mode), "ascii"));
}

export function nativeContextDecodedMarkerSha256(mode: NativeContextMode): string {
  return sha256(Buffer.from(nativeContextMarkerString(mode), "ascii"));
}

export function nativeContextAssetsEvidenceContract(): NativeContextAssetsEvidenceContract {
  return {
    constructor: { address: "0x17f450", endExclusive: "0x17f883" },
    recordVectors: [
      {
        mode: 1,
        contextPointerOffset: "0x0",
        virtualAddress: "0x83f30",
        sourceFileOffset: "0x83f30",
        byteLength: 0x170,
        recordCount: 23,
        sha256: RECORD_ASSETS[1].sha256,
        copyAddress: "0x17f7d2",
      },
      {
        mode: 0,
        contextPointerOffset: "0x8",
        virtualAddress: "0x840a0",
        sourceFileOffset: "0x840a0",
        byteLength: 0x470,
        recordCount: 71,
        sha256: RECORD_ASSETS[0].sha256,
        copyAddress: "0x17f823",
      },
    ],
    markerDecoder: {
      functionAddress: "0x17fa10",
      replacementHelperAddress: "0x1813d0",
      replacementCount: MARKER_REPLACEMENTS.length,
      compressedLengths: { modeOne: 2031, modeZero: 437 },
      decodedLengths: { modeOne: 23952, modeZero: 2989 },
    },
    note: "constructor assets and marker run-length decoding only; no calendar semantics are claimed",
  };
}

function compressedMarker(mode: NativeContextMode): string {
  let compressed = compressedMarkerCache.get(mode);
  if (compressed === undefined) {
    const asset = MARKER_ASSETS[mode];
    const bytes = readAsset(asset.name);
    assertLengthAndHash(bytes, asset.compressedLength, asset.compressedSha256, `compressed-markers-mode-${mode}`);
    compressed = bytes.toString("ascii");
    compressedMarkerCache.set(mode, compressed);
  }
  return compressed;
}

function readAsset(name: string): Buffer {
  return readFileSync(resolve(__dirname, "../../../assets", name));
}

function assertLengthAndHash(bytes: Buffer, length: number, expectedHash: string, label: string): void {
  if (bytes.length !== length) {
    throw new NativeContextAssetsError(
      `native-context-assets:${label}:size:${bytes.length}:expected:${length}`,
    );
  }
  const actualHash = sha256(bytes);
  if (actualHash !== expectedHash) {
    throw new NativeContextAssetsError(
      `native-context-assets:${label}:sha256:${actualHash}:expected:${expectedHash}`,
    );
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export class NativeContextAssetsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeContextAssetsError";
  }
}
