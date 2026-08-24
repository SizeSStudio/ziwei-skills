import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeMonthStarName =
  | "左辅" | "右弼" | "天刑" | "天姚"
  | "阴煞" | "天月" | "天巫" | "解神" | "月马" | "天富" | "天财" | "天医"
  | "生气" | "岁刑" | "阴奸" | "水杀" | "恶杀" | "冤杀" | "天贼" | "天狗"
  | "五墓" | "三丘" | "雷火" | "注受" | "死神" | "飞符";

export type NativeMonthStarPlacement = {
  star: NativeMonthStarName;
  branch: string;
  branchIndex: number;
  source: "formula" | "table";
  tableAddress?: string;
};

export type NativeMonthStarsResult = {
  normalizedLunarMonth: number;
  monthIndex: number;
  extendedStarsFlag0x450: boolean;
  placements: NativeMonthStarPlacement[];
  byBranch: Record<string, NativeMonthStarName[]>;
};

type TableStar = {
  star: NativeMonthStarName;
  address: string;
  branches: readonly string[];
};

const TABLE_STARS: readonly TableStar[] = [
  { star: "阴煞", address: "0x19f0d0", branches: ["寅", "子", "戌", "申", "午", "辰", "寅", "子", "戌", "申", "午", "辰"] },
  { star: "天月", address: "0x19f130", branches: ["戌", "巳", "辰", "寅", "未", "卯", "亥", "未", "寅", "午", "戌", "寅"] },
  { star: "天巫", address: "0x19f190", branches: ["巳", "申", "寅", "亥", "巳", "申", "寅", "亥", "巳", "申", "寅", "亥"] },
  { star: "解神", address: "0x19f1f0", branches: ["申", "申", "戌", "戌", "子", "子", "寅", "寅", "辰", "辰", "午", "午"] },
  { star: "月马", address: "0x19f250", branches: ["亥", "申", "巳", "寅", "亥", "申", "巳", "寅", "亥", "申", "巳", "寅"] },
  { star: "天富", address: "0x19f2b0", branches: ["卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅"] },
  { star: "天财", address: "0x19f310", branches: ["寅", "辰", "午", "申", "戌", "子", "寅", "辰", "午", "申", "戌", "子"] },
  { star: "天医", address: "0x19f370", branches: ["亥", "卯", "亥", "丑", "未", "巳", "卯", "亥", "丑", "未", "巳", "卯"] },
  { star: "生气", address: "0x19f3d0", branches: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] },
  { star: "岁刑", address: "0x19f430", branches: ["戌", "巳", "子", "辰", "申", "午", "丑", "寅", "酉", "未", "亥", "卯"] },
  { star: "阴奸", address: "0x19f490", branches: ["申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌", "酉"] },
  { star: "水杀", address: "0x19f4f0", branches: ["丑", "辰", "辰", "辰", "未", "未", "未", "戌", "戌", "戌", "丑", "丑"] },
  { star: "恶杀", address: "0x19f550", branches: ["卯", "子", "酉", "午", "卯", "子", "酉", "午", "卯", "子", "酉", "午"] },
  { star: "冤杀", address: "0x19f5b0", branches: ["未", "戌", "戌", "戌", "辰", "辰", "辰", "丑", "丑", "丑", "未", "未"] },
  { star: "天贼", address: "0x19f610", branches: ["亥", "辰", "酉", "寅", "未", "子", "巳", "戌", "卯", "申", "丑", "午"] },
  { star: "天狗", address: "0x19f670", branches: ["戌", "卯", "申", "丑", "午", "辰", "亥", "酉", "寅", "未", "子", "巳"] },
  { star: "五墓", address: "0x19f6d0", branches: ["辰", "未", "未", "未", "戌", "戌", "戌", "丑", "丑", "丑", "辰", "辰"] },
  { star: "三丘", address: "0x19f730", branches: ["戌", "丑", "丑", "丑", "辰", "辰", "辰", "未", "未", "未", "戌", "戌"] },
  { star: "雷火", address: "0x19f790", branches: ["寅", "亥", "申", "巳", "寅", "亥", "申", "巳", "寅", "亥", "申", "巳"] },
  { star: "注受", address: "0x19f7f0", branches: ["子", "亥", "戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑"] },
  { star: "死神", address: "0x19f850", branches: ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"] },
  { star: "飞符", address: "0x19f8b0", branches: ["申", "酉", "戌", "亥", "子", "丑", "未", "午", "巳", "辰", "卯", "寅"] },
];

