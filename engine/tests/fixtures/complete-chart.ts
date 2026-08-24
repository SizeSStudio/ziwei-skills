import type { Palace, TransformationEdge, ZiweiChart } from "../../src/schema/chart";
import { APK_SHA256 } from "../../src/schema/evidence";
import { normalizeBirthInput } from "../../src/engine/normalize";
import { attachPalaceRelations } from "../../src/engine/chart-relations";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const PALACE_NAMES = ["田宅宫", "官禄宫", "交友宫", "迁移宫", "疾厄宫", "财帛宫", "子女宫", "夫妻宫", "兄弟宫", "命宫", "父母宫", "福德宫"];

export function completeChartFixture(): ZiweiChart {
  const input = normalizeBirthInput({
    datetime: "1998-02-20 09:40",
    place: "杭州",
    gender: "male",
  });
  const palaceCores = BRANCHES.map((branch, index): Omit<Palace, "relations"> => {
    const edge: TransformationEdge = {
      sourceBranch: branch,
      sourcePalace: PALACE_NAMES[index],
      star: "廉贞",
      type: "禄",
      strength: 50,
      element: "金",
      action: "放大",
      targetBranch: "丑",
      targetPalace: "官禄宫",
      evidenceIds: ["fixture.golden.sample"],
    };
    return {
      branch,
      name: PALACE_NAMES[index],
      stem: "甲",
      markers: markerFor(branch),
      stars: [
        { name: "紫微", brightness: "旺", brightnessCode: 6, element: "土" },
        { name: "文曲", brightness: "庙", brightnessCode: 7, element: "水" },
        { name: "喜神" },
        { name: "灾煞" },
      ],
      majorStars: [{ name: "紫微", brightness: "旺" }],
      assistantStars: [{ name: "文曲", brightness: "庙" }],
      maleficStars: [],
      minorStars: [{ name: "喜神" }, { name: "灾煞" }],
      transformationsProduced: [edge],
      selfTransformations: [],
      clashTransformations: [],
      followLu: [],
      followJi: [],
      decadeRange: { start: 33, end: 42 },
      annualAges: [9, 21, 33, 45, 57, 69],
      changsheng: "沐浴",
      doctor: "博士",
      generalFront: "将军",
      yearFront: "岁建",
    };
  });
  const palaces = attachPalaceRelations(palaceCores);
  return {
    meta: {
      source: "ziweixingyu-apk-native",
      calculationProfile: "ziweixingyu-native",
      engineVersion: "0.1.0",
      apkSha256: APK_SHA256,
      buildDate: "2026-07-09",
      parityStatus: "fixture",
      chartSlug: "user-1998-02-20-M",
    },
    input,
    calendar: {
      clockTime: "1998-02-20 09:40:00",
      appClockTime: "1998-02-20 10:30:30",
      trueSolarTime: "1998-02-20 09:26:43",
      lunarTime: "1998年正月廿四日巳时",
      fourPillars: "戊寅 甲寅 戊戌 丁巳",
      yearPillar: "戊寅",
      monthPillar: "甲寅",
      dayPillar: "戊戌",
      hourPillar: "丁巳",
      gender: "阳男",
      fiveElements: "火六局",
      longitude: "120.155",
      nearestSolarTerm: "fixture",
    },
    anchors: {
      laiyinPalace: "午宫",
      mingPalace: "酉宫",
      shenPalace: "未宫",
      mingMaster: "文曲",
      shenMaster: "天梁",
    },
    palaces,
    natalTransformations: palaces[0]?.transformationsProduced ?? [],
    transformationGraph: palaces.flatMap((palace) => palace.transformationsProduced),
    triLayerHexagram: {
      layer1_1: "午",
      layer1_2: "",
      layer2_1: "酉",
      layer2_2: "",
      layer3_1: "辰",
      layer3_2: "",
      evidenceIds: ["fixture.golden.sample"],
    },
    evidence: {
      "meta.source": [
        {
          id: "fixture.golden.sample",
          kind: "fixture",
          note: "Renderer fixture only; not an APP parity sample.",
        },
      ],
    },
  };
}

function markerFor(branch: string): string[] {
  if (branch === "午") {
    return ["来因宫"];
  }
  if (branch === "未") {
    return ["身宫"];
  }
  if (branch === "酉") {
    return ["命宫"];
  }
  return [];
}
