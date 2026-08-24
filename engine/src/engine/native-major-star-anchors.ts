import type { NativeFiveElementsBureauNumber } from "./native-five-elements-bureau";
import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeMajorStarAnchorsResult = {
  lunarDayNumber0x210: number;
  bureauNumber: NativeFiveElementsBureauNumber;
  quotientBeforeCorrection: number;
  remainder: number;
  complementToBureau: number;
  ziweiOffsetFromTiger: number;
  ziweiBranchIndex: number;
  ziweiBranch: string;
  tianfuBranchIndex: number;
  tianfuBranch: string;
};

export type NativeMajorStarAnchorsEvidenceContract = {
  orchestratorRange: string;
  ziweiBaseBranch: string;
  ziweiExpression: string;
  branchShiftHelper: string;
  tianfuHelperRange: string;
  tianfuExpression: string;
  note: string;
};

const TIGER_BRANCH_INDEX = 2;

export function nativeMajorStarAnchors(input: {
  lunarDayNumber: number;
  bureauNumber: NativeFiveElementsBureauNumber;
}): NativeMajorStarAnchorsResult {
  if (!Number.isInteger(input.lunarDayNumber) || input.lunarDayNumber < 1 || input.lunarDayNumber > 31) {
    throw new NativeMajorStarAnchorsError(`lunar day number is outside APK adapter range: ${input.lunarDayNumber}`);
  }

  const quotientBeforeCorrection = Math.trunc(input.lunarDayNumber / input.bureauNumber);
  const remainder = input.lunarDayNumber % input.bureauNumber;
  const complementToBureau = remainder === 0 ? 0 : input.bureauNumber - remainder;
  let correctedQuotient = quotientBeforeCorrection;
  if (remainder !== 0) {
    correctedQuotient = Math.trunc((input.lunarDayNumber + complementToBureau) / input.bureauNumber);
    correctedQuotient += complementToBureau % 2 === 0 ? complementToBureau : -complementToBureau;
  }
  const ziweiOffsetFromTiger = correctedQuotient - 1;
  const ziweiBranchIndex = positiveModulo(TIGER_BRANCH_INDEX + ziweiOffsetFromTiger, 12);
  const ziweiBranch = branchAt(ziweiBranchIndex);
  const tianfuBranchIndex = ziweiBranchIndex <= 4 ? 4 - ziweiBranchIndex : 16 - ziweiBranchIndex;
  const tianfuBranch = branchAt(tianfuBranchIndex);

  return {
    lunarDayNumber0x210: input.lunarDayNumber,
    bureauNumber: input.bureauNumber,
    quotientBeforeCorrection,
    remainder,
    complementToBureau,
    ziweiOffsetFromTiger,
    ziweiBranchIndex,
    ziweiBranch,
    tianfuBranchIndex,
    tianfuBranch,
  };
}

export function nativeMajorStarAnchorsEvidenceContract(): NativeMajorStarAnchorsEvidenceContract {
  return {
    orchestratorRange: "0x155f35..0x155f7d",
    ziweiBaseBranch: "寅",
    ziweiExpression: "q=floor(day/bureau); if r!=0: s=bureau-r, q=ceil(day/bureau)+(s even ? s : -s); offset=q-1",
    branchShiftHelper: "0x176260",
    tianfuHelperRange: "[0x15ace0, 0x15ae78)",
    tianfuExpression: "ziweiIndex <= 4 ? 4 - ziweiIndex : 16 - ziweiIndex",
    note: "static port of 紫微 and 天府 anchor branches; star-sequence placement is ported separately from 0x15aeb0 and 0x15ba70",
  };
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) {
    throw new NativeMajorStarAnchorsError(`branch index is outside APK table: ${index}`);
  }
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeMajorStarAnchorsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMajorStarAnchorsError";
  }
}
