import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeMajorStarAnchors,
  nativeMajorStarAnchorsEvidenceContract,
} from "../../src/engine/native-major-star-anchors";

test("ports the 紫微 and 天府 anchors for a lunar-day-24 fire-six vector", () => {
  assert.deepEqual(nativeMajorStarAnchors({ lunarDayNumber: 24, bureauNumber: 6 }), {
    lunarDayNumber0x210: 24,
    bureauNumber: 6,
    quotientBeforeCorrection: 4,
    remainder: 0,
    complementToBureau: 0,
    ziweiOffsetFromTiger: 3,
    ziweiBranchIndex: 5,
    ziweiBranch: "巳",
    tianfuBranchIndex: 11,
    tianfuBranch: "亥",
  });
});

test("preserves the native odd/even complement correction", () => {
  const evenComplement = nativeMajorStarAnchors({ lunarDayNumber: 8, bureauNumber: 5 });
  assert.equal(evenComplement.complementToBureau, 2);
  assert.equal(evenComplement.ziweiOffsetFromTiger, 3);

  const oddComplement = nativeMajorStarAnchors({ lunarDayNumber: 9, bureauNumber: 5 });
  assert.equal(oddComplement.complementToBureau, 1);
  assert.equal(oddComplement.ziweiOffsetFromTiger, 0);
});

test("documents the exact Tianfu mirror split", () => {
  const contract = nativeMajorStarAnchorsEvidenceContract();
  assert.equal(contract.tianfuHelperRange, "[0x15ace0, 0x15ae78)");
  assert.equal(contract.tianfuExpression, "ziweiIndex <= 4 ? 4 - ziweiIndex : 16 - ziweiIndex");
});
