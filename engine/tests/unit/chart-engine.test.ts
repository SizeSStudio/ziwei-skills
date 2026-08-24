import test from "node:test";
import assert from "node:assert/strict";
import { assembleNativeChartCandidate, buildChartFromNativeLogic } from "../../src/engine/chart-engine";
import { normalizeBirthInput } from "../../src/engine/normalize";
import { validateCompleteChart } from "../../src/schema/chart";

function fixtureInput() {
  return normalizeBirthInput({ datetime: "1998-02-20 09:40", place: "杭州", gender: "male" });
}

test("builds the APP-golden native chart for the 1998 Hangzhou fixture", () => {
  const chart = buildChartFromNativeLogic(fixtureInput());
  validateCompleteChart(chart);

  assert.equal(chart.meta.parityStatus, "golden-parity");
  assert.equal(chart.meta.calculationProfile, "ziweixingyu-native");
  assert.deepEqual(chart.calendar, {
    clockTime: "1998-02-20 09:40:00",
    appClockTime: "1998-02-20 10:30:30",
    trueSolarTime: "1998-02-20 10:43:39",
    lunarTime: "1998年正月廿四日巳时",
    fourPillars: "戊寅 甲寅 戊戌 丁巳",
    yearPillar: "戊寅",
    monthPillar: "甲寅",
    dayPillar: "戊戌",
    hourPillar: "丁巳",
    gender: "阳男",
    fiveElements: "木三局",
    longitude: "120.155",
    nearestSolarTerm: "4",
  });
  assert.deepEqual(chart.anchors, {
    laiyinPalace: "午宫",
    mingPalace: "酉宫",
    shenPalace: "未宫",
    mingMaster: "文曲",
    shenMaster: "天梁",
  });
  assert.equal(chart.palaces.length, 12);
  const youPalace = chart.palaces.find(({ branch }) => branch === "酉");
  const opposite = chart.palaces.find(({ branch }) => branch === youPalace?.relations.oppositeBranch);
  assert.deepEqual(youPalace?.relations.trineBranches, ["丑", "巳"]);
  assert.deepEqual(youPalace?.relations.adjacentBranches, ["申", "戌"]);
  assert.equal(youPalace?.relations.oppositeBranch, "卯");
  assert.deepEqual(youPalace?.relations.oppositeMajorStars, opposite?.majorStars.map(({ name }) => name));
  assert.deepEqual(youPalace?.relations.evidenceIds, ["derived.palace-topology.v1"]);
  assert.equal(chart.evidence["derived.palaceRelations"]?.[0]?.kind, "derived");
  for (const palace of chart.palaces) {
    const relatedOpposite = chart.palaces.find(({ branch }) => branch === palace.relations.oppositeBranch);
    assert.equal(relatedOpposite?.relations.oppositeBranch, palace.branch, `${palace.branch}.opposite involution`);
    assert.equal(palace.relations.hasMajorStars, palace.majorStars.length > 0, `${palace.branch}.hasMajorStars`);
    assert.deepEqual(
      palace.relations.oppositeMajorStars,
      relatedOpposite?.majorStars.map(({ name }) => name),
      `${palace.branch}.oppositeMajorStars`,
    );
    assert.equal(new Set([
      palace.branch,
      palace.relations.oppositeBranch,
      ...palace.relations.trineBranches,
      ...palace.relations.adjacentBranches,
    ]).size, 6, `${palace.branch}.relation geometry`);
  }
  assert.equal(chart.palaces.flatMap(({ stars }) => stars).length, 70);
  assert.deepEqual(
    chart.natalTransformations.map(({ star, type, targetBranch, targetPalace, strength }) => ({ star, type, targetBranch, targetPalace, strength })),
    [
      { star: "贪狼", type: "禄", targetBranch: "酉", targetPalace: "命宫", strength: 99 },
      { star: "太阴", type: "权", targetBranch: "申", targetPalace: "兄弟", strength: 30 },
      { star: "右弼", type: "科", targetBranch: "戌", targetPalace: "父母", strength: 30 },
      { star: "天机", type: "忌", targetBranch: "申", targetPalace: "兄弟", strength: 80 },
    ],
  );
  assert.deepEqual(chart.palaces.find(({ branch }) => branch === "酉")?.majorStars, [
    { name: "紫微", brightness: "旺", brightnessCode: 6, element: "土" },
    { name: "贪狼", brightness: "不", brightnessCode: 2, element: "木" },
  ]);
  assert.deepEqual(chart.palaces.find(({ branch }) => branch === "子")?.followLu, ["戌"]);
  assert.deepEqual(chart.palaces.find(({ branch }) => branch === "子")?.followJi, []);
  assert.deepEqual(chart.triLayerHexagram, {
    layer1_1: "午",
    layer1_2: "",
    layer2_1: "卯",
    layer2_2: "丑",
    layer3_1: "子",
    layer3_2: "寅",
    evidenceIds: ["chart.native-orchestrator-0x155370"],
  });
});

test("keeps candidate and public build outputs identical after golden verification", () => {
  assert.deepEqual(buildChartFromNativeLogic(fixtureInput()), assembleNativeChartCandidate(fixtureInput()));
});

test("does not attach the single APP golden claim to a different input", () => {
  const chart = buildChartFromNativeLogic(
    normalizeBirthInput({ datetime: "1998-02-20 09:40", place: "杭州", gender: "female" }),
  );

  assert.equal(chart.meta.parityStatus, "partial");
  assert.equal(chart.calendar.gender, "阳女");
  assert.ok(!chart.evidence["meta.source"]?.some(({ kind }) => kind === "golden-sample"));
});
