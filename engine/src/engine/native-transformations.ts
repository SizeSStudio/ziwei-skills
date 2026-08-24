import { NATIVE_PALACE_BRANCHES_0X19F3D0 } from "./native-palace-stems";

export type NativeTransformationType = "禄" | "权" | "科" | "忌";
export type NativeTransformationElement = "金" | "火" | "木" | "水";
export type NativeTransformationAction = "放大" | "阻断" | "持续" | "终止";

export type NativeTransformationRecord = {
  type: NativeTransformationType;
  star: string;
  targetBranch: string;
  targetPalace: string;
  strength: number;
  element: NativeTransformationElement;
  action: NativeTransformationAction;
};

export type NativeTransformationPalace = {
  branch: string;
  name: string;
  stem: string;
  produced0xf8: NativeTransformationRecord[];
  selfTransformations0x118: NativeTransformationRecord[];
  oppositeIncoming0x128: NativeTransformationRecord[];
  followLu0x140: string[];
  followJi0x158: string[];
};

const YEAR_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const TYPES = ["禄", "权", "科", "忌"] as const;
const ELEMENTS = ["金", "火", "木", "水"] as const;
const ACTIONS = ["放大", "阻断", "持续", "终止"] as const;

const STARS_BY_STEM: Readonly<Record<string, readonly [string, string, string, string]>> = {
  甲: ["廉贞", "破军", "武曲", "太阳"],
  乙: ["天机", "天梁", "紫微", "太阴"],
  丙: ["天同", "天机", "文昌", "廉贞"],
  丁: ["太阴", "天同", "天机", "巨门"],
  戊: ["贪狼", "太阴", "右弼", "天机"],
  己: ["武曲", "贪狼", "天梁", "文曲"],
  庚: ["太阳", "武曲", "太阴", "天同"],
  辛: ["巨门", "太阳", "文曲", "文昌"],
  壬: ["天梁", "紫微", "左辅", "武曲"],
  癸: ["破军", "巨门", "太阴", "贪狼"],
};

const STRENGTH_BY_TYPE: Readonly<Record<NativeTransformationType, readonly number[]>> = {
  禄: [50, 50, 40, 40, 50, 20, 10, 60, 80, 99, 90, 60],
  权: [10, 20, 80, 90, 90, 90, 99, 90, 30, 20, 50, 20],
  科: [80, 90, 90, 95, 80, 20, 10, 15, 10, 10, 30, 80],
  忌: [99, 95, 35, 20, 30, 30, 10, 30, 80, 90, 50, 80],
};

export function nativeTransformationRecords0x176530(input: {
  stem: string;
  starBranches: Readonly<Record<string, string>>;
  palaceNamesByBranch: Readonly<Record<string, string>>;
}): NativeTransformationRecord[] {
  const stars = STARS_BY_STEM[input.stem];
  if (stars === undefined) {
    throw new NativeTransformationsError(`stem is outside APK transformation table: ${input.stem}`);
  }

  return TYPES.map((type, index) => {
    const star = stars[index];
    const element = ELEMENTS[index];
    const action = ACTIONS[index];
    if (star === undefined || element === undefined || action === undefined) {
      throw new NativeTransformationsError(`incomplete APK transformation row for stem: ${input.stem}`);
    }
    const targetBranch = input.starBranches[star];
    if (targetBranch === undefined) {
      throw new NativeTransformationsError(`transformation target star is absent from chart: ${star}`);
    }
    const branchIndex = nativeBranchIndex(targetBranch);
    const targetPalace = input.palaceNamesByBranch[targetBranch];
    if (targetPalace === undefined) {
      throw new NativeTransformationsError(`transformation target palace is absent from chart: ${targetBranch}`);
    }
    const strength = STRENGTH_BY_TYPE[type][branchIndex];
    if (strength === undefined) {
      throw new NativeTransformationsError(`missing APK ${type} strength at branch index: ${branchIndex}`);
    }
    return { type, star, targetBranch, targetPalace, strength, element, action };
  });
}

