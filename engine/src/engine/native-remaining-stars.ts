import { NativeFiveElementsBureauNumber } from "./native-five-elements-bureau";
import { nativePalaceNames0x157500 } from "./native-palace-names";
import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeGenderPolarityLabel = "阳男" | "阴男" | "阳女" | "阴女";

export type NativeRemainingStarName =
  | "火星" | "铃星" | "天贵" | "恩光" | "天才" | "天寿"
  | "天伤" | "天使" | "岁殿" | "斗杓" | "旬空" | "副旬" | "龙德";

export type NativeRemainingStarPlacement = {
  star: NativeRemainingStarName;
  branch: string;
  branchIndex: number;
  source: "formula" | "palace-name" | "ganzhi-set" | "void-pair" | "annual-cycle";
  evidenceAddress: string;
};

export type NativePalaceCycleFields = {
  branch: string;
  branchIndex: number;
  longsheng0x68: string;
  doctor0x80: string;
  general0x98: string;
  annual0xb0: string;
};

const YEAR_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

const FIRE_BELL_BASES = [
  { group: "寅午戌", fire: "丑", bell: "卯" },
  { group: "申子辰", fire: "寅", bell: "戌" },
  { group: "巳酉丑", fire: "卯", bell: "戌" },
  { group: "亥卯未", fire: "酉", bell: "戌" },
] as const;

const SUIDIAN_GROUPS = [
  {
    branch: "子",
    ganzhi: ["甲子", "庚午", "己未", "戊申", "甲寅", "丁酉", "癸卯", "丙戌", "壬辰", "乙亥", "辛巳"],
  },
  {
    branch: "寅",
    ganzhi: ["丙子", "壬午", "辛未", "乙丑", "庚申", "己酉", "戊戌", "甲辰", "丁亥", "癸巳"],
  },
  {
    branch: "辰",
    ganzhi: ["戊子", "癸未", "丁丑", "丙寅", "壬申", "辛酉", "乙卯", "庚戌", "己亥"],
  },
  {
    branch: "午",
    ganzhi: ["庚子", "甲午", "己丑", "戊寅", "丁卯", "癸酉", "乙卯", "壬戌", "丙辰", "乙巳", "辛亥"],
  },
  {
    branch: "申",
    ganzhi: ["壬子", "丙午", "辛丑", "乙未", "甲申", "庚寅", "己卯", "戊辰", "丁巳", "癸亥"],
  },
  {
    branch: "戌",
    ganzhi: ["戊午", "癸丑", "丁未", "壬寅", "丙申", "辛卯", "乙酉", "庚辰", "甲戌", "己巳"],
  },
] as const;

const VOID_BRANCHES_BY_KEY: Readonly<Record<number, readonly [string, string]>> = {
  0: ["戌", "亥"],
  2: ["子", "丑"],
  4: ["寅", "卯"],
  6: ["辰", "巳"],
  8: ["午", "未"],
  10: ["申", "酉"],
};

const LONGSHENG_NAMES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"] as const;
const LONGSHENG_BASE_BY_BUREAU: Readonly<Record<NativeFiveElementsBureauNumber, string>> = {
  2: "申",
  3: "亥",
  4: "巳",
  5: "申",
  6: "寅",
};

const DOCTOR_NAMES = ["博士", "力士", "青龙", "小耗", "将军", "奏书", "飞廉", "喜神", "病符", "大耗", "伏兵", "官府"] as const;
const LUCUN_BY_STEM = ["寅", "卯", "巳", "午", "巳", "午", "申", "酉", "亥", "子"] as const;

const GENERAL_NAMES = ["将星", "攀鞍", "岁驿", "息神", "华盖", "劫煞", "灾煞", "天煞", "指背", "咸池", "月煞", "亡神"] as const;
const ANNUAL_NAMES = ["岁建", "晦气", "丧门", "贯索", "官符", "小耗", "大耗", "龙德", "白虎", "天德", "吊客", "病符"] as const;

