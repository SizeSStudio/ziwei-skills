import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeYearStemStarName =
  | "禄存" | "擎羊" | "陀罗" | "天魁" | "天钺" | "天官" | "天福"
  | "截空" | "副截" | "天厨" | "厨贵" | "太极" | "科名" | "节度"
  | "文星" | "福星" | "红艳" | "唐符" | "国印" | "昌贵";

export type NativeYearStemStarPlacement = {
  star: NativeYearStemStarName;
  branch: string;
  branchIndex: number;
  source: "stem-table" | "relative-to-lucun";
  evidenceAddress: string;
};

const NATIVE_YEAR_STEMS_0X19F080 = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

const STEM_TABLES = [
  { star: "禄存", address: "0x1a0180", branches: ["寅", "卯", "巳", "午", "巳", "午", "申", "酉", "亥", "子"] },
  { star: "天魁", address: "0x19fb70", branches: ["丑", "子", "亥", "酉", "寅", "申", "未", "午", "巳", "卯"] },
  { star: "天钺", address: "0x19fbc0", branches: ["未", "申", "酉", "亥", "午", "子", "丑", "寅", "卯", "巳"] },
  { star: "天官", address: "0x19fc10", branches: ["未", "辰", "巳", "寅", "卯", "酉", "亥", "酉", "戌", "午"] },
  { star: "天福", address: "0x19fc60", branches: ["酉", "申", "子", "亥", "卯", "寅", "午", "巳", "午", "巳"] },
  { star: "截空", address: "0x19fcb0", branches: ["申", "未", "辰", "卯", "子", "酉", "午", "巳", "寅", "丑"] },
  { star: "副截", address: "0x19fd00", branches: ["酉", "午", "巳", "寅", "丑", "申", "未", "辰", "卯", "子"] },
  { star: "天厨", address: "0x19fd50", branches: ["巳", "午", "子", "巳", "午", "申", "寅", "午", "酉", "亥"] },
  { star: "厨贵", address: "0x19fda0", branches: ["巳", "午", "巳", "午", "申", "酉", "亥", "子", "寅", "卯"] },
  { star: "太极", address: "0x19fdf0", branches: ["子", "午", "卯", "酉", "巳", "午", "寅", "亥", "亥", "申"] },
  { star: "科名", address: "0x19fe40", branches: ["寅", "寅", "亥", "亥", "巳", "巳", "申", "申", "巳", "巳"] },
  { star: "节度", address: "0x19fe90", branches: ["寅", "未", "寅", "未", "寅", "未", "亥", "丑", "亥", "丑"] },
  { star: "文星", address: "0x19fee0", branches: ["未", "辰", "巳", "寅", "丑", "戌", "午", "申", "卯", "卯"] },
  { star: "福星", address: "0x19ff30", branches: ["子", "丑", "子", "亥", "申", "未", "午", "巳", "辰", "丑"] },
  { star: "红艳", address: "0x19ff80", branches: ["午", "午", "寅", "未", "辰", "辰", "戌", "酉", "子", "申"] },
  { star: "唐符", address: "0x19ffd0", branches: ["酉", "戌", "子", "丑", "子", "丑", "卯", "辰", "午", "未"] },
  { star: "国印", address: "0x1a0020", branches: ["戌", "亥", "丑", "寅", "丑", "寅", "辰", "巳", "未", "申"] },
  { star: "昌贵", address: "0x1a0070", branches: ["巳", "午", "申", "酉", "申", "酉", "亥", "子", "寅", "卯"] },
] as const satisfies readonly {
  star: NativeYearStemStarName;
  address: string;
  branches: readonly string[];
}[];

const BASE_TABLE_COUNT = 8;

export function nativeYearStemStars0x1628d0(input: {
  lunarYearStem: string;
  extendedStarsFlag0x450: boolean;
}) {
  const yearStemIndex = stemIndex(input.lunarYearStem);
  const lucun = tablePlacement(STEM_TABLES[0], yearStemIndex);
  const placements: NativeYearStemStarPlacement[] = [
    lucun,
    relativePlacement("擎羊", lucun.branchIndex, 1, "0x162a8c..0x162c0f"),
    relativePlacement("陀罗", lucun.branchIndex, -1, "0x162c35..0x162db8"),
    ...STEM_TABLES.slice(1, BASE_TABLE_COUNT).map((table) => tablePlacement(table, yearStemIndex)),
  ];
  if (input.extendedStarsFlag0x450) {
    placements.push(...STEM_TABLES.slice(BASE_TABLE_COUNT).map((table) => tablePlacement(table, yearStemIndex)));
  }

  const byBranch = Object.fromEntries(
    NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch) => [branch, [] as NativeYearStemStarName[]]),
  );
  for (const placement of placements) byBranch[placement.branch]?.push(placement.star);
  return {
    lunarYearStem: input.lunarYearStem,
    yearStemIndex,
    extendedStarsFlag0x450: input.extendedStarsFlag0x450,
    placements,
    byBranch,
  };
}

export function nativeYearStemStarsEvidenceContract() {
  return {
    functionRange: "[0x1628d0, 0x16420b)",
    inputCalendarAdapterOffset: "0x110 stem string (C++ string storage 0x110..0x127)",
    stemIndexTable: "0x19f080",
    tables: STEM_TABLES.map(({ star, address }) => ({ star, address, count: 10 })),
    relativeStars: [
      { star: "擎羊", base: "禄存", offset: 1, helperCallAddress: "0x162b0c" },
      { star: "陀罗", base: "禄存", offset: -1, helperCallAddress: "0x162cb5" },
    ],
    extendedGate: { compareAddress: "0x1635d6", contextOffset: "0x450", requiredValue: 1 },
    destinationNodeOffset: "0x170",
    note: "基础层截止于天厨；厨贵至昌贵只在 context+0x450 == 1 时插入",
  };
}

function tablePlacement(
  table: { star: NativeYearStemStarName; address: string; branches: readonly string[] },
  index: number,
): NativeYearStemStarPlacement {
  const branch = table.branches[index];
  if (branch === undefined) throw new NativeYearStemStarsError(`missing ${table.star} table entry: ${index}`);
  return { star: table.star, branch, branchIndex: branchIndex(branch), source: "stem-table", evidenceAddress: table.address };
}

function relativePlacement(
  star: NativeYearStemStarName,
  baseIndex: number,
  offset: number,
  evidenceAddress: string,
): NativeYearStemStarPlacement {
  const targetIndex = positiveModulo(baseIndex + offset, 12);
  return { star, branch: branchAt(targetIndex), branchIndex: targetIndex, source: "relative-to-lucun", evidenceAddress };
}

function stemIndex(stem: string): number {
  const index = (NATIVE_YEAR_STEMS_0X19F080 as readonly string[]).indexOf(stem);
  if (index < 0) throw new NativeYearStemStarsError(`year stem is outside APK table: ${stem}`);
  return index;
}

function branchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeYearStemStarsError(`branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeYearStemStarsError(`branch index is outside APK table: ${index}`);
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeYearStemStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeYearStemStarsError";
  }
}
