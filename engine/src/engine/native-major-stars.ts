import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeMajorStarName =
  | "紫微"
  | "天机"
  | "太阳"
  | "武曲"
  | "天同"
  | "廉贞"
  | "天府"
  | "太阴"
  | "贪狼"
  | "巨门"
  | "天相"
  | "天梁"
  | "七杀"
  | "破军";

export type NativeMajorStarPlacement = {
  star: NativeMajorStarName;
  group: "ziwei" | "tianfu";
  offsetFromAnchor: number;
  branchIndex: number;
  branch: string;
};

export type NativeMajorStarsResult = {
  ziweiAnchorBranch: string;
  tianfuAnchorBranch: string;
  placements: NativeMajorStarPlacement[];
  byBranch: Record<string, NativeMajorStarName[]>;
};

export type NativeMajorStarsEvidenceContract = {
  ziweiGroup: { functionRange: string; offsets: number[]; stars: NativeMajorStarName[] };
  tianfuGroup: { functionRange: string; offsets: number[]; stars: NativeMajorStarName[] };
  branchShiftHelper: string;
  branchLookupHelpers: string[];
  destinationNodeOffset: string;
  note: string;
};

const ZIWEI_GROUP: ReadonlyArray<readonly [NativeMajorStarName, number]> = [
  ["紫微", 0],
  ["天机", -1],
  ["太阳", -3],
  ["武曲", -4],
  ["天同", -5],
  ["廉贞", -8],
];

const TIANFU_GROUP: ReadonlyArray<readonly [NativeMajorStarName, number]> = [
  ["天府", 0],
  ["太阴", 1],
  ["贪狼", 2],
  ["巨门", 3],
  ["天相", 4],
  ["天梁", 5],
  ["七杀", 6],
  ["破军", 10],
];

export function nativeMajorStars(input: {
  ziweiAnchorBranchIndex: number;
  tianfuAnchorBranchIndex: number;
}): NativeMajorStarsResult {
  assertBranchIndex(input.ziweiAnchorBranchIndex);
  assertBranchIndex(input.tianfuAnchorBranchIndex);

  const placements = [
    ...placeGroup("ziwei", input.ziweiAnchorBranchIndex, ZIWEI_GROUP),
    ...placeGroup("tianfu", input.tianfuAnchorBranchIndex, TIANFU_GROUP),
  ];
  const byBranch = Object.fromEntries(
    NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch) => [branch, [] as NativeMajorStarName[]]),
  );
  for (const placement of placements) {
    byBranch[placement.branch]?.push(placement.star);
  }

  return {
    ziweiAnchorBranch: branchAt(input.ziweiAnchorBranchIndex),
    tianfuAnchorBranch: branchAt(input.tianfuAnchorBranchIndex),
    placements,
    byBranch,
  };
}

export function nativeMajorStarsEvidenceContract(): NativeMajorStarsEvidenceContract {
  return {
    ziweiGroup: {
      functionRange: "[0x15aeb0, 0x15b71f)",
      offsets: ZIWEI_GROUP.map(([, offset]) => offset),
      stars: ZIWEI_GROUP.map(([star]) => star),
    },
    tianfuGroup: {
      functionRange: "[0x15ba70, 0x15c61b)",
      offsets: TIANFU_GROUP.map(([, offset]) => offset),
      stars: TIANFU_GROUP.map(([star]) => star),
    },
    branchShiftHelper: "0x176260",
    branchLookupHelpers: ["0x17b480 (anchor)", "0x17b300 (shifted branch)"],
    destinationNodeOffset: "0x170",
    note: "star names and signed offsets are direct native immediates; no external chart protocol is used",
  };
}

function placeGroup(
  group: NativeMajorStarPlacement["group"],
  anchorBranchIndex: number,
  sequence: ReadonlyArray<readonly [NativeMajorStarName, number]>,
): NativeMajorStarPlacement[] {
  return sequence.map(([star, offsetFromAnchor]) => {
    const branchIndex = positiveModulo(anchorBranchIndex + offsetFromAnchor, 12);
    return {
      star,
      group,
      offsetFromAnchor,
      branchIndex,
      branch: branchAt(branchIndex),
    };
  });
}

function assertBranchIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= 12) {
    throw new NativeMajorStarsError(`branch index is outside APK table: ${index}`);
  }
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) {
    throw new NativeMajorStarsError(`branch index is outside APK table: ${index}`);
  }
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeMajorStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMajorStarsError";
  }
}
