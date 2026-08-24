import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeMajorStars,
  nativeMajorStarsEvidenceContract,
} from "../../src/engine/native-major-stars";

test("ports both native major-star groups for the 1998 fixture", () => {
  const result = nativeMajorStars({ ziweiAnchorBranchIndex: 5, tianfuAnchorBranchIndex: 11 });

  assert.deepEqual(
    result.placements.map(({ star, branch, offsetFromAnchor }) => ({ star, branch, offsetFromAnchor })),
    [
      { star: "紫微", branch: "巳", offsetFromAnchor: 0 },
      { star: "天机", branch: "辰", offsetFromAnchor: -1 },
      { star: "太阳", branch: "寅", offsetFromAnchor: -3 },
      { star: "武曲", branch: "丑", offsetFromAnchor: -4 },
      { star: "天同", branch: "子", offsetFromAnchor: -5 },
      { star: "廉贞", branch: "酉", offsetFromAnchor: -8 },
      { star: "天府", branch: "亥", offsetFromAnchor: 0 },
      { star: "太阴", branch: "子", offsetFromAnchor: 1 },
      { star: "贪狼", branch: "丑", offsetFromAnchor: 2 },
      { star: "巨门", branch: "寅", offsetFromAnchor: 3 },
      { star: "天相", branch: "卯", offsetFromAnchor: 4 },
      { star: "天梁", branch: "辰", offsetFromAnchor: 5 },
      { star: "七杀", branch: "巳", offsetFromAnchor: 6 },
      { star: "破军", branch: "酉", offsetFromAnchor: 10 },
    ],
  );
  assert.deepEqual(result.byBranch["巳"], ["紫微", "七杀"]);
  assert.deepEqual(result.byBranch["子"], ["天同", "太阴"]);
  assert.deepEqual(result.byBranch["亥"], ["天府"]);
  assert.deepEqual(result.byBranch["午"], []);
});

test("locks the two native function boundaries and signed sequences", () => {
  const contract = nativeMajorStarsEvidenceContract();
  assert.deepEqual(contract.ziweiGroup.offsets, [0, -1, -3, -4, -5, -8]);
  assert.deepEqual(contract.tianfuGroup.offsets, [0, 1, 2, 3, 4, 5, 6, 10]);
  assert.equal(contract.ziweiGroup.functionRange, "[0x15aeb0, 0x15b71f)");
  assert.equal(contract.tianfuGroup.functionRange, "[0x15ba70, 0x15c61b)");
  assert.equal(contract.destinationNodeOffset, "0x170");
});

test("rejects branch indices outside the APK branch table", () => {
  assert.throws(
    () => nativeMajorStars({ ziweiAnchorBranchIndex: 12, tianfuAnchorBranchIndex: 0 }),
    /outside APK table/,
  );
});
