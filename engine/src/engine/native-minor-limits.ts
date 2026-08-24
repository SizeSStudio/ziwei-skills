import type { NativePalaceAnchorGender } from "./native-palace-anchors";
import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeMinorLimitPalace = {
  branchIndex: number;
  branch: string;
  ages: number[];
  label0xe0: string;
};

export type NativeMinorLimitsResult = {
  lunarYearBranch: string;
  gender: NativePalaceAnchorGender;
  ageOneAnchorBranch: string;
  directionStep: 1 | -1;
  palaces: NativeMinorLimitPalace[];
};

export type NativeMinorLimitsEvidenceContract = {
  functionRange: string;
  yearBranchGroups: ReadonlyArray<{ group: string; anchor: string; range: string }>;
  genderLiteralAddress: string;
  formatAddress: string;
  format: string;
  ageRange: string;
  maleOffset: string;
  femaleOffset: string;
  nodeOffset: string;
  note: string;
};

const AGE_ONE_ANCHOR_BY_YEAR_GROUP = [
  { group: "寅午戌", anchor: "辰" },
  { group: "申子辰", anchor: "戌" },
  { group: "巳酉丑", anchor: "未" },
  { group: "亥卯未", anchor: "丑" },
] as const;

export function nativeMinorLimits0x1597d0(
  lunarYearBranch: string,
  gender: NativePalaceAnchorGender,
): NativeMinorLimitsResult {
  const anchorRule = AGE_ONE_ANCHOR_BY_YEAR_GROUP.find(({ group }) => group.includes(lunarYearBranch));
  if (anchorRule === undefined) {
    throw new NativeMinorLimitsError(`lunar year branch is outside APK groups: ${lunarYearBranch}`);
  }
  const anchorBranchIndex = NATIVE_PALACE_BRANCHES_0X19F3D0.indexOf(anchorRule.anchor);
  if (anchorBranchIndex < 0) {
    throw new NativeMinorLimitsError(`anchor branch is outside APK table: ${anchorRule.anchor}`);
  }
  const directionStep: 1 | -1 = gender === "male" ? 1 : -1;
  const agesByBranch = Array.from({ length: 12 }, () => [] as number[]);

  for (let age = 1; age <= 72; age += 1) {
    const relativeOffset = (age - 1) * directionStep;
    const branchIndex = positiveModulo(anchorBranchIndex + relativeOffset, 12);
    agesByBranch[branchIndex]?.push(age);
  }

  const palaces = NATIVE_PALACE_BRANCHES_0X19F3D0.map((branch, branchIndex) => {
    const ages = agesByBranch[branchIndex] ?? [];
    return { branchIndex, branch, ages, label0xe0: ages.map((age) => `${age},`).join("") };
  });

  return {
    lunarYearBranch,
    gender,
    ageOneAnchorBranch: anchorRule.anchor,
    directionStep,
    palaces,
  };
}

export function nativeMinorLimitsEvidenceContract(): NativeMinorLimitsEvidenceContract {
  return {
    functionRange: "[0x1597d0, 0x159f28)",
    yearBranchGroups: [
      { group: "寅午戌", anchor: "辰", range: "0x159804..0x15987a" },
      { group: "申子辰", anchor: "戌", range: "0x1598b0..0x159938" },
      { group: "巳酉丑", anchor: "未", range: "0x15997a..0x159a02" },
      { group: "亥卯未", anchor: "丑", range: "0x159a44..0x159b0f" },
    ],
    genderLiteralAddress: "0x789fa (男)",
    formatAddress: "0x7ea82",
    format: "%d,",
    ageRange: "1..72",
    maleOffset: "0..71",
    femaleOffset: "0..-71",
    nodeOffset: "palace node +0xe0",
    note: "static port of minor-limit age labels only; annual stem/branch overlays and stars remain separate",
  };
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeMinorLimitsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMinorLimitsError";
  }
}
