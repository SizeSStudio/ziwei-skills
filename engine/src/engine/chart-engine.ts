import type {
  Palace,
  StarPlacement,
  TransformationEdge,
  ZiweiChart,
} from "../schema/chart";
import { APK_SHA256, type EvidenceRef } from "../schema/evidence";
import type { NormalizedBirthInput } from "./normalize";
import { nativeCalendarInvocationFromNormalizedInput } from "./native-calendar";
import { nativeCalendarNamed0x11b600 } from "./native-calendar-named";
import { nativeCalendarWrapper0x124b80 } from "./native-calendar-wrapper";
import { nativeContextInitialRecords } from "./native-context-assets";
import { nativeCalendarContextState0x17f450 } from "./native-context-state";
import { nativeFiveElementsBureau0x1586a0 } from "./native-five-elements-bureau";
import { nativeHourStars0x15f7f0 } from "./native-hour-stars";
import { nativeLifeBodyLords } from "./native-life-body-lords";
import { nativeMajorLimits0x159170 } from "./native-major-limits";
import { nativeMajorStarAnchors } from "./native-major-star-anchors";
import { nativeMajorStars } from "./native-major-stars";
import { nativeMinorLimits0x1597d0 } from "./native-minor-limits";
import { nativeMonthDayStars0x15f510 } from "./native-month-day-stars";
import { nativeMonthStars0x15caa0 } from "./native-month-stars";
import { nativePalaceAnchors0x155370 } from "./native-palace-anchors";
import { nativePalaceNames0x157500 } from "./native-palace-names";
import { nativePalaceStems0x156fb0 } from "./native-palace-stems";
import { nativeRemainingStars0x164d10 } from "./native-remaining-stars";
import { nativeStarBrightness0x16bf60 } from "./native-star-brightness";
import { nativeThreeLayerGua0x16c4c0 } from "./native-three-layer-gua";
import {
  type NativeTransformationRecord,
  nativeTransformations0x16b0a0,
} from "./native-transformations";
import { nativeYearBranchStars0x1601b0 } from "./native-year-branch-stars";
import { nativeYearStemStars0x1628d0 } from "./native-year-stem-stars";
import { attachPalaceRelations, PALACE_RELATIONS_EVIDENCE_ID } from "./chart-relations";

const ENGINE_VERSION = "1.3.0-random-event-clock";
const EXTENDED_STARS_FLAG_0X450 = false;
const APP_GOLDEN_MODE2_BODY = "2|1998|2|20|10|30|30|120.155|-8|1|0|0|0";

const MAJOR_STARS = new Set([
  "紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军",
]);
const ASSISTANT_STARS = new Set(["左辅", "右弼", "文昌", "文曲", "天魁", "天钺"]);
const MALEFIC_STARS = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);

const CHART_ASSEMBLY_EVIDENCE: EvidenceRef = {
  id: "chart.native-orchestrator-0x155370",
  kind: "apk-native",
  address: "0x155370..0x16ccf2",
  note: "Static TypeScript assembly follows the APK palace, star, transformation, brightness, and three-layer function order.",
};
const SERIALIZER_EVIDENCE: EvidenceRef = {
  id: "chart.native-json-serializer-0x16d020",
  kind: "apk-native",
  address: "0x16d020..0x172a0b",
  note: "Native top-level and palace JSON keys, including 四化/自化/冲化/追禄/追忌, were recovered statically.",
};
const APP_GOLDEN_EVIDENCE: EvidenceRef = {
  id: "verification.app-golden-mode2-1998-hangzhou",
  kind: "golden-sample",
  source: "tests/fixtures/app-1998-02-20-103030-male-hangzhou.raw.json",
  note: "ARM64 APK get2 mode-2 output passes field-by-field parity for metadata, palaces, stars, brightness, limits, transformations, follow chains, and three-layer gua.",
};
const PALACE_RELATIONS_EVIDENCE: EvidenceRef = {
  id: PALACE_RELATIONS_EVIDENCE_ID,
  kind: "derived",
  note: "Deterministic branch geometry and star-presence summaries derived from the twelve APK-native palace nodes; not an additional school-specific chart rule.",
};
const RANDOM_EVENT_CLOCK_EVIDENCE: EvidenceRef = {
  id: "random-event.actual-clock-derived",
  kind: "derived",
  note: "Random-event charts feed the supplied second-level civil clock through the native true-solar-time chain, then use the resulting true-solar hour and minute for the three-layer gua. Natal mode-2 retains the APP fixed 30:30 protocol.",
};

export function buildChartFromNativeLogic(input: NormalizedBirthInput): ZiweiChart {
  return assembleNativeChartCandidate(input);
}

