import type { EvidenceMap } from "./evidence";
import type { NormalizedBirthInput } from "../engine/normalize";

export type ChartMeta = {
  source: "ziweixingyu-apk-native" | "ziwei-doushu-community" | "hybrid-zizhan";
  calculationProfile: "ziweixingyu-native" | "ziwei-doushu-community" | "hybrid-zizhan";
  engineVersion: string;
  apkSha256: string;
  buildDate: string;
  parityStatus: "fixture" | "partial" | "golden-parity";
  chartSlug: string;
};

export type CalendarBlock = {
  clockTime: string;
  appClockTime: string;
  trueSolarTime: string;
  lunarTime: string;
  fourPillars: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  gender: string;
  fiveElements: string;
  longitude: string;
  nearestSolarTerm: string;
};

export type ChartAnchors = {
  laiyinPalace: string;
  mingPalace: string;
  shenPalace: string;
  mingMaster: string;
  shenMaster: string;
};

export type StarPlacement = {
  name: string;
  brightness?: string;
  brightnessCode?: number;
  element?: string;
};

export type TransformationType = "禄" | "权" | "科" | "忌";

export type TransformationEdge = {
  sourceBranch: string;
  sourcePalace: string;
  star: string;
  type: TransformationType;
  strength: number;
  element: "金" | "火" | "木" | "水";
  action: "放大" | "阻断" | "持续" | "终止";
  targetBranch: string;
  targetPalace: string;
  evidenceIds: string[];
};

export type AgeRange = {
  start: number;
  end: number;
};

export type PalaceRelations = {
  oppositeBranch: string;
  oppositePalace: string;
  trineBranches: [string, string];
  trinePalaces: [string, string];
  adjacentBranches: [string, string];
  adjacentPalaces: [string, string];
  hasMajorStars: boolean;
  oppositeMajorStars: string[];
  evidenceIds: string[];
};

export type Palace = {
  branch: string;
  name: string;
  stem: string;
  markers: string[];
  stars: StarPlacement[];
  majorStars: StarPlacement[];
  assistantStars: StarPlacement[];
  maleficStars: StarPlacement[];
  minorStars: StarPlacement[];
  transformationsProduced: TransformationEdge[];
  selfTransformations: TransformationEdge[];
  clashTransformations: TransformationEdge[];
  followLu: string[];
  followJi: string[];
  decadeRange: AgeRange;
  annualAges: number[];
  changsheng: string;
  doctor?: string;
  generalFront?: string;
  yearFront?: string;
  relations: PalaceRelations;
};

export type TriLayerHexagramBlock = {
  layer1_1: string;
  layer1_2: string;
  layer2_1: string;
  layer2_2: string;
  layer3_1: string;
  layer3_2: string;
  evidenceIds: string[];
};

export type ZiweiChart = {
  meta: ChartMeta;
  input: NormalizedBirthInput;
  calendar: CalendarBlock;
  anchors: ChartAnchors;
  palaces: Palace[];
  natalTransformations: TransformationEdge[];
  transformationGraph: TransformationEdge[];
  triLayerHexagram: TriLayerHexagramBlock;
  evidence: EvidenceMap;
};

export class ChartValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChartValidationError";
  }
}

export function validateCompleteChart(chart: ZiweiChart): void {
  assertObject(chart, "chart");
  assertObject(chart.meta, "chart.meta");
  assertNonEmpty(chart.meta.source, "chart.meta.source");
  assertCalculationProfile(chart.meta.calculationProfile, "chart.meta.calculationProfile");
  assertNonEmpty(chart.meta.engineVersion, "chart.meta.engineVersion");
  assertNonEmpty(chart.meta.apkSha256, "chart.meta.apkSha256");
  assertNonEmpty(chart.meta.chartSlug, "chart.meta.chartSlug");
  assertObject(chart.input, "chart.input");
  assertObject(chart.calendar, "chart.calendar");
  assertNonEmpty(chart.calendar.clockTime, "chart.calendar.clockTime");
  assertNonEmpty(chart.calendar.appClockTime, "chart.calendar.appClockTime");
  assertNonEmpty(chart.calendar.trueSolarTime, "chart.calendar.trueSolarTime");
  assertNonEmpty(chart.calendar.lunarTime, "chart.calendar.lunarTime");
  assertNonEmpty(chart.calendar.fourPillars, "chart.calendar.fourPillars");
  assertNonEmpty(chart.calendar.gender, "chart.calendar.gender");
  assertNonEmpty(chart.calendar.fiveElements, "chart.calendar.fiveElements");
  assertNonEmpty(chart.calendar.longitude, "chart.calendar.longitude");
  assertObject(chart.anchors, "chart.anchors");
  assertNonEmpty(chart.anchors.laiyinPalace, "chart.anchors.laiyinPalace");
  assertNonEmpty(chart.anchors.mingPalace, "chart.anchors.mingPalace");
  assertNonEmpty(chart.anchors.shenPalace, "chart.anchors.shenPalace");
  assertNonEmpty(chart.anchors.mingMaster, "chart.anchors.mingMaster");
  assertNonEmpty(chart.anchors.shenMaster, "chart.anchors.shenMaster");
  assertObject(chart.evidence, "chart.evidence");

  if (!Array.isArray(chart.palaces)) {
    throw new ChartValidationError("chart.palaces must be a list");
  }
  if (chart.palaces.length !== 12) {
    throw new ChartValidationError(`chart.palaces must contain 12 palaces, got ${chart.palaces.length}`);
  }
  chart.palaces.forEach(validatePalace);
  assertArray(chart.natalTransformations, "chart.natalTransformations");
  assertArray(chart.transformationGraph, "chart.transformationGraph");
  assertObject(chart.triLayerHexagram, "chart.triLayerHexagram");
}