export function nativeRemainingStars0x164d10(input: {
  lunarYearStem: string;
  lunarYearBranch: string;
  normalizedLunarMonth: number;
  lunarDayNumber: number;
  hourBranch: string;
  mingPalaceBranch: string;
  shenPalaceBranch: string;
  bureauNumber: NativeFiveElementsBureauNumber;
  genderPolarityLabel0x128: NativeGenderPolarityLabel;
  extendedStarsFlag0x450: boolean;
}) {
  const yearStemIndex = stemIndex(input.lunarYearStem);
  const yearBranchIndex = branchIndex(input.lunarYearBranch);
  const hourBranchIndex = branchIndex(input.hourBranch);
  const mingPalaceBranchIndex = branchIndex(input.mingPalaceBranch);
  const shenPalaceBranchIndex = branchIndex(input.shenPalaceBranch);
  validateLunarDate(input.normalizedLunarMonth, input.lunarDayNumber);

  const fireBell = FIRE_BELL_BASES.find(({ group }) => group.includes(input.lunarYearBranch));
  if (fireBell === undefined) {
    throw new NativeRemainingStarsError(`year branch is outside 火铃 groups: ${input.lunarYearBranch}`);
  }

  const namedPalaces = nativePalaceNames0x157500(mingPalaceBranchIndex);
  const friendshipBranch = namedPalaces.find(({ name }) => name === "交友")?.branch;
  const healthBranch = namedPalaces.find(({ name }) => name === "疾厄")?.branch;
  if (friendshipBranch === undefined || healthBranch === undefined) {
    throw new NativeRemainingStarsError("missing 交友 or 疾厄 palace from native palace-name layer");
  }

  const placements: NativeRemainingStarPlacement[] = [
    formulaPlacement("火星", fireBell.fire, hourBranchIndex, "0x164d10..0x165812"),
    formulaPlacement("铃星", fireBell.bell, hourBranchIndex, "0x164d10..0x165812"),
    formulaPlacement("天贵", "辰", input.lunarDayNumber + hourBranchIndex - 2, "0x165bd1..0x165c76"),
    formulaPlacement("恩光", "戌", input.lunarDayNumber - 2 - hourBranchIndex, "0x165cbf..0x165d9b"),
    formulaPlacement("天才", input.mingPalaceBranch, yearBranchIndex, "0x165de0..0x165f13"),
    formulaPlacement("天寿", input.shenPalaceBranch, yearBranchIndex, "0x165f58..0x166093"),
    directPlacement("天伤", friendshipBranch, "palace-name", "0x1660d8..0x166180"),
    directPlacement("天使", healthBranch, "palace-name", "0x1661c5..0x16623e"),
  ];

  if (input.extendedStarsFlag0x450) {
    placements.push(
      directPlacement("岁殿", suidianBranch(input.lunarYearStem + input.lunarYearBranch), "ganzhi-set", "0x1662a4..0x169f20"),
      formulaPlacement("斗杓", input.hourBranch, input.normalizedLunarMonth + 3, "0x1664b8..0x166574"),
    );
  }

  const voidPair = VOID_BRANCHES_BY_KEY[positiveModulo(yearBranchIndex - yearStemIndex, 12)];
  if (voidPair === undefined) {
    throw new NativeRemainingStarsError(`missing 旬空 pair for stem/branch indexes: ${yearStemIndex}/${yearBranchIndex}`);
  }
  const yangStem = yearStemIndex % 2 === 0;
  placements.push(
    directPlacement(yangStem ? "旬空" : "副旬", voidPair[0], "void-pair", "0x1665df..0x167374"),
    directPlacement(yangStem ? "副旬" : "旬空", voidPair[1], "void-pair", "0x1665df..0x167374"),
  );

  const forward = input.genderPolarityLabel0x128 === "阳男" || input.genderPolarityLabel0x128 === "阴女";
  const longshengByBranch = cycleByBranch(LONGSHENG_NAMES, LONGSHENG_BASE_BY_BUREAU[input.bureauNumber], forward ? 1 : -1);
  const doctorByBranch = cycleByBranch(DOCTOR_NAMES, requiredTableValue(LUCUN_BY_STEM, yearStemIndex, "禄存"), forward ? 1 : -1);
  const generalByBranch = cycleByBranch(GENERAL_NAMES, generalBase(input.lunarYearBranch), 1);
  const annualByBranch = cycleByBranch(ANNUAL_NAMES, input.lunarYearBranch, 1);

  const longdeBranch = branchAt(positiveModulo(yearBranchIndex + 7, 12));
  placements.push(directPlacement("龙德", longdeBranch, "annual-cycle", "0x169392..0x1694f3"));

  const byBranch = Object.fromEntries(
    NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch) => [branch, [] as NativeRemainingStarName[]]),
  );
  for (const placement of placements) byBranch[placement.branch]?.push(placement.star);

  const palaceCycleFields: NativePalaceCycleFields[] = NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch, branchIndexValue) => ({
    branch,
    branchIndex: branchIndexValue,
    longsheng0x68: requiredCycleValue(longshengByBranch, branch, "长生"),
    doctor0x80: requiredCycleValue(doctorByBranch, branch, "博士"),
    general0x98: requiredCycleValue(generalByBranch, branch, "将前"),
    annual0xb0: requiredCycleValue(annualByBranch, branch, "岁前"),
  }));

  return {
    lunarYearGanzhi: input.lunarYearStem + input.lunarYearBranch,
    yearStemIndex,
    yearBranchIndex,
    hourBranchIndex,
    mingPalaceBranchIndex,
    shenPalaceBranchIndex,
    extendedStarsFlag0x450: input.extendedStarsFlag0x450,
    cycleDirection: forward ? "forward" as const : "reverse" as const,
    placements,
    byBranch,
    longshengByBranch,
    doctorByBranch,
    generalByBranch,
    annualByBranch,
    palaceCycleFields,
  };
}

