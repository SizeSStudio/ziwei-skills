import test from "node:test";
import assert from "node:assert/strict";
import { nativeHourStars0x15f7f0 } from "../../src/engine/native-hour-stars";
import { nativeMajorStars } from "../../src/engine/native-major-stars";
import { nativeMonthStars0x15caa0 } from "../../src/engine/native-month-stars";
import { nativePalaceNames0x157500 } from "../../src/engine/native-palace-names";
import { nativePalaceStems0x156fb0 } from "../../src/engine/native-palace-stems";
import {
  nativeTransformationRecords0x176530,
  nativeTransformations0x16b0a0,
  nativeTransformationsEvidenceContract,
} from "../../src/engine/native-transformations";

function fixture() {
  const names = nativePalaceNames0x157500(9);
  const stems = nativePalaceStems0x156fb0("戊");
  const palaces = stems.map(({ branch, stem }) => ({
    branch,
    stem,
    name: names.find((palace) => palace.branch === branch)?.name ?? "",
  }));
  const placements = [
    ...nativeMajorStars({ ziweiAnchorBranchIndex: 5, tianfuAnchorBranchIndex: 11 }).placements,
    ...nativeMonthStars0x15caa0({ normalizedLunarMonth: 1, extendedStarsFlag0x450: true }).placements,
    ...nativeHourStars0x15f7f0("巳").placements,
  ];
  return {
    palaces,
    starBranches: Object.fromEntries(placements.map(({ star, branch }) => [star, branch])),
    palaceNamesByBranch: Object.fromEntries(palaces.map(({ branch, name }) => [branch, name])),
  };
}

test("ports the 0x176530 戊-year transformation records for the 1998 fixture", () => {
  const { starBranches, palaceNamesByBranch } = fixture();
  assert.deepEqual(nativeTransformationRecords0x176530({ stem: "戊", starBranches, palaceNamesByBranch }), [
    { type: "禄", star: "贪狼", targetBranch: "丑", targetPalace: "官禄", strength: 50, element: "金", action: "放大" },
    { type: "权", star: "太阴", targetBranch: "子", targetPalace: "田宅", strength: 10, element: "火", action: "阻断" },
    { type: "科", star: "右弼", targetBranch: "戌", targetPalace: "父母", strength: 30, element: "木", action: "持续" },
    { type: "忌", star: "天机", targetBranch: "辰", targetPalace: "疾厄", strength: 30, element: "水", action: "终止" },
  ]);
});

test("builds natal, palace-stem, self, opposite, and follow transformation containers", () => {
  const { palaces, starBranches } = fixture();
  const result = nativeTransformations0x16b0a0({ lunarYearStem: "戊", palaces, starBranches });
  assert.equal(result.natal0x420.length, 4);
  assert.ok(result.palaces.every(({ produced0xf8 }) => produced0xf8.length === 4));

  const byBranch = Object.fromEntries(result.palaces.map((palace) => [palace.branch, palace]));
  assert.deepEqual(byBranch.寅?.selfTransformations0x118.map(({ type, star }) => ({ type, star })), [
    { type: "忌", star: "太阳" },
  ]);
  assert.deepEqual(byBranch.酉?.selfTransformations0x118.map(({ type, star }) => ({ type, star })), [
    { type: "科", star: "文曲" },
  ]);
  assert.deepEqual(byBranch.子?.oppositeIncoming0x128.map(({ type, star }) => ({ type, star })), [
    { type: "权", star: "太阴" },
  ]);
  assert.deepEqual(byBranch.辰?.oppositeIncoming0x128.map(({ type, star }) => ({ type, star })), [
    { type: "禄", star: "天梁" },
    { type: "科", star: "左辅" },
  ]);
  assert.deepEqual(
    Object.fromEntries(
      result.palaces
        .filter(({ followLu0x140, followJi0x158 }) => followLu0x140.length > 0 || followJi0x158.length > 0)
        .map(({ branch, followLu0x140, followJi0x158 }) => [branch, { followLu0x140, followJi0x158 }]),
    ),
    {
      子: { followLu0x140: ["巳", "辰"], followJi0x158: ["丑", "卯", "申"] },
      丑: { followLu0x140: ["午", "未"], followJi0x158: ["亥", "戌"] },
      寅: { followLu0x140: ["申", "酉"], followJi0x158: ["子", "寅", "巳"] },
      辰: { followLu0x140: ["丑", "卯", "戌"], followJi0x158: ["午"] },
      巳: { followLu0x140: [], followJi0x158: ["酉"] },
      酉: { followLu0x140: ["亥", "子", "寅"], followJi0x158: ["未", "辰"] },
    },
  );
});

test("locks the APK transformation maps and 4x12 strength table addresses", () => {
  const contract = nativeTransformationsEvidenceContract();
  assert.deepEqual(contract.starsByStem.甲, ["廉贞", "破军", "武曲", "太阳"]);
  assert.deepEqual(contract.starsByStem.癸, ["破军", "巨门", "太阴", "贪狼"]);
  assert.equal(contract.strengthTables.禄, "0x83e50");
  assert.equal(contract.strengthTables.忌, "0x83ee0");
  assert.deepEqual(contract.actions, ["放大", "阻断", "持续", "终止"]);
  assert.equal(contract.oppositeIncomingDestination, "opposite node+0x128");
  assert.equal(contract.followLuDestination, "target node+0x140 string vector");
  assert.equal(contract.followJiDestination, "target node+0x158 string vector");
  assert.equal(contract.followSource, "source node+0x20 branch string");
});

test("fails when an APK transformation target star is absent", () => {
  const { starBranches, palaceNamesByBranch } = fixture();
  delete starBranches.贪狼;
  assert.throws(
    () => nativeTransformationRecords0x176530({ stem: "戊", starBranches, palaceNamesByBranch }),
    /target star is absent/,
  );
});
