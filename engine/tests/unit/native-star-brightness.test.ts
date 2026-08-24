import test from "node:test";
import assert from "node:assert/strict";
import { nativeMajorStars } from "../../src/engine/native-major-stars";
import { nativeStarBrightness0x16bf60, nativeStarBrightnessEvidenceContract } from "../../src/engine/native-star-brightness";

test("ports APK brightness labels for all fourteen major stars in the 1998 fixture", () => {
  const placements = nativeMajorStars({ ziweiAnchorBranchIndex: 5, tianfuAnchorBranchIndex: 11 }).placements;
  assert.deepEqual(nativeStarBrightness0x16bf60(placements).map(({ star, branch, brightness }) => ({ star, branch, brightness })), [
    { star: "紫微", branch: "巳", brightness: "旺" },
    { star: "天机", branch: "辰", brightness: "庙" },
    { star: "太阳", branch: "寅", brightness: "平" },
    { star: "武曲", branch: "丑", brightness: "庙" },
    { star: "天同", branch: "子", brightness: "庙" },
    { star: "廉贞", branch: "酉", brightness: "不" },
    { star: "天府", branch: "亥", brightness: "庙" },
    { star: "太阴", branch: "子", brightness: "庙" },
    { star: "贪狼", branch: "丑", brightness: "庙" },
    { star: "巨门", branch: "寅", brightness: "旺" },
    { star: "天相", branch: "卯", brightness: "庙" },
    { star: "天梁", branch: "辰", brightness: "庙" },
    { star: "七杀", branch: "巳", brightness: "旺" },
    { star: "破军", branch: "酉", brightness: "旺" },
  ]);
});

test("keeps code zero empty and leaves stars absent from the native table ungraded", () => {
  assert.deepEqual(nativeStarBrightness0x16bf60([
    { star: "天马", branch: "子" },
    { star: "台辅", branch: "寅" },
  ]), [
    { star: "天马", branch: "子", branchIndex: 0, element: "水", brightnessCode: 0, brightness: "" },
    { star: "台辅", branch: "寅", branchIndex: 2 },
  ]);
});

test("locks all sixty constructor records and APK label mapping", () => {
  const contract = nativeStarBrightnessEvidenceContract();
  assert.equal(contract.records.length, 60);
  assert.deepEqual(contract.records[0], { star: "紫微", element: "土", codes: "777666776666" });
  assert.deepEqual(contract.records[59], { star: "破碎", element: "水", codes: "010001000300" });
  assert.deepEqual(contract.brightnessLabels, ["", "陷", "不", "平", "利", "得", "旺", "庙"]);
  assert.ok(contract.records.every(({ codes }) => codes.length === 12 && /^[0-7]+$/.test(codes)));
});

test("rejects branches outside the APK order", () => {
  assert.throws(() => nativeStarBrightness0x16bf60([{ star: "紫微", branch: "猫" }]), /outside APK table/);
});
