import { NATIVE_STEMS_0X19ED00 } from "./native-calendar-named";

export const NATIVE_PALACE_BRANCHES_0X19F3D0 = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;

export const NATIVE_GONG_GAN_BRANCH_ORDER_0X19F020 = [
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
  "子",
  "丑",
] as const;

export type NativePalaceStem = {
  branchIndex: number;
  branch: string;
  stemIndex: number;
  stem: string;
};

export type NativePalaceStemsEvidenceContract = {
  orchestrator: string;
  helper: string;
  branchTable: string;
  stemTable: string;
  yearStemGroups: ReadonlyArray<{ yearStems: string; tigerPalaceStem: string; compareRange: string }>;
  operationRange: string;
  note: string;
};

const TIGER_PALACE_STEM_INDEX_BY_YEAR_STEM: Readonly<Record<string, number>> = {
  甲: 2,
  己: 2,
  乙: 4,
  庚: 4,
  丙: 6,
  辛: 6,
  丁: 8,
  壬: 8,
  戊: 0,
  癸: 0,
};

export function nativePalaceStems0x156fb0(lunarYearStem: string): NativePalaceStem[] {
  const tigerPalaceStemIndex = TIGER_PALACE_STEM_INDEX_BY_YEAR_STEM[lunarYearStem];
  if (tigerPalaceStemIndex === undefined) {
    throw new NativePalaceStemsError(`year stem is outside APK table: ${lunarYearStem}`);
  }

  return NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch, branchIndex) => {
    const gongGanBranchIndex = NATIVE_GONG_GAN_BRANCH_ORDER_0X19F020.indexOf(branch);
    if (gongGanBranchIndex < 0) {
      throw new NativePalaceStemsError(`branch is outside APK gong-gan table: ${branch}`);
    }
    const stemIndex = (tigerPalaceStemIndex + gongGanBranchIndex) % 10;
    const stem = NATIVE_STEMS_0X19ED00[stemIndex];
    if (stem === undefined) {
      throw new NativePalaceStemsError(`stem index is outside APK table: ${stemIndex}`);
    }
    return { branchIndex, branch, stemIndex, stem };
  });
}

export function nativePalaceStemsEvidenceContract(): NativePalaceStemsEvidenceContract {
  return {
    orchestrator: "0x15563d -> 0x156fb0",
    helper: "0x15712b -> 0x1753a0",
    branchTable: "0x19f3d0 (宫节点顺序), 0x19f020 (寅起索引顺序)",
    stemTable: "0x19f080 / 0x19ed00",
    yearStemGroups: [
      { yearStems: "甲己", tigerPalaceStem: "丙", compareRange: "0x175404..0x1755b3" },
      { yearStems: "乙庚", tigerPalaceStem: "戊", compareRange: "0x1755c1..0x175769" },
      { yearStems: "丙辛", tigerPalaceStem: "庚", compareRange: "0x175777..0x1759e3" },
      { yearStems: "丁壬", tigerPalaceStem: "壬", compareRange: "0x1757bc..0x1758bb" },
      { yearStems: "戊癸", tigerPalaceStem: "甲", compareRange: "0x1758e8..0x175b5c" },
    ],
    operationRange: "0x17555e..0x1755b3 and four equivalent branches: (branchIndex + tigerStemIndex) % 10",
    note: "static port of palace-node creation's stem assignment only; palace names and all star layers remain separate",
  };
}

export class NativePalaceStemsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativePalaceStemsError";
  }
}
