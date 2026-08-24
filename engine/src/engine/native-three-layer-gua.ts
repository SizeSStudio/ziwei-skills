import type { NativeMajorLimitDirection } from "./native-major-limits";
import {
  NATIVE_PALACE_BRANCHES_0X19F3D0,
  type NativePalaceStem,
} from "./native-palace-stems";

export type NativeThreeLayerGuaResult = {
  layer1_1_0x390: string;
  layer1_2_0x3a8: string;
  layer2_1_0x3c0: string;
  layer2_2_0x3d8: string;
  layer3_1_0x3f0: string;
  layer3_2_0x408: string;
  firstShift: number;
  secondShift: number;
};

const SECONDARY_BRANCH_0X178F00: Readonly<Record<string, string>> = {
  子: "寅",
  丑: "卯",
  寅: "子",
  卯: "丑",
};

export function nativeSecondaryGuaBranch0x178f00(branch: string): string {
  nativeBranchIndex(branch);
  return SECONDARY_BRANCH_0X178F00[branch] ?? "";
}

export function nativeThreeLayerGua0x16c4c0(input: {
  lunarYearStem: string;
  palaceStems: ReadonlyArray<Pick<NativePalaceStem, "branch" | "stem">>;
  hourCode: number;
  minuteField: number;
  direction: NativeMajorLimitDirection;
}): NativeThreeLayerGuaResult {
  assertInteger(input.hourCode, "hourCode");
  assertInteger(input.minuteField, "minuteField");
  validatePalaceStems(input.palaceStems);

  // Native skips 子 and 丑 so the repeated stems at the end of the
  // twelve-palace sequence cannot be selected.
  const causePalace = input.palaceStems.find(
    ({ branch, stem }) => branch !== "子" && branch !== "丑" && stem === input.lunarYearStem,
  );
  if (causePalace === undefined) {
    throw new NativeThreeLayerGuaError(`no non-子丑 palace carries lunar year stem: ${input.lunarYearStem}`);
  }

  const parityAdjustedMinute = input.hourCode % 2 === 0 ? input.minuteField + 60 : input.minuteField;
  let firstShift = Math.trunc(parityAdjustedMinute / 10);
  let secondShift = parityAdjustedMinute - Math.trunc(parityAdjustedMinute / 12) * 12;
  if (input.direction === "逆") {
    firstShift = -firstShift;
    secondShift = -secondShift;
  }

  const layer1_1_0x390 = causePalace.branch;
  const layer2_1_0x3c0 = shiftBranch(layer1_1_0x390, firstShift);
  const layer3_1_0x3f0 = shiftBranch(layer1_1_0x390, secondShift);
  return {
    layer1_1_0x390,
    layer1_2_0x3a8: nativeSecondaryGuaBranch0x178f00(layer1_1_0x390),
    layer2_1_0x3c0,
    layer2_2_0x3d8: nativeSecondaryGuaBranch0x178f00(layer2_1_0x3c0),
    layer3_1_0x3f0,
    layer3_2_0x408: nativeSecondaryGuaBranch0x178f00(layer3_1_0x3f0),
    firstShift,
    secondShift,
  };
}

export function nativeThreeLayerGuaEvidenceContract() {
  return {
    functionRange: "[0x16c4c0, 0x16ccf2)",
    branchTable: "0x19f3d0",
    palaceStemOffset: "node+0x50",
    directionOffset: "chart+0xc8",
    helper: "0x178f00",
    shiftHelper: "0x176260",
    dateInputs: "calendar wrapper APP hourCode and fixed minute-field doubles",
    fields: {
      "层1.1": "chart+0x390",
      "层1.2": "chart+0x3a8",
      "层2.1": "chart+0x3c0",
      "层2.2": "chart+0x3d8",
      "层3.1": "chart+0x3f0",
      "层3.2": "chart+0x408",
    },
    secondaryBranches: { ...SECONDARY_BRANCH_0X178F00 },
  };
}

function shiftBranch(branch: string, offset: number): string {
  return branchAt(positiveModulo(nativeBranchIndex(branch) + offset, 12));
}

function validatePalaceStems(palaces: ReadonlyArray<Pick<NativePalaceStem, "branch" | "stem">>): void {
  if (palaces.length !== 12) {
    throw new NativeThreeLayerGuaError(`chart must contain 12 palace stems, got: ${palaces.length}`);
  }
  const branches = new Set<string>();
  for (const palace of palaces) {
    nativeBranchIndex(palace.branch);
    if (branches.has(palace.branch)) {
      throw new NativeThreeLayerGuaError(`duplicate palace branch: ${palace.branch}`);
    }
    branches.add(palace.branch);
  }
}

function nativeBranchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeThreeLayerGuaError(`branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeThreeLayerGuaError(`branch index is outside APK table: ${index}`);
  return branch;
}

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new NativeThreeLayerGuaError(`${field} must be an integer: ${value}`);
  }
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeThreeLayerGuaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeThreeLayerGuaError";
  }
}