export function assembleNativeChartCandidate(input: NormalizedBirthInput): ZiweiChart {
  const appGoldenVerified = isAppGoldenFixture(input);
  const appGoldenEvidence = appGoldenVerified ? [APP_GOLDEN_EVIDENCE] : [];
  const invocation = nativeCalendarInvocationFromNormalizedInput(input);
  const context = nativeCalendarContextState0x17f450();
  // Force both constructor vectors through their hash checks before chart work.
  nativeContextInitialRecords(0);
  nativeContextInitialRecords(1);
  const calendarDateTime = input.inputProfile === "random-event"
    ? {
        year: input.year,
        month: input.month,
        day: input.day,
        hour: input.clockHour,
        minute: input.clockMinute,
        second: input.clockSecond,
      }
    : invocation.dateTime;
  const calendarCore = nativeCalendarWrapper0x124b80({
    context,
    dateTime: calendarDateTime,
    longitudeDegrees: invocation.longitudeDegrees,
    timezoneHours: invocation.timezoneField,
  });
  const calendar = nativeCalendarNamed0x11b600(calendarCore);
  const anchors = nativePalaceAnchors0x155370(calendar, input.gender);
  const palaceNames = nativePalaceNames0x157500(anchors.mingPalaceIndex0x98);
  const palaceStems = nativePalaceStems0x156fb0(anchors.lunarYearStem);
  const palaceSeeds = palaceStems.map(({ branch, stem }) => ({
    branch,
    stem,
    name: requiredByBranch(palaceNames, branch, "palace name").name,
  }));
  const mingPalace = requiredByBranch(palaceSeeds, anchors.mingPalaceBranch0x98, "ming palace");
  const bureau = nativeFiveElementsBureau0x1586a0(mingPalace.stem, mingPalace.branch);
  const majorLimits = nativeMajorLimits0x159170({
    genderLabel: anchors.genderLabel0x128,
    bureauNumber: bureau.bureauNumber,
    mingPalaceBranchIndex: anchors.mingPalaceIndex0x98,
  });
  const minorLimits = nativeMinorLimits0x1597d0(
    calendar.cyclicPair0x110_0x128FromCalendar0xa8_0xac.branch,
    input.gender,
  );
  const lords = nativeLifeBodyLords({
    mingPalaceBranch: anchors.mingPalaceBranch0x98,
    lunarYearBranch: calendar.cyclicPair0x110_0x128FromCalendar0xa8_0xac.branch,
  });
  const majorAnchors = nativeMajorStarAnchors({
    lunarDayNumber: calendar.lunar0x1d8_0x214.dayNumber0x210,
    bureauNumber: bureau.bureauNumber,
  });
  const majorStars = nativeMajorStars({
    ziweiAnchorBranchIndex: majorAnchors.ziweiBranchIndex,
    tianfuAnchorBranchIndex: majorAnchors.tianfuBranchIndex,
  });
  const monthStars = nativeMonthStars0x15caa0({
    normalizedLunarMonth: anchors.normalizedLunarMonth,
    extendedStarsFlag0x450: EXTENDED_STARS_FLAG_0X450,
  });
  const monthDayStars = nativeMonthDayStars0x15f510({
    normalizedLunarMonth: anchors.normalizedLunarMonth,
    lunarDayNumber: calendar.lunar0x1d8_0x214.dayNumber0x210,
  });
  const hourStars = nativeHourStars0x15f7f0(anchors.hourBranch);
  const lunarYearBranch = calendar.cyclicPair0x110_0x128FromCalendar0xa8_0xac.branch;
  const yearBranchStars = nativeYearBranchStars0x1601b0({
    lunarYearBranch,
    extendedStarsFlag0x450: EXTENDED_STARS_FLAG_0X450,
  });
  const yearStemStars = nativeYearStemStars0x1628d0({
    lunarYearStem: anchors.lunarYearStem,
    extendedStarsFlag0x450: EXTENDED_STARS_FLAG_0X450,
  });
  const remaining = nativeRemainingStars0x164d10({
    lunarYearStem: anchors.lunarYearStem,
    lunarYearBranch,
    normalizedLunarMonth: anchors.normalizedLunarMonth,
    lunarDayNumber: calendar.lunar0x1d8_0x214.dayNumber0x210,
    hourBranch: anchors.hourBranch,
    mingPalaceBranch: anchors.mingPalaceBranch0x98,
    shenPalaceBranch: anchors.shenPalaceBranch0xb0,
    bureauNumber: bureau.bureauNumber,
    genderPolarityLabel0x128: anchors.genderLabel0x128,
    extendedStarsFlag0x450: EXTENDED_STARS_FLAG_0X450,
  });

  const nativePlacements = [
    ...majorStars.placements,
    ...monthStars.placements,
    ...monthDayStars.placements,
    ...hourStars.placements,
    ...yearBranchStars.placements,
    ...yearStemStars.placements,
    ...remaining.placements,
  ].map(({ star, branch }) => ({ star, branch }));
  const brightness = nativeStarBrightness0x16bf60(nativePlacements);
  const starBranches = Object.fromEntries(nativePlacements.map(({ star, branch }) => [star, branch]));
  const transformations = nativeTransformations0x16b0a0({
    lunarYearStem: anchors.lunarYearStem,
    palaces: palaceSeeds,
    starBranches,
  });
  const guaDateTime = input.inputProfile === "random-event"
    ? calendarCore.workingDateTime0x00
    : invocation.dateTime;
  const gua = nativeThreeLayerGua0x16c4c0({
    lunarYearStem: anchors.lunarYearStem,
    palaceStems,
    hourCode: Math.trunc(guaDateTime.hour),
    minuteField: Math.trunc(guaDateTime.minute),
    direction: majorLimits.direction0xc8,
  });
  const randomEventEvidence = input.inputProfile === "random-event"
    ? [RANDOM_EVENT_CLOCK_EVIDENCE]
    : [];
  const laiyinBranch = gua.layer1_1_0x390;
  const transformationEvidenceIds = [CHART_ASSEMBLY_EVIDENCE.id, SERIALIZER_EVIDENCE.id];
  const palaceCores: Omit<Palace, "relations">[] = palaceSeeds.map(({ branch, name, stem }) => {
    const nativeTransformationPalace = requiredByBranch(transformations.palaces, branch, "transformation palace");
    const limit = requiredByBranch(majorLimits.limits, branch, "major limit");
    const minorLimit = requiredByBranch(minorLimits.palaces, branch, "minor limit");
    const cycles = requiredByBranch(remaining.palaceCycleFields, branch, "palace cycles");
    const stars = brightness
      .filter((placement) => placement.branch === branch)
      .map(toStarPlacement);
    const source = { branch, palace: name };
    return {
      branch,
      name,
      stem,
      markers: palaceMarkers(branch, laiyinBranch, anchors.mingPalaceBranch0x98, anchors.shenPalaceBranch0xb0),
      stars,
      majorStars: stars.filter((star) => MAJOR_STARS.has(star.name)),
      assistantStars: stars.filter((star) => ASSISTANT_STARS.has(star.name)),
      maleficStars: stars.filter((star) => MALEFIC_STARS.has(star.name)),
      minorStars: stars.filter((star) => !MAJOR_STARS.has(star.name) && !ASSISTANT_STARS.has(star.name) && !MALEFIC_STARS.has(star.name)),
      transformationsProduced: nativeTransformationPalace.produced0xf8.map((record) => toTransformationEdge(source, record, transformationEvidenceIds)),
      selfTransformations: nativeTransformationPalace.selfTransformations0x118.map((record) => toTransformationEdge(source, record, transformationEvidenceIds)),
      clashTransformations: nativeTransformationPalace.oppositeIncoming0x128.map((record) => toTransformationEdge(source, record, transformationEvidenceIds)),
      followLu: [...nativeTransformationPalace.followLu0x140],
      followJi: [...nativeTransformationPalace.followJi0x158],
      decadeRange: { start: limit.startAge, end: limit.endAge },
      annualAges: [...minorLimit.ages],
      changsheng: cycles.longsheng0x68,
      doctor: cycles.doctor0x80,
      generalFront: cycles.general0x98,
      yearFront: cycles.annual0xb0,
    };
  });
  const palaces = attachPalaceRelations(palaceCores);
  const laiyinPalace = requiredByBranch(palaceSeeds, laiyinBranch, "laiyin palace");
  const natalTransformations = transformations.natal0x420.map((record) =>
    toTransformationEdge({ branch: laiyinBranch, palace: laiyinPalace.name }, record, transformationEvidenceIds),
  );
  const yearPillar = calendar.cyclicPair0x110_0x128FromCalendar0xa8_0xac.text;
  const monthPillar = calendar.cyclicPair0x140_0x158FromCalendar0xb0_0xb4.text;
  const dayPillar = calendar.cyclicPair0x178_0x190FromCalendar0xb8_0xbc.text;
  const hourPillar = calendar.cyclicPair0x1a8_0x1c0FromCalendar0xc0_0xc4.text;

  return {
    meta: {
      source: "ziweixingyu-apk-native",
      calculationProfile: "ziweixingyu-native",
      engineVersion: ENGINE_VERSION,
      apkSha256: APK_SHA256,
      buildDate: "2026-07-30",
      parityStatus: appGoldenVerified ? "golden-parity" : "partial",
      chartSlug: `${input.year}-${pad2(input.month)}-${pad2(input.day)}-${input.gender === "male" ? "M" : "F"}`,
    },
    input,
    calendar: {
      clockTime: formatInputClock(input),
      appClockTime: calendar.formattedInputDate0xb8,
      trueSolarTime: calendar.formattedWorkingDate0xa0,
      lunarTime: `${calendar.lunar0x1d8_0x214.text}日${anchors.hourBranch}时`,
      fourPillars: [yearPillar, monthPillar, dayPillar, hourPillar].join(" "),
      yearPillar,
      monthPillar,
      dayPillar,
      hourPillar,
      gender: anchors.genderLabel0x128,
      fiveElements: bureau.bureauName0x110,
      longitude: input.longitude,
      // The APP serializes only this numeric label. The recovered boundary date
      // remains internal until additional native boundary fixtures verify it.
      nearestSolarTerm: String(calendar.boundary0x218_0x230.label),
    },
    anchors: {
      laiyinPalace: `${laiyinBranch}宫`,
      mingPalace: `${anchors.mingPalaceBranch0x98}宫`,
      shenPalace: `${anchors.shenPalaceBranch0xb0}宫`,
      mingMaster: lords.lifeLord0xe0,
      shenMaster: lords.bodyLord0xf8,
    },
    palaces,
    natalTransformations,
    transformationGraph: palaces.flatMap((palace) => palace.transformationsProduced),
    triLayerHexagram: {
      layer1_1: gua.layer1_1_0x390,
      layer1_2: gua.layer1_2_0x3a8,
      layer2_1: gua.layer2_1_0x3c0,
      layer2_2: gua.layer2_2_0x3d8,
      layer3_1: gua.layer3_1_0x3f0,
      layer3_2: gua.layer3_2_0x408,
      evidenceIds: [CHART_ASSEMBLY_EVIDENCE.id, ...randomEventEvidence.map(({ id }) => id)],
    },
    evidence: {
      "meta.source": [CHART_ASSEMBLY_EVIDENCE, SERIALIZER_EVIDENCE, ...appGoldenEvidence],
      calendar: [
        invocation.evidence.calendarCore,
        invocation.evidence.nativeWrapper,
        ...randomEventEvidence,
        ...appGoldenEvidence,
      ],
      palaces: [CHART_ASSEMBLY_EVIDENCE, SERIALIZER_EVIDENCE, ...appGoldenEvidence],
      "derived.palaceRelations": [PALACE_RELATIONS_EVIDENCE],
      transformations: [CHART_ASSEMBLY_EVIDENCE, SERIALIZER_EVIDENCE, ...appGoldenEvidence],
      triLayerHexagram: [CHART_ASSEMBLY_EVIDENCE, ...randomEventEvidence, ...appGoldenEvidence],
    },
  };
}