export function nativeMonthStars0x15caa0(input: {
  normalizedLunarMonth: number;
  extendedStarsFlag0x450: boolean;
}): NativeMonthStarsResult {
  const { normalizedLunarMonth } = input;
  if (!Number.isInteger(normalizedLunarMonth) || normalizedLunarMonth < 1 || normalizedLunarMonth > 12) {
    throw new NativeMonthStarsError(`lunar month is outside APK table: ${normalizedLunarMonth}`);
  }
  const monthIndex = normalizedLunarMonth - 1;
  const formulaPlacements: NativeMonthStarPlacement[] = [
    formulaPlacement("左辅", "辰", monthIndex),
    formulaPlacement("右弼", "戌", -monthIndex),
    formulaPlacement("天刑", "酉", monthIndex),
    formulaPlacement("天姚", "丑", monthIndex),
  ];
  const selectedTableStars = input.extendedStarsFlag0x450 ? TABLE_STARS : TABLE_STARS.slice(0, 4);
  const tablePlacements = selectedTableStars.map((table): NativeMonthStarPlacement => {
    const branch = table.branches[monthIndex];
    if (branch === undefined) {
      throw new NativeMonthStarsError(`missing ${table.star} table entry for month ${normalizedLunarMonth}`);
    }
    return { star: table.star, branch, branchIndex: branchIndex(branch), source: "table", tableAddress: table.address };
  });
  const placements = [...formulaPlacements, ...tablePlacements];
  const byBranch = Object.fromEntries(
    NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch) => [branch, [] as NativeMonthStarName[]]),
  );
  for (const placement of placements) {
    byBranch[placement.branch]?.push(placement.star);
  }
  return { normalizedLunarMonth, monthIndex, extendedStarsFlag0x450: input.extendedStarsFlag0x450, placements, byBranch };
}

export function nativeMonthStarsEvidenceContract() {
  return {
    functionRange: "[0x15caa0, 0x15e910)",
    formulaStars: [
      { star: "左辅", base: "辰", offset: "month-1", addresses: "0x15cac7..0x15cbd1" },
      { star: "右弼", base: "戌", offset: "1-month", addresses: "0x15cc04..0x15cd07" },
      { star: "天刑", base: "酉", offset: "month-1", addresses: "0x15cd3a..0x15ce38" },
      { star: "天姚", base: "丑", offset: "month-1", addresses: "0x15ce6b..0x15cf67" },
    ],
    tableStars: TABLE_STARS.map(({ star, address }) => ({ star, address, count: 12 })),
    extendedStarsGate: { compareAddress: "0x15d3d3", contextOffset: "0x450", requiredValue: 1, firstGatedStar: "月马" },
    destinationNodeOffset: "0x170",
    note: "all 22 branch tables are decoded from relocation pointers in the APK ELF",
  };
}

function formulaPlacement(star: NativeMonthStarName, baseBranch: string, offset: number): NativeMonthStarPlacement {
  const branchIndexValue = positiveModulo(branchIndex(baseBranch) + offset, 12);
  return { star, branch: branchAt(branchIndexValue), branchIndex: branchIndexValue, source: "formula" };
}

function branchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeMonthStarsError(`branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeMonthStarsError(`branch index is outside APK table: ${index}`);
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeMonthStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMonthStarsError";
  }
}