export function nativeTransformations0x16b0a0(input: {
  lunarYearStem: string;
  palaces: ReadonlyArray<{ branch: string; name: string; stem: string }>;
  starBranches: Readonly<Record<string, string>>;
}) {
  validatePalaces(input.palaces);
  const palaceNamesByBranch = Object.fromEntries(input.palaces.map(({ branch, name }) => [branch, name]));
  const natal0x420 = nativeTransformationRecords0x176530({
    stem: input.lunarYearStem,
    starBranches: input.starBranches,
    palaceNamesByBranch,
  });
  const palaces: NativeTransformationPalace[] = input.palaces.map(({ branch, name, stem }) => ({
    branch,
    name,
    stem,
    produced0xf8: nativeTransformationRecords0x176530({ stem, starBranches: input.starBranches, palaceNamesByBranch }),
    selfTransformations0x118: [],
    oppositeIncoming0x128: [],
    followLu0x140: [],
    followJi0x158: [],
  }));
  const palacesByBranch = Object.fromEntries(palaces.map((palace) => [palace.branch, palace]));

  for (const source of palaces) {
    const oppositeBranch = branchAt(positiveModulo(nativeBranchIndex(source.branch) + 6, 12));
    for (const transformation of source.produced0xf8) {
      if (transformation.targetBranch === source.branch) {
        source.selfTransformations0x118.push(transformation);
      }
      if (transformation.targetBranch === oppositeBranch) {
        const target = palacesByBranch[oppositeBranch];
        if (target === undefined) {
          throw new NativeTransformationsError(`opposite palace is absent from chart: ${oppositeBranch}`);
        }
        target.oppositeIncoming0x128.push(transformation);
      }
    }
  }

  // The native chart stores palaces in std::map<string, ...>. Its second pass
  // walks that byte-lexicographic tree and builds reverse indexes on each
  // transformation target: source branches for 禄 at +0x140 and 忌 at +0x158.
  for (const source of [...palaces].sort(compareNativeStrings)) {
    for (const transformation of source.produced0xf8) {
      const target = palacesByBranch[transformation.targetBranch];
      if (target === undefined) {
        throw new NativeTransformationsError(`transformation target palace is absent from chart: ${transformation.targetBranch}`);
      }
      if (transformation.type === "禄") target.followLu0x140.push(source.branch);
      if (transformation.type === "忌") target.followJi0x158.push(source.branch);
    }
  }

  return { lunarYearStem: input.lunarYearStem, natal0x420, palaces };
}

export function nativeTransformationsEvidenceContract() {
  return {
    orchestratorRange: "0x16b0a0..0x16b985 plus out-of-line normal block 0x16b990..0x16bd3c",
    recordBuilder: "0x176530",
    recordLayout: {
      type: "+0x00",
      star: "+0x18",
      targetBranch: "+0x30",
      targetPalace: "+0x48",
      strength: "+0x60",
      stride: "0x68",
    },
    stemMapConstruction: "0x150700..0x1511b0 -> chart+0x68",
    natalDestination: "chart+0x420",
    palaceDestination: "node+0xf8",
    selfDestination: "node+0x118",
    oppositeIncomingDestination: "opposite node+0x128",
    followLuDestination: "target node+0x140 string vector",
    followJiDestination: "target node+0x158 string vector",
    followSource: "source node+0x20 branch string",
    followTraversal: "std::map<string, palace> byte-lexicographic order",
    strengthTables: {
      禄: "0x83e50",
      权: "0x83e80",
      科: "0x83eb0",
      忌: "0x83ee0",
      branchOrder: [...NATIVE_PALACE_BRANCHES_0X19F3D0],
    },
    elements: [...ELEMENTS],
    actions: [...ACTIONS],
    stems: [...YEAR_STEMS],
    starsByStem: Object.fromEntries(Object.entries(STARS_BY_STEM).map(([stem, stars]) => [stem, [...stars]])),
  };
}

function validatePalaces(palaces: ReadonlyArray<{ branch: string; name: string; stem: string }>): void {
  if (palaces.length !== 12) {
    throw new NativeTransformationsError(`chart must contain 12 palaces, got: ${palaces.length}`);
  }
  const branches = new Set<string>();
  for (const palace of palaces) {
    nativeBranchIndex(palace.branch);
    if (branches.has(palace.branch)) {
      throw new NativeTransformationsError(`duplicate palace branch: ${palace.branch}`);
    }
    branches.add(palace.branch);
    if (!(YEAR_STEMS as readonly string[]).includes(palace.stem)) {
      throw new NativeTransformationsError(`palace stem is outside APK table: ${palace.stem}`);
    }
  }
}

function nativeBranchIndex(branch: string): number {
  const index = (NATIVE_PALACE_BRANCHES_0X19F3D0 as readonly string[]).indexOf(branch);
  if (index < 0) throw new NativeTransformationsError(`branch is outside APK table: ${branch}`);
  return index;
}

function branchAt(index: number): string {
  const branch = NATIVE_PALACE_BRANCHES_0X19F3D0[index];
  if (branch === undefined) throw new NativeTransformationsError(`branch index is outside APK table: ${index}`);
  return branch;
}

function positiveModulo(value: number, modulus: number): number {
  const remainder = value % modulus;
  return remainder < 0 ? remainder + modulus : remainder;
}

function compareNativeStrings(left: { branch: string }, right: { branch: string }): number {
  return Buffer.compare(Buffer.from(left.branch, "utf8"), Buffer.from(right.branch, "utf8"));
}

export class NativeTransformationsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NativeTransformationsError";
  }
}