function validatePalace(palace: Palace, index: number): void {
  assertObject(palace, `chart.palaces[${index}]`);
  assertNonEmpty(palace.branch, `chart.palaces[${index}].branch`);
  assertNonEmpty(palace.name, `chart.palaces[${index}].name`);
  assertNonEmpty(palace.stem, `chart.palaces[${index}].stem`);
  assertArray(palace.markers, `chart.palaces[${index}].markers`);
  assertArray(palace.stars, `chart.palaces[${index}].stars`);
  assertArray(palace.majorStars, `chart.palaces[${index}].majorStars`);
  assertArray(palace.assistantStars, `chart.palaces[${index}].assistantStars`);
  assertArray(palace.maleficStars, `chart.palaces[${index}].maleficStars`);
  assertArray(palace.minorStars, `chart.palaces[${index}].minorStars`);
  assertArray(palace.transformationsProduced, `chart.palaces[${index}].transformationsProduced`);
  assertArray(palace.selfTransformations, `chart.palaces[${index}].selfTransformations`);
  assertArray(palace.clashTransformations, `chart.palaces[${index}].clashTransformations`);
  assertArray(palace.followLu, `chart.palaces[${index}].followLu`);
  assertArray(palace.followJi, `chart.palaces[${index}].followJi`);
  assertObject(palace.decadeRange, `chart.palaces[${index}].decadeRange`);
  assertNumber(palace.decadeRange.start, `chart.palaces[${index}].decadeRange.start`);
  assertNumber(palace.decadeRange.end, `chart.palaces[${index}].decadeRange.end`);
  assertArray(palace.annualAges, `chart.palaces[${index}].annualAges`);
  assertNonEmpty(palace.changsheng, `chart.palaces[${index}].changsheng`);
  assertObject(palace.relations, `chart.palaces[${index}].relations`);
  assertNonEmpty(palace.relations.oppositeBranch, `chart.palaces[${index}].relations.oppositeBranch`);
  assertNonEmpty(palace.relations.oppositePalace, `chart.palaces[${index}].relations.oppositePalace`);
  assertPair(palace.relations.trineBranches, `chart.palaces[${index}].relations.trineBranches`);
  assertPair(palace.relations.trinePalaces, `chart.palaces[${index}].relations.trinePalaces`);
  assertPair(palace.relations.adjacentBranches, `chart.palaces[${index}].relations.adjacentBranches`);
  assertPair(palace.relations.adjacentPalaces, `chart.palaces[${index}].relations.adjacentPalaces`);
  assertBoolean(palace.relations.hasMajorStars, `chart.palaces[${index}].relations.hasMajorStars`);
  assertArray(palace.relations.oppositeMajorStars, `chart.palaces[${index}].relations.oppositeMajorStars`);
  assertArray(palace.relations.evidenceIds, `chart.palaces[${index}].relations.evidenceIds`);
}

function assertObject(value: unknown, path: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ChartValidationError(`${path} must be an object`);
  }
}

function assertArray(value: unknown, path: string): void {
  if (!Array.isArray(value)) {
    throw new ChartValidationError(`${path} must be a list`);
  }
}

function assertNonEmpty(value: unknown, path: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new ChartValidationError(`${path} is required`);
  }
}

function assertNumber(value: unknown, path: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ChartValidationError(`${path} must be a number`);
  }
}

function assertCalculationProfile(value: unknown, path: string): void {
  if (value !== "ziweixingyu-native" && value !== "ziwei-doushu-community" && value !== "hybrid-zizhan") {
    throw new ChartValidationError(`${path} is unsupported`);
  }
}

function assertBoolean(value: unknown, path: string): void {
  if (typeof value !== "boolean") {
    throw new ChartValidationError(`${path} must be a boolean`);
  }
}

function assertPair(value: unknown, path: string): void {
  if (!Array.isArray(value)) {
    throw new ChartValidationError(`${path} must be a list`);
  }
  if (value.length !== 2 || value.some((item) => typeof item !== "string" || item.length === 0)) {
    throw new ChartValidationError(`${path} must contain two non-empty strings`);
  }
}