export function nativeRemainingStarsEvidenceContract() {
  return {
    functionRange: "[0x164d10, 0x169552) normal semantic path; cleanup extends to 0x16b093",
    branchShiftHelper: "0x176260",
    starInsertHelper: "0x1789c0 -> node+0x170",
    fieldAssignHelper: "0x178c80 -> node+0x68",
    extendedGate: { compareAddress: "0x16624f", contextOffset: "0x450", gatedStars: ["岁殿", "斗杓"] },
    suidianGroups: SUIDIAN_GROUPS.map(({ branch, ganzhi }) => ({ branch, ganzhi: [...ganzhi] })),
    suidianControlFlowNote: "乙卯 appears in 辰 and 午 comparisons; ordered native control flow returns 辰 first",
    voidPairs: Object.entries(VOID_BRANCHES_BY_KEY).map(([key, branches]) => ({ key: Number(key), branches: [...branches] })),
    longsheng: { tableAddress: "0x1a00c0", nodeOffset: "0x68", basesByBureau: { ...LONGSHENG_BASE_BY_BUREAU } },
    doctor: { tableAddress: "0x1a0120", nodeOffset: "0x80", base: "禄存 table 0x1a0180" },
    general: { tableAddress: "0x1a01d0", nodeOffset: "0x98" },
    annual: { tableAddress: "0x1a0230", nodeOffset: "0xb0", longdeStarIndex: 7 },
    directionRule: "阳男 or 阴女 moves 长生/博士 forward; 阴男 or 阳女 moves backward",
  };
}

function suidianBranch(ganzhi: string): string {
  const match = SUIDIAN_GROUPS.find(({ ganzhi: group }) => (group as readonly string[]).includes(ganzhi));
  if (match === undefined) throw new NativeRemainingStarsError(`ganzhi is outside APK 岁殿 comparisons: ${ganzhi}`);
  return match.branch;
}

function generalBase(yearBranch: string): string {
  if ("寅午戌".includes(yearBranch)) return "午";
  if ("申子辰".includes(yearBranch)) return "子";
  if ("巳酉丑".includes(yearBranch)) return "酉";
  if ("亥卯未".includes(yearBranch)) return "卯";
  throw new NativeRemainingStarsError(`year branch is outside 将前 groups: ${yearBranch}`);
}

function cycleByBranch(names: readonly string[], baseBranch: string, direction: 1 | -1): Record<string, string> {
  const baseIndex = branchIndex(baseBranch);
  const result: Record<string, string> = {};
  names.forEach((name, index) => {
    result[branchAt(positiveModulo(baseIndex + direction * index, 12))] = name;
  });
  return result;
}

function formulaPlacement(
  star: NativeRemainingStarName,
  baseBranch: string,
  offset: number,
  evidenceAddress: string,
): NativeRemainingStarPlacement {
  const targetIndex = positiveModulo(branchIndex(baseBranch) + offset, 12);
  return { star, branch: branchAt(targetIndex), branchIndex: targetIndex, source: "formula", evidenceAddress };
}

function directPlacement(
  star: NativeRemainingStarName,
  branch: string,
  source: NativeRemainingStarPlacement["source"],
  evidenceAddress: string,
): NativeRemainingStarPlacement {
  return { star, branch, branchIndex: branchIndex(branch), source, evidenceAddress };
}

function validateLunarDate(month: number, day: number): void {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new NativeRemainingStarsError(`normalized lunar month is outside APK range: ${month}`);
  }
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new NativeRemainingStarsError(`lunar day is outside APK range: ${day}`);
  }
}

function stemIndex(stem: string): number {
  const index = (YEAR_STEMS as readonly string[]).indexOf(stem);
  if (index < 0) throw new NativeRemainingStarsError(`year stem is outside APK table: ${stem}`);
  return index;
}

function branchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeRemainingStarsError(`branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeRemainingStarsError(`branch index is outside APK table: ${index}`);
  return branch;
}

function requiredTableValue(table: readonly string[], index: number, label: string): string {
  const value = table[index];
  if (value === undefined) throw new NativeRemainingStarsError(`missing ${label} table entry: ${index}`);
  return value;
}

function requiredCycleValue(values: Record<string, string>, branch: string, label: string): string {
  const value = values[branch];
  if (value === undefined) throw new NativeRemainingStarsError(`missing ${label} value for branch: ${branch}`);
  return value;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeRemainingStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeRemainingStarsError";
  }
}
