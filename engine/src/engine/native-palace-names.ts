import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export const NATIVE_PALACE_NAMES_0X157500 = [
  "命宫",
  "兄弟",
  "夫妻",
  "子女",
  "财帛",
  "疾厄",
  "迁移",
  "交友",
  "官禄",
  "田宅",
  "福德",
  "父母",
] as const;

export type NativePalaceName = (typeof NATIVE_PALACE_NAMES_0X157500)[number];

export type NativeNamedPalace = {
  branchIndex: number;
  branch: string;
  relativeOffsetFromMing: number;
  name: NativePalaceName;
};

export type NativePalaceNamesEvidenceContract = {
  functionAddress: string;
  functionRange: string;
  anchorLookup: string;
  relativeLookupHelper: string;
  relativeOffsets: number[];
  stringAddresses: string[];
  nodeNameOffset: string;
  note: string;
};

export function nativePalaceNames0x157500(mingPalaceBranchIndex: number): NativeNamedPalace[] {
  if (!Number.isInteger(mingPalaceBranchIndex) || mingPalaceBranchIndex < 0 || mingPalaceBranchIndex >= 12) {
    throw new NativePalaceNamesError(`ming palace branch index is outside APK table: ${mingPalaceBranchIndex}`);
  }

  return NATIVE_PALACE_NAMES_0X157500.map((name, nameIndex) => {
    const relativeOffsetFromMing = -nameIndex;
    const branchIndex = positiveModulo(mingPalaceBranchIndex + relativeOffsetFromMing, 12);
    const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[branchIndex];
    if (branch === undefined) {
      throw new NativePalaceNamesError(`branch index is outside APK table: ${branchIndex}`);
    }
    return { branchIndex, branch, relativeOffsetFromMing, name };
  });
}

export function nativePalaceNamesEvidenceContract(): NativePalaceNamesEvidenceContract {
  return {
    functionAddress: "0x157500",
    functionRange: "[0x157500, 0x1583ca)",
    anchorLookup: "0x157536..0x157558 (命宫 branch direct lookup and assign)",
    relativeLookupHelper: "0x176260",
    relativeOffsets: [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11],
    stringAddresses: [
      "0x7a5ee", "0x19bad", "0x6c31d", "0x7a5f5", "0x71454", "0x7d6d3",
      "0x19bb4", "0x6179b", "0x7145b", "0x7ea75", "0x6e3dd", "0x80903",
    ],
    nodeNameOffset: "palace node +0x38",
    note: "static port of the twelve palace-name assignments only; body palace, limits, stars, and transformations remain separate",
  };
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativePalaceNamesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativePalaceNamesError";
  }
}
