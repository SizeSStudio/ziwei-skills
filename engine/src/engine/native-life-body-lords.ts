export type NativeLifeLord = "贪狼" | "巨门" | "禄存" | "文曲" | "廉贞" | "武曲" | "破军";
export type NativeBodyLord = "火星" | "天相" | "天梁" | "天同" | "文昌" | "天机" | "铃星";

export type NativeLifeBodyLordsResult = {
  mingPalaceBranch: string;
  lifeLord0xe0: NativeLifeLord;
  lunarYearBranch: string;
  bodyLord0xf8: NativeBodyLord;
};

export type NativeLifeBodyLordsEvidenceContract = {
  lifeLordFunctionRange: string;
  bodyLordFunctionRange: string;
  lifeLordRules: ReadonlyArray<{ branches: string; star: NativeLifeLord; stringAddress: string }>;
  bodyLordRules: ReadonlyArray<{ branches: string; star: NativeBodyLord; stringAddress: string }>;
  contextOffsets: { lifeLord: string; bodyLord: string };
  note: string;
};

const LIFE_LORD_RULES = [
  { branches: "子", star: "贪狼", stringAddress: "0x73a56" },
  { branches: "丑亥", star: "巨门", stringAddress: "0x72773" },
  { branches: "寅戌", star: "禄存", stringAddress: "0x751bd" },
  { branches: "卯酉", star: "文曲", stringAddress: "0x691ec" },
  { branches: "辰申", star: "廉贞", stringAddress: "0x67ba3" },
  { branches: "巳未", star: "武曲", stringAddress: "0x5de93" },
  { branches: "午", star: "破军", stringAddress: "0x23ccb" },
] as const;

const BODY_LORD_RULES = [
  { branches: "子", star: "火星", stringAddress: "0x6e3e8" },
  { branches: "丑未", star: "天相", stringAddress: "0x6c324" },
  { branches: "寅申", star: "天梁", stringAddress: "0x6638d" },
  { branches: "卯酉", star: "天同", stringAddress: "0x7a5e7" },
  { branches: "辰戌", star: "文昌", stringAddress: "0x808f2" },
  { branches: "巳亥", star: "天机", stringAddress: "0x5eaa7" },
  { branches: "午", star: "铃星", stringAddress: "0x63c6a" },
] as const;

export function nativeLifeLord0x15a100(mingPalaceBranch: string): NativeLifeLord {
  const rule = LIFE_LORD_RULES.find(({ branches }) => branches.includes(mingPalaceBranch));
  if (rule === undefined) {
    throw new NativeLifeBodyLordsError(`ming palace branch is outside APK life-lord rules: ${mingPalaceBranch}`);
  }
  return rule.star;
}

export function nativeBodyLord0x15a6b0(lunarYearBranch: string): NativeBodyLord {
  const rule = BODY_LORD_RULES.find(({ branches }) => branches.includes(lunarYearBranch));
  if (rule === undefined) {
    throw new NativeLifeBodyLordsError(`lunar year branch is outside APK body-lord rules: ${lunarYearBranch}`);
  }
  return rule.star;
}

export function nativeLifeBodyLords(input: {
  mingPalaceBranch: string;
  lunarYearBranch: string;
}): NativeLifeBodyLordsResult {
  return {
    mingPalaceBranch: input.mingPalaceBranch,
    lifeLord0xe0: nativeLifeLord0x15a100(input.mingPalaceBranch),
    lunarYearBranch: input.lunarYearBranch,
    bodyLord0xf8: nativeBodyLord0x15a6b0(input.lunarYearBranch),
  };
}

export function nativeLifeBodyLordsEvidenceContract(): NativeLifeBodyLordsEvidenceContract {
  return {
    lifeLordFunctionRange: "[0x15a100, 0x15a640)",
    bodyLordFunctionRange: "[0x15a6b0, 0x15abf0)",
    lifeLordRules: LIFE_LORD_RULES.map((rule) => ({ ...rule })),
    bodyLordRules: BODY_LORD_RULES.map((rule) => ({ ...rule })),
    contextOffsets: { lifeLord: "0xe0", bodyLord: "0xf8" },
    note: "static port of 命主 and 身主 only; these strings are chart metadata, not star placements in palace vectors",
  };
}

export class NativeLifeBodyLordsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeLifeBodyLordsError";
  }
}
