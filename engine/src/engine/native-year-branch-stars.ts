import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeYearBranchStarName =
  | "天哭" | "天虚" | "天马" | "红鸾" | "天喜" | "龙池" | "凤阁"
  | "华盖" | "劫煞" | "咸池" | "孤辰" | "寡宿" | "破碎" | "大耗"
  | "天德" | "月德" | "年解" | "蜚廉" | "天空" | "血刃";

export type NativeYearBranchStarPlacement = {
  star: NativeYearBranchStarName;
  branch: string;
  branchIndex: number;
  source: "formula" | "mod4-table" | "branch-table" | "branch-group";
  evidenceAddress: string;
};

const MOD4_TABLES = [
  { star: "天马", address: "0x19f910", branches: ["寅", "亥", "申", "巳"] },
  { star: "华盖", address: "0x19f930", branches: ["辰", "丑", "戌", "未"] },
  { star: "劫煞", address: "0x19f950", branches: ["巳", "寅", "亥", "申"] },
  { star: "咸池", address: "0x19f970", branches: ["酉", "午", "卯", "子"] },
] as const;

const BRANCH_TABLES = [
  { star: "孤辰", address: "0x19f990", branches: ["寅", "寅", "巳", "巳", "巳", "申", "申", "申", "亥", "亥", "亥", "寅"] },
  { star: "寡宿", address: "0x19f9f0", branches: ["戌", "戌", "丑", "丑", "丑", "辰", "辰", "辰", "未", "未", "未", "戌"] },
  { star: "大耗", address: "0x19fa50", branches: ["未", "午", "酉", "申", "亥", "戌", "丑", "子", "卯", "寅", "巳", "辰"] },
  { star: "蜚廉", address: "0x19fab0", branches: ["申", "酉", "戌", "巳", "午", "未", "寅", "卯", "辰", "亥", "子", "丑"] },
  { star: "血刃", address: "0x19fb10", branches: ["戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥"] },
] as const;

export function nativeYearBranchStars0x1601b0(input: {
  lunarYearBranch: string;
  extendedStarsFlag0x450: boolean;
}) {
  const yearBranchIndex = branchIndex(input.lunarYearBranch);
  const mod4Index = positiveModulo(yearBranchIndex, 4);
  const placements: NativeYearBranchStarPlacement[] = [
    formula("天哭", "午", -yearBranchIndex, "0x16029b..0x1603d1"),
    formula("天虚", "午", yearBranchIndex, "0x160407..0x160515"),
    tablePlacement(MOD4_TABLES[0], mod4Index, "mod4-table"),
    formula("红鸾", "卯", -yearBranchIndex, "0x16068b..0x1607b2"),
    formula("天喜", "酉", -yearBranchIndex, "0x1607f7..0x160920"),
    formula("龙池", "辰", yearBranchIndex, "0x160965..0x160a89"),
    formula("凤阁", "戌", -yearBranchIndex, "0x160ace..0x160bf5"),
    tablePlacement(MOD4_TABLES[1], mod4Index, "mod4-table"),
    tablePlacement(MOD4_TABLES[2], mod4Index, "mod4-table"),
    tablePlacement(MOD4_TABLES[3], mod4Index, "mod4-table"),
    tablePlacement(BRANCH_TABLES[0], yearBranchIndex, "branch-table"),
    tablePlacement(BRANCH_TABLES[1], yearBranchIndex, "branch-table"),
    groupPlacement("破碎", brokenBranch(input.lunarYearBranch), "0x1611db..0x1617f2"),
    tablePlacement(BRANCH_TABLES[2], yearBranchIndex, "branch-table"),
    formula("天德", "酉", yearBranchIndex, "0x16196e..0x161a92"),
    formula("月德", "巳", yearBranchIndex, "0x161ad7..0x161bf5"),
    formula("年解", "戌", -yearBranchIndex, "0x161c40..0x161d63"),
    tablePlacement(BRANCH_TABLES[3], yearBranchIndex, "branch-table"),
    formula("天空", input.lunarYearBranch, 1, "0x161ec0..0x162003"),
  ];
  if (input.extendedStarsFlag0x450) {
    placements.push(tablePlacement(BRANCH_TABLES[4], yearBranchIndex, "branch-table"));
  }

  const byBranch = Object.fromEntries(
    NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch) => [branch, [] as NativeYearBranchStarName[]]),
  );
  for (const placement of placements) byBranch[placement.branch]?.push(placement.star);
  return {
    lunarYearBranch: input.lunarYearBranch,
    yearBranchIndex,
    mod4Index,
    extendedStarsFlag0x450: input.extendedStarsFlag0x450,
    placements,
    byBranch,
  };
}

export function nativeYearBranchStarsEvidenceContract() {
  return {
    functionRange: "[0x1601b0, 0x162279)",
    inputCalendarAdapterOffset: "0x128 branch string (C++ string storage 0x128..0x13f)",
    branchIndexTable: "0x19f3d0",
    mod4Tables: MOD4_TABLES.map(({ star, address }) => ({ star, address, count: 4 })),
    branchTables: BRANCH_TABLES.map(({ star, address }) => ({ star, address, count: 12 })),
    brokenGroups: [
      { input: "子午卯酉", branch: "巳" },
      { input: "辰戌丑未", branch: "丑" },
      { input: "寅申巳亥", branch: "酉" },
    ],
    bloodBladeGate: { compareAddress: "0x16204f", contextOffset: "0x450", requiredValue: 1 },
    destinationNodeOffset: "0x170",
    note: "all formulas, groups, and relocation tables come from the APK function; 血刃 alone is conditional in this function",
  };
}

function formula(
  star: NativeYearBranchStarName,
  baseBranch: string,
  offset: number,
  evidenceAddress: string,
): NativeYearBranchStarPlacement {
  const targetIndex = positiveModulo(branchIndex(baseBranch) + offset, 12);
  return { star, branch: branchAt(targetIndex), branchIndex: targetIndex, source: "formula", evidenceAddress };
}

function tablePlacement(
  table: { star: NativeYearBranchStarName; address: string; branches: readonly string[] },
  index: number,
  source: "mod4-table" | "branch-table",
): NativeYearBranchStarPlacement {
  const branch = table.branches[index];
  if (branch === undefined) throw new NativeYearBranchStarsError(`missing ${table.star} table entry: ${index}`);
  return { star: table.star, branch, branchIndex: branchIndex(branch), source, evidenceAddress: table.address };
}

function groupPlacement(
  star: NativeYearBranchStarName,
  branch: string,
  evidenceAddress: string,
): NativeYearBranchStarPlacement {
  return { star, branch, branchIndex: branchIndex(branch), source: "branch-group", evidenceAddress };
}

function brokenBranch(yearBranch: string): string {
  if ("子午卯酉".includes(yearBranch)) return "巳";
  if ("辰戌丑未".includes(yearBranch)) return "丑";
  if ("寅申巳亥".includes(yearBranch)) return "酉";
  throw new NativeYearBranchStarsError(`year branch is outside 破碎 groups: ${yearBranch}`);
}

function branchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeYearBranchStarsError(`year branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeYearBranchStarsError(`branch index is outside APK table: ${index}`);
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeYearBranchStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeYearBranchStarsError";
  }
}
