import type { NativePalaceAnchorsResult } from "./native-palace-anchors";
import type { NativeFiveElementsBureauNumber } from "./native-five-elements-bureau";
import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeMajorLimitDirection = "顺" | "逆";

export type NativeMajorLimit = {
  sequenceIndex: number;
  relativeOffsetFromMing: number;
  branchIndex: number;
  branch: string;
  startAge: number;
  endAge: number;
  label0xc8: string;
};

export type NativeMajorLimitsResult = {
  genderLabel0x128: NativePalaceAnchorsResult["genderLabel0x128"];
  direction0xc8: NativeMajorLimitDirection;
  bureauNumber: NativeFiveElementsBureauNumber;
  limits: NativeMajorLimit[];
};

export type NativeMajorLimitsEvidenceContract = {
  functionRange: string;
  forwardLabels: string;
  directionStringAddresses: { forward: string; reverse: string };
  formatAddress: string;
  format: string;
  forwardLoop: string;
  reverseLoop: string;
  nodeOffset: string;
  note: string;
};

export function nativeMajorLimits0x159170(input: {
  genderLabel: NativePalaceAnchorsResult["genderLabel0x128"];
  bureauNumber: NativeFiveElementsBureauNumber;
  mingPalaceBranchIndex: number;
}): NativeMajorLimitsResult {
  if (!Number.isInteger(input.mingPalaceBranchIndex) || input.mingPalaceBranchIndex < 0 || input.mingPalaceBranchIndex >= 12) {
    throw new NativeMajorLimitsError(`ming palace branch index is outside APK table: ${input.mingPalaceBranchIndex}`);
  }

  const direction0xc8: NativeMajorLimitDirection =
    input.genderLabel === "阳男" || input.genderLabel === "阴女" ? "顺" : "逆";
  const directionStep = direction0xc8 === "顺" ? 1 : -1;
  const limits = Array.from({ length: 12 }, (_, sequenceIndex): NativeMajorLimit => {
    const relativeOffsetFromMing = sequenceIndex * directionStep;
    const branchIndex = positiveModulo(input.mingPalaceBranchIndex + relativeOffsetFromMing, 12);
    const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[branchIndex];
    if (branch === undefined) {
      throw new NativeMajorLimitsError(`branch index is outside APK table: ${branchIndex}`);
    }
    const startAge = input.bureauNumber + sequenceIndex * 10;
    const endAge = startAge + 9;
    return {
      sequenceIndex,
      relativeOffsetFromMing,
      branchIndex,
      branch,
      startAge,
      endAge,
      label0xc8: `${startAge}~${endAge}`,
    };
  });

  return {
    genderLabel0x128: input.genderLabel,
    direction0xc8,
    bureauNumber: input.bureauNumber,
    limits,
  };
}

export function nativeMajorLimitsEvidenceContract(): NativeMajorLimitsEvidenceContract {
  return {
    functionRange: "[0x159170, 0x1597c8)",
    forwardLabels: "阳男 or 阴女",
    directionStringAddresses: { forward: "0x751b9", reverse: "0x6e3e4" },
    formatAddress: "0x7ea7c",
    format: "%d~%d",
    forwardLoop: "0x159272..0x159463: relative 0..11, age += 10",
    reverseLoop: "0x15954d..0x15971e: relative 0..-11, age += 10",
    nodeOffset: "palace node +0xc8",
    note: "static port of major-limit direction and twelve labels; annual and minor limits remain separate helpers",
  };
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

export class NativeMajorLimitsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeMajorLimitsError";
  }
}
