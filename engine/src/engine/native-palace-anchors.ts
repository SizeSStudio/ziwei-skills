import {
  NATIVE_BRANCHES_0X19EE10,
  type NativeCalendarNamedResult,
} from "./native-calendar-named";

export type NativePalaceAnchorGender = "male" | "female";

export type NativePalaceAnchorsResult = {
  lunarYearStem: string;
  yearPolarity: "yang" | "yin";
  genderLabel0x128: "阳男" | "阴男" | "阳女" | "阴女";
  normalizedLunarMonth: number;
  hourBranchIndex: number;
  hourBranch: string;
  mingPalaceIndex0x98: number;
  mingPalaceBranch0x98: string;
  shenPalaceIndex0xb0: number;
  shenPalaceBranch0xb0: string;
};

export type NativePalaceAnchorsEvidenceContract = {
  orchestrator: { functionAddress: string; implementedStart: string; implementedThrough: string };
  polarity: {
    sourceCalendarAdapterOffset: string;
    yangStemLiteral: string;
    literalBuildAddresses: string[];
    genderStringAddresses: Record<NativePalaceAnchorGender, { yang: string; yin: string }>;
  };
  branchTable: { virtualAddress: string; count: number; anchorLiteral: string };
  formulas: {
    ming: { start: string; storeAddress: string; expression: string };
    shen: { start: string; storeAddress: string; expression: string };
  };
  note: string;
};

const YANG_STEMS = new Set(["甲", "丙", "戊", "庚", "壬"]);
const TIGER_BRANCH_INDEX = 2;

export function nativePalaceAnchors0x155370(
  calendar: NativeCalendarNamedResult,
  gender: NativePalaceAnchorGender,
): NativePalaceAnchorsResult {
  const lunarYearStem = calendar.cyclicPair0x110_0x128FromCalendar0xa8_0xac.stem;
  const yearPolarity = YANG_STEMS.has(lunarYearStem) ? "yang" : "yin";
  const normalizedLunarMonth = calendar.lunar0x1d8_0x214.normalizedMonth0x234;
  const hourBranchIndex = calendar.cyclicPair0x1a8_0x1c0FromCalendar0xc0_0xc4.branchIndex;
  const monthAnchor = TIGER_BRANCH_INDEX + normalizedLunarMonth;
  const mingPalaceIndex = positiveModulo(monthAnchor - hourBranchIndex - 1, 12);
  const shenPalaceIndex = positiveModulo(monthAnchor + hourBranchIndex - 1, 12);

  return {
    lunarYearStem,
    yearPolarity,
    genderLabel0x128: genderLabel(yearPolarity, gender),
    normalizedLunarMonth,
    hourBranchIndex,
    hourBranch: branchAt(hourBranchIndex),
    mingPalaceIndex0x98: mingPalaceIndex,
    mingPalaceBranch0x98: branchAt(mingPalaceIndex),
    shenPalaceIndex0xb0: shenPalaceIndex,
    shenPalaceBranch0xb0: branchAt(shenPalaceIndex),
  };
}

export function nativePalaceAnchorsEvidenceContract(): NativePalaceAnchorsEvidenceContract {
  return {
    orchestrator: {
      functionAddress: "0x155370",
      implementedStart: "0x1553f2",
      implementedThrough: "0x1558d2",
    },
    polarity: {
      sourceCalendarAdapterOffset: "0x110 (calendar input 0xa8 stem)",
      yangStemLiteral: "甲丙戊庚壬",
      literalBuildAddresses: ["0x15543c", "0x15552b"],
      genderStringAddresses: {
        male: { yang: "0x60527", yin: "0x79189" },
        female: { yang: "0x6880f", yin: "0x70f52" },
      },
    },
    branchTable: { virtualAddress: "0x19f3d0", count: 12, anchorLiteral: "寅" },
    formulas: {
      ming: {
        start: "0x155801",
        storeAddress: "0x155848",
        expression: "mod12(index(寅) + normalizedMonth - hourBranchIndex - 1)",
      },
      shen: {
        start: "0x1558a0",
        storeAddress: "0x1558d2",
        expression: "mod12(index(寅) + normalizedMonth + hourBranchIndex - 1)",
      },
    },
    note: "static port of the orchestrator prefix only; no palace names, palace stems, stars, transformations, or APP JSON parity are claimed",
  };
}

function genderLabel(
  polarity: "yang" | "yin",
  gender: NativePalaceAnchorGender,
): NativePalaceAnchorsResult["genderLabel0x128"] {
  if (gender === "male") {
    return polarity === "yang" ? "阳男" : "阴男";
  }
  return polarity === "yang" ? "阳女" : "阴女";
}

function branchAt(index: number): string {
  const branch = NATIVE_BRANCHES_0X19EE10[index];
  if (branch === undefined) {
    throw new NativePalaceAnchorsError(`branch index is outside APK table: ${index}`);
  }
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativePalaceAnchorsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativePalaceAnchorsError";
  }
}