function isAppGoldenFixture(input: NormalizedBirthInput): boolean {
  return input.appMode2Body === APP_GOLDEN_MODE2_BODY
    && input.clockHour === 9
    && input.clockMinute === 40
    && input.clockSecond === 0;
}

function toStarPlacement(placement: {
  star: string;
  brightness?: string;
  brightnessCode?: number;
  element?: string;
}): StarPlacement {
  return {
    name: placement.star,
    ...(placement.brightness === undefined ? {} : { brightness: placement.brightness }),
    ...(placement.brightnessCode === undefined ? {} : { brightnessCode: placement.brightnessCode }),
    ...(placement.element === undefined ? {} : { element: placement.element }),
  };
}

function toTransformationEdge(
  source: { branch: string; palace: string },
  record: NativeTransformationRecord,
  evidenceIds: string[],
): TransformationEdge {
  return {
    sourceBranch: source.branch,
    sourcePalace: source.palace,
    star: record.star,
    type: record.type,
    strength: record.strength,
    element: record.element,
    action: record.action,
    targetBranch: record.targetBranch,
    targetPalace: record.targetPalace,
    evidenceIds,
  };
}

function palaceMarkers(branch: string, laiyin: string, ming: string, shen: string): string[] {
  const markers: string[] = [];
  if (branch === laiyin) markers.push("来因宫");
  if (branch === ming) markers.push("命宫");
  if (branch === shen) markers.push("身宫");
  return markers;
}

function requiredByBranch<T extends { branch: string }>(values: readonly T[], branch: string, label: string): T {
  const value = values.find((candidate) => candidate.branch === branch);
  if (value === undefined) throw new Error(`${label} is absent for branch: ${branch}`);
  return value;
}

function formatInputClock(input: NormalizedBirthInput): string {
  return `${input.year}-${pad2(input.month)}-${pad2(input.day)} ${pad2(input.clockHour)}:${pad2(input.clockMinute)}:${pad2(input.clockSecond)}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
