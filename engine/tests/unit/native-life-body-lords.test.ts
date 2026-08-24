import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeBodyLord0x15a6b0,
  nativeLifeBodyLords,
  nativeLifeBodyLordsEvidenceContract,
  nativeLifeLord0x15a100,
} from "../../src/engine/native-life-body-lords";

test("ports the 1998 fixture life lord and body lord", () => {
  assert.deepEqual(nativeLifeBodyLords({ mingPalaceBranch: "酉", lunarYearBranch: "寅" }), {
    mingPalaceBranch: "酉",
    lifeLord0xe0: "文曲",
    lunarYearBranch: "寅",
    bodyLord0xf8: "天梁",
  });
});

test("covers every APK branch group for both lord functions", () => {
  assert.deepEqual(
    ["子", "丑", "寅", "卯", "辰", "巳", "午"].map(nativeLifeLord0x15a100),
    ["贪狼", "巨门", "禄存", "文曲", "廉贞", "武曲", "破军"],
  );
  assert.deepEqual(
    ["子", "丑", "寅", "卯", "辰", "巳", "午"].map(nativeBodyLord0x15a6b0),
    ["火星", "天相", "天梁", "天同", "文昌", "天机", "铃星"],
  );
});

test("exposes the two native functions and context destinations", () => {
  const contract = nativeLifeBodyLordsEvidenceContract();
  assert.equal(contract.lifeLordRules.length, 7);
  assert.equal(contract.bodyLordRules.length, 7);
  assert.deepEqual(contract.contextOffsets, { lifeLord: "0xe0", bodyLord: "0xf8" });
});
