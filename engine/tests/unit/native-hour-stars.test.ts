import test from "node:test";
import assert from "node:assert/strict";
import { nativeHourStars0x15f7f0, nativeHourStarsEvidenceContract } from "../../src/engine/native-hour-stars";

test("ports all six hour-driven stars for the 1998 巳-hour fixture", () => {
  assert.deepEqual(nativeHourStars0x15f7f0("巳"), {
    hourBranch: "巳",
    hourBranchIndex: 5,
    placements: [
      { star: "文昌", baseBranch: "戌", indexMultiplier: -1, offset: -5, branchIndex: 5, branch: "巳" },
      { star: "文曲", baseBranch: "辰", indexMultiplier: 1, offset: 5, branchIndex: 9, branch: "酉" },
      { star: "地空", baseBranch: "亥", indexMultiplier: -1, offset: -5, branchIndex: 6, branch: "午" },
      { star: "地劫", baseBranch: "亥", indexMultiplier: 1, offset: 5, branchIndex: 4, branch: "辰" },
      { star: "台辅", baseBranch: "午", indexMultiplier: 1, offset: 5, branchIndex: 11, branch: "亥" },
      { star: "封诰", baseBranch: "寅", indexMultiplier: 1, offset: 5, branchIndex: 7, branch: "未" },
    ],
  });
});

test("locks the exact native base branches and signs", () => {
  const contract = nativeHourStarsEvidenceContract();
  assert.deepEqual(contract.rules, [
    { star: "文昌", baseBranch: "戌", indexMultiplier: -1 },
    { star: "文曲", baseBranch: "辰", indexMultiplier: 1 },
    { star: "地空", baseBranch: "亥", indexMultiplier: -1 },
    { star: "地劫", baseBranch: "亥", indexMultiplier: 1 },
    { star: "台辅", baseBranch: "午", indexMultiplier: 1 },
    { star: "封诰", baseBranch: "寅", indexMultiplier: 1 },
  ]);
  assert.equal(contract.destinationNodeOffset, "0x170");
});

test("rejects a branch not present in the APK table", () => {
  assert.throws(() => nativeHourStars0x15f7f0("猫"), /outside APK table/);
});
