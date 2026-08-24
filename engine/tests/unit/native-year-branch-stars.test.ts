import test from "node:test";
import assert from "node:assert/strict";
import { nativeYearBranchStars0x1601b0, nativeYearBranchStarsEvidenceContract } from "../../src/engine/native-year-branch-stars";

test("ports all year-branch stars for the 1998 寅-year fixture with extended stars", () => {
  const result = nativeYearBranchStars0x1601b0({ lunarYearBranch: "寅", extendedStarsFlag0x450: true });
  assert.deepEqual(result.placements.map(({ star, branch }) => ({ star, branch })), [
    { star: "天哭", branch: "辰" }, { star: "天虚", branch: "申" },
    { star: "天马", branch: "申" }, { star: "红鸾", branch: "丑" },
    { star: "天喜", branch: "未" }, { star: "龙池", branch: "午" },
    { star: "凤阁", branch: "申" }, { star: "华盖", branch: "戌" },
    { star: "劫煞", branch: "亥" }, { star: "咸池", branch: "卯" },
    { star: "孤辰", branch: "巳" }, { star: "寡宿", branch: "丑" },
    { star: "破碎", branch: "酉" }, { star: "大耗", branch: "酉" },
    { star: "天德", branch: "亥" }, { star: "月德", branch: "未" },
    { star: "年解", branch: "申" }, { star: "蜚廉", branch: "戌" },
    { star: "天空", branch: "卯" }, { star: "血刃", branch: "申" },
  ]);
});

test("honors the native 0x450 gate for 血刃 only", () => {
  const result = nativeYearBranchStars0x1601b0({ lunarYearBranch: "寅", extendedStarsFlag0x450: false });
  assert.equal(result.placements.length, 19);
  assert.ok(!result.placements.some(({ star }) => star === "血刃"));
});

test("locks the native four-entry, twelve-entry, and 破碎 tables", () => {
  const contract = nativeYearBranchStarsEvidenceContract();
  assert.equal(contract.mod4Tables.length, 4);
  assert.equal(contract.branchTables.length, 5);
  assert.deepEqual(contract.brokenGroups, [
    { input: "子午卯酉", branch: "巳" },
    { input: "辰戌丑未", branch: "丑" },
    { input: "寅申巳亥", branch: "酉" },
  ]);
  assert.equal(contract.bloodBladeGate.compareAddress, "0x16204f");
});

test("rejects invalid year branches", () => {
  assert.throws(() => nativeYearBranchStars0x1601b0({ lunarYearBranch: "猫", extendedStarsFlag0x450: true }), /outside APK table/);
});
