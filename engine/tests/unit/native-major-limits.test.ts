import test from "node:test";
import assert from "node:assert/strict";
import { nativeMajorLimits0x159170, nativeMajorLimitsEvidenceContract } from "../../src/engine/native-major-limits";

test("ports the forward major limits for an 阳男火六局 characterization vector", () => {
  const result = nativeMajorLimits0x159170({
    genderLabel: "阳男",
    bureauNumber: 6,
    mingPalaceBranchIndex: 9,
  });

  assert.equal(result.direction0xc8, "顺");
  assert.deepEqual(
    result.limits.map(({ branch, label0xc8 }) => `${branch}:${label0xc8}`),
    [
      "酉:6~15", "戌:16~25", "亥:26~35", "子:36~45", "丑:46~55", "寅:56~65",
      "卯:66~75", "辰:76~85", "巳:86~95", "午:96~105", "未:106~115", "申:116~125",
    ],
  );
});

test("uses the APK reverse branch for 阴男 and 阳女", () => {
  for (const genderLabel of ["阴男", "阳女"] as const) {
    const result = nativeMajorLimits0x159170({ genderLabel, bureauNumber: 2, mingPalaceBranchIndex: 0 });
    assert.equal(result.direction0xc8, "逆");
    assert.equal(result.limits[0]?.branch, "子");
    assert.equal(result.limits[1]?.branch, "亥");
    assert.equal(result.limits[11]?.branch, "丑");
    assert.equal(result.limits[11]?.label0xc8, "112~121");
  }
});

test("documents the exact direction comparisons and label format", () => {
  const contract = nativeMajorLimitsEvidenceContract();
  assert.equal(contract.forwardLabels, "阳男 or 阴女");
  assert.equal(contract.format, "%d~%d");
  assert.equal(contract.nodeOffset, "palace node +0xc8");
});
