import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { assembleNativeChartCandidate } from "../../src/engine/chart-engine";
import { normalizeBirthInput } from "../../src/engine/normalize";
import type { Palace, TransformationEdge } from "../../src/schema/chart";

type JsonObject = Record<string, any>;

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/app-1998-02-20-103030-male-hangzhou.raw.json",
);

test("matches the captured APP mode-2 JSON field by field", () => {
  const app = JSON.parse(readFileSync(fixturePath, "utf8")) as JsonObject;
  const chart = assembleNativeChartCandidate(
    normalizeBirthInput({ datetime: "1998-02-20 09:40", place: "杭州", gender: "male" }),
  );
  const differences: string[] = [];
  const check = (path: string, actual: unknown, expected: unknown) => {
    try {
      assert.deepEqual(actual, expected);
    } catch {
      differences.push(`${path}: candidate=${JSON.stringify(actual)} app=${JSON.stringify(expected)}`);
    }
  };

  const other = app["其他信息"];
  check("其他信息.性别", chart.calendar.gender, other["性别"]);
  check("其他信息.五行局", chart.calendar.fiveElements, other["五行局"]);
  check("其他信息.命主", chart.anchors.mingMaster, other["命主"]);
  check("其他信息.身主", chart.anchors.shenMaster, other["身主"]);
  check("其他信息.身宫", branchOf(chart.anchors.shenPalace), other["身宫"]);
  check("其他信息.命宫", branchOf(chart.anchors.mingPalace), other["命宫"]);
  check("其他信息.经度", Number(chart.calendar.longitude), Number(other["经度"]));
  check("其他信息.真太阳时", chart.calendar.appClockTime, other["真太阳时"]);
  check("其他信息.钟表时间", chart.calendar.trueSolarTime, other["钟表时间"]);
  check("其他信息.年柱", chart.calendar.yearPillar, `${other["年干"]}${other["年支"]}`);
  check("其他信息.月柱", chart.calendar.monthPillar, `${other["月干"]}${other["月支"]}`);
  check("其他信息.日柱", chart.calendar.dayPillar, `${other["日干"]}${other["日支"]}`);
  check("其他信息.时柱", chart.calendar.hourPillar, `${other["时干"]}${other["时支"]}`);
  check("其他信息.最近节气", solarTermLabel(chart.calendar.nearestSolarTerm), other["最近节气"]);
  check("其他信息.层1.1", chart.triLayerHexagram.layer1_1, other["层1.1"]);
  check("其他信息.层1.2", chart.triLayerHexagram.layer1_2, other["层1.2"]);
  check("其他信息.层2.1", chart.triLayerHexagram.layer2_1, other["层2.1"]);
  check("其他信息.层2.2", chart.triLayerHexagram.layer2_2, other["层2.2"]);
  check("其他信息.层3.1", chart.triLayerHexagram.layer3_1, other["层3.1"]);
  check("其他信息.层3.2", chart.triLayerHexagram.layer3_2, other["层3.2"]);

  const appPalaces = app["十二宫信息"] as JsonObject;
  for (const palace of chart.palaces) {
    const expected = appPalaces[palace.branch];
    check(`${palace.branch}.宫`, palace.name, expected["宫"]);
    check(`${palace.branch}.宫干`, palace.stem, expected["宫干"]);
    check(`${palace.branch}.长生`, palace.changsheng, expected["长生"]);
    check(`${palace.branch}.生年博士`, palace.doctor, expected["生年博士"]);
    check(`${palace.branch}.生年将前`, palace.generalFront, expected["生年将前"]);
    check(`${palace.branch}.生年岁前`, palace.yearFront, expected["生年岁前"]);
    check(`${palace.branch}.大限`, `${palace.decadeRange.start}~${palace.decadeRange.end}`, expected["大限"]);
    check(`${palace.branch}.小限`, palace.annualAges.join(","), expected["小限"]);
    check(
      `${palace.branch}.星列表`,
      palace.stars.map((star) => star.name).sort(),
      Object.keys(expected["星列表"]).sort(),
    );
    check(`${palace.branch}.星庙旺`, brightnessMap(palace), expected["星庙旺"]);
    check(`${palace.branch}.四化`, transformationMap(palace.transformationsProduced), objectOrEmpty(expected["四化"]));
    check(`${palace.branch}.自化`, transformationMap(palace.selfTransformations), objectOrEmpty(expected["自化"]));
    check(`${palace.branch}.冲化`, transformationMap(palace.clashTransformations), objectOrEmpty(expected["冲化"]));
    check(`${palace.branch}.追禄`, palace.followLu.join(""), expected["追禄"]);
    check(`${palace.branch}.追忌`, palace.followJi.join(""), expected["追忌"]);
  }

  assert.equal(differences.length, 0, differences.join("\n"));
});

function branchOf(value: string): string {
  return value.endsWith("宫") ? value.slice(0, -1) : value;
}

function solarTermLabel(value: string): string {
  return value.match(/(?:\[(\d+)\]|^(\d+))$/)?.slice(1).find(Boolean) ?? "";
}

function objectOrEmpty(value: unknown): JsonObject {
  return value && typeof value === "object" ? value as JsonObject : {};
}

function brightnessMap(palace: Palace): JsonObject {
  return Object.fromEntries(
    palace.stars
      .filter((star) => star.brightness !== undefined && star.brightnessCode !== undefined)
      .map((star) => [star.name, { "庙旺": star.brightness, "级别值": String(star.brightnessCode) }]),
  );
}

function transformationMap(edges: TransformationEdge[]): JsonObject {
  return Object.fromEntries(
    edges.map((edge) => [edge.star, {
      "化": edge.type,
      "支": edge.targetBranch,
      "宫": edge.targetPalace,
      "力度": String(edge.strength),
    }]),
  );
}
