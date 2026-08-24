import test from "node:test";
import assert from "node:assert/strict";
import { nativeMinorLimits0x1597d0, nativeMinorLimitsEvidenceContract } from "../../src/engine/native-minor-limits";

test("ports the 1998 male minor-limit cycle from the 寅-year 辰 anchor", () => {
  const result = nativeMinorLimits0x1597d0("寅", "male");
  assert.equal(result.ageOneAnchorBranch, "辰");
  assert.equal(result.directionStep, 1);
  assert.deepEqual(result.palaces.find(({ branch }) => branch === "辰")?.ages, [1, 13, 25, 37, 49, 61]);
  assert.equal(result.palaces.find(({ branch }) => branch === "辰")?.label0xe0, "1,13,25,37,49,61,");
  assert.deepEqual(result.palaces.find(({ branch }) => branch === "卯")?.ages, [12, 24, 36, 48, 60, 72]);
});

test("uses the female reverse path and locks all four APK year-branch anchors", () => {
  assert.equal(nativeMinorLimits0x1597d0("申", "male").ageOneAnchorBranch, "戌");
  assert.equal(nativeMinorLimits0x1597d0("巳", "male").ageOneAnchorBranch, "未");
  assert.equal(nativeMinorLimits0x1597d0("亥", "male").ageOneAnchorBranch, "丑");

  const female = nativeMinorLimits0x1597d0("寅", "female");
  assert.equal(female.directionStep, -1);
  assert.deepEqual(female.palaces.find(({ branch }) => branch === "卯")?.ages, [2, 14, 26, 38, 50, 62]);
  assert.equal(female.palaces.flatMap(({ ages }) => ages).length, 72);
});

test("documents the 72 native writes and trailing-comma format", () => {
  const contract = nativeMinorLimitsEvidenceContract();
  assert.equal(contract.ageRange, "1..72");
  assert.equal(contract.format, "%d,");
  assert.equal(contract.yearBranchGroups.length, 4);
});
