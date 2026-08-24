import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeHourStarName = "文昌" | "文曲" | "地空" | "地劫" | "台辅" | "封诰";

export type NativeHourStarsResult = {
  hourBranch: string;
  hourBranchIndex: number;
  placements: Array<{
    star: NativeHourStarName;
    baseBranch: string;
    indexMultiplier: -1 | 1;
    offset: number;
    branchIndex: number;
    branch: string;
  }>;
};

const RULES: ReadonlyArray<readonly [NativeHourStarName, string, -1 | 1]> = [
  ["文昌", "戌", -1],
  ["文曲", "辰", 1],
  ["地空", "亥", -1],
  ["地劫", "亥", 1],
  ["台辅", "午", 1],
  ["封诰", "寅", 1],
];

export function nativeHourStars0x15f7f0(hourBranch: string): NativeHourStarsResult {
  const hourBranchIndex = branchIndex(hourBranch);
  return {
    hourBranch,
    hourBranchIndex,
    placements: RULES.map(([star, baseBranch, indexMultiplier]) => {
      const offset = indexMultiplier * hourBranchIndex;
      const targetIndex = positiveModulo(branchIndex(baseBranch) + offset, 12);
      return {
        star,
        baseBranch,
        indexMultiplier,
        offset,
        branchIndex: targetIndex,
        branch: branchAt(targetIndex),
      };
    }),
  };
}

export function nativeHourStarsEvidenceContract() {
  return {
    functionRange: "[0x15f7f0, 0x1600e5)",
    inputCalendarAdapterOffset: "0x1c0 branch string (C++ string storage 0x1c0..0x1d7)",
    branchIndexTable: "0x19f3d0",
    rules: RULES.map(([star, baseBranch, indexMultiplier]) => ({ star, baseBranch, indexMultiplier })),
    branchShiftHelper: "0x176260",
    destinationNodeOffset: "0x170",
    note: "the function scans the APK branch table to obtain the hour-branch index, then applies six signed shifts",
  };
}

function branchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeHourStarsError(`hour branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeHourStarsError(`branch index is outside APK table: ${index}`);
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeHourStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeHourStarsError";
  }
}
