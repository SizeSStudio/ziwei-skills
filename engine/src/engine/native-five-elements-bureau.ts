export type NativeFiveElementsBureauNumber = 2 | 3 | 4 | 5 | 6;
export type NativeFiveElementsBureauName = "水二局" | "木三局" | "金四局" | "土五局" | "火六局";

export type NativeFiveElementsBureauResult = {
  palaceStem: string;
  palaceBranch: string;
  stemGroup1Based: number;
  branchGroup1Based: number;
  wrappedKey0x1cc: number;
  bureauNumber: NativeFiveElementsBureauNumber;
  bureauName0x110: NativeFiveElementsBureauName;
};

export type NativeFiveElementsBureauEvidenceContract = {
  helperRange: string;
  callerRange: string;
  stemGroups: string[];
  branchGroups: string[];
  wrapExpression: string;
  keyToBureau: number[];
  bureauStringAddresses: string[];
  note: string;
};

const STEM_GROUPS = ["甲乙", "丙丁", "戊己", "庚辛", "壬癸"] as const;
const BRANCH_GROUPS = ["子丑午未", "寅卯申酉", "辰巳戌亥"] as const;
const BUREAU_BY_KEY = [5, 3, 4, 2, 6] as const;
const BUREAU_NAMES: Readonly<Record<NativeFiveElementsBureauNumber, NativeFiveElementsBureauName>> = {
  2: "水二局",
  3: "木三局",
  4: "金四局",
  5: "土五局",
  6: "火六局",
};

export function nativeFiveElementsBureau0x1586a0(
  palaceStem: string,
  palaceBranch: string,
): NativeFiveElementsBureauResult {
  const stemGroupIndex = STEM_GROUPS.findIndex((group) => group.includes(palaceStem));
  const branchGroupIndex = BRANCH_GROUPS.findIndex((group) => group.includes(palaceBranch));
  if (stemGroupIndex < 0) {
    throw new NativeFiveElementsBureauError(`palace stem is outside APK groups: ${palaceStem}`);
  }
  if (branchGroupIndex < 0) {
    throw new NativeFiveElementsBureauError(`palace branch is outside APK groups: ${palaceBranch}`);
  }

  const stemGroup1Based = stemGroupIndex + 1;
  const branchGroup1Based = branchGroupIndex + 1;
  const sum = stemGroup1Based + branchGroup1Based;
  const wrappedKey0x1cc = sum >= 5 ? sum - 5 : sum;
  const bureauNumber = BUREAU_BY_KEY[wrappedKey0x1cc];
  if (bureauNumber === undefined) {
    throw new NativeFiveElementsBureauError(`wrapped key is outside APK map: ${wrappedKey0x1cc}`);
  }

  return {
    palaceStem,
    palaceBranch,
    stemGroup1Based,
    branchGroup1Based,
    wrappedKey0x1cc,
    bureauNumber,
    bureauName0x110: BUREAU_NAMES[bureauNumber],
  };
}

export function nativeFiveElementsBureauEvidenceContract(): NativeFiveElementsBureauEvidenceContract {
  return {
    helperRange: "[0x1586a0, 0x159039)",
    callerRange: "0x155a6e..0x155b99",
    stemGroups: [...STEM_GROUPS],
    branchGroups: [...BRANCH_GROUPS],
    wrapExpression: "sum = stemGroup1Based + branchGroup1Based; key = sum >= 5 ? sum - 5 : sum",
    keyToBureau: [...BUREAU_BY_KEY],
    bureauStringAddresses: ["0x66394", "0x808f9", "0x76b62", "0x76b6c", "0x7277a"],
    note: "static port of the life-palace stem/branch to 五行局 mapping; large-limit placement remains in 0x159170",
  };
}

export class NativeFiveElementsBureauError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeFiveElementsBureauError";
  }
}
