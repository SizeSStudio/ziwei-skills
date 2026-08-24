import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeMonthDayStarsResult = {
  normalizedLunarMonth: number;
  lunarDayNumber: number;
  monthDaySum: number;
  placements: Array<{
    star: "三台" | "八座";
    baseBranch: "辰" | "戌";
    offset: number;
    branchIndex: number;
    branch: string;
  }>;
};

export function nativeMonthDayStars0x15f510(input: {
  normalizedLunarMonth: number;
  lunarDayNumber: number;
}): NativeMonthDayStarsResult {
  if (!Number.isInteger(input.normalizedLunarMonth) || input.normalizedLunarMonth < 1 || input.normalizedLunarMonth > 12) {
    throw new NativeMonthDayStarsError(`lunar month is outside APK range: ${input.normalizedLunarMonth}`);
  }
  if (!Number.isInteger(input.lunarDayNumber) || input.lunarDayNumber < 1 || input.lunarDayNumber > 31) {
    throw new NativeMonthDayStarsError(`lunar day is outside APK range: ${input.lunarDayNumber}`);
  }
  const monthDaySum = input.normalizedLunarMonth + input.lunarDayNumber;
  const santaiOffset = monthDaySum - 2;
  const bazuoOffset = 2 - monthDaySum;

  return {
    normalizedLunarMonth: input.normalizedLunarMonth,
    lunarDayNumber: input.lunarDayNumber,
    monthDaySum,
    placements: [
      placement("三台", "辰", santaiOffset),
      placement("八座", "戌", bazuoOffset),
    ],
  };
}

export function nativeMonthDayStarsEvidenceContract() {
  return {
    functionRange: "[0x15f510, 0x15f701)",
    formulas: [
      { star: "三台", base: "辰", expression: "month + day - 2", addresses: "0x15f538..0x15f5b4" },
      { star: "八座", base: "戌", expression: "2 - (month + day)", addresses: "0x15f5d6..0x15f6b1" },
    ],
    branchShiftHelper: "0x176260",
    insertionHelper: "0x1789c0",
    note: "the insertion helper differs from the direct node+0x170 assignments used by main and month stars",
  };
}

function placement(
  star: "三台" | "八座",
  baseBranch: "辰" | "戌",
  offset: number,
): NativeMonthDayStarsResult["placements"][number] {
  const baseIndex = NATIVE_PALACE_BRANCHES_0X19F3D0.indexOf(baseBranch);
  const branchIndex = positiveModulo(baseIndex + offset, 12);
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[branchIndex];
  if (branch === undefined) throw new NativeMonthDayStarsError(`branch index is outside APK table: ${branchIndex}`);
  return { star, baseBranch, offset, branchIndex, branch };
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeMonthDayStarsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMonthDayStarsError";
  }
}
