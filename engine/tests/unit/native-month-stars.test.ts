import test from "node:test";
import assert from "node:assert/strict";
import { nativeMonthStars0x15caa0, nativeMonthStarsEvidenceContract } from "../../src/engine/native-month-stars";

test("ports all 26 month-driven stars for the 1998 lunar-month-one fixture", () => {
  const result = nativeMonthStars0x15caa0({ normalizedLunarMonth: 1, extendedStarsFlag0x450: true });
  assert.equal(result.placements.length, 26);
  assert.deepEqual(result.placements.slice(0, 4).map(({ star, branch }) => ({ star, branch })), [
    { star: "左辅", branch: "辰" },
    { star: "右弼", branch: "戌" },
    { star: "天刑", branch: "酉" },
    { star: "天姚", branch: "丑" },
  ]);
  assert.deepEqual(result.placements.slice(4).map(({ star, branch }) => ({ star, branch })), [
    { star: "阴煞", branch: "寅" }, { star: "天月", branch: "戌" },
    { star: "天巫", branch: "巳" }, { star: "解神", branch: "申" },
    { star: "月马", branch: "亥" }, { star: "天富", branch: "卯" },
    { star: "天财", branch: "寅" }, { star: "天医", branch: "亥" },
    { star: "生气", branch: "子" }, { star: "岁刑", branch: "戌" },
    { star: "阴奸", branch: "申" }, { star: "水杀", branch: "丑" },
    { star: "恶杀", branch: "卯" }, { star: "冤杀", branch: "未" },
    { star: "天贼", branch: "亥" }, { star: "天狗", branch: "戌" },
    { star: "五墓", branch: "辰" }, { star: "三丘", branch: "戌" },
    { star: "雷火", branch: "寅" }, { star: "注受", branch: "子" },
    { star: "死神", branch: "巳" }, { star: "飞符", branch: "申" },
  ]);
});

test("locks all 22 relocation table addresses and twelve entries", () => {
  const contract = nativeMonthStarsEvidenceContract();
  assert.equal(contract.tableStars.length, 22);
  assert.equal(contract.tableStars[0]?.address, "0x19f0d0");
  assert.equal(contract.tableStars[21]?.address, "0x19f8b0");
  assert.ok(contract.tableStars.every(({ count }) => count === 12));
});

test("honors the native context 0x450 gate after 解神", () => {
  const result = nativeMonthStars0x15caa0({ normalizedLunarMonth: 1, extendedStarsFlag0x450: false });
  assert.equal(result.placements.length, 8);
  assert.deepEqual(result.placements.map(({ star }) => star), ["左辅", "右弼", "天刑", "天姚", "阴煞", "天月", "天巫", "解神"]);
  assert.equal(nativeMonthStarsEvidenceContract().extendedStarsGate.compareAddress, "0x15d3d3");
});

test("preserves month-twelve formula wraparound", () => {
  const result = nativeMonthStars0x15caa0({ normalizedLunarMonth: 12, extendedStarsFlag0x450: true });
  assert.deepEqual(result.placements.slice(0, 4).map(({ star, branch }) => ({ star, branch })), [
    { star: "左辅", branch: "卯" },
    { star: "右弼", branch: "亥" },
    { star: "天刑", branch: "申" },
    { star: "天姚", branch: "子" },
  ]);
});

test("rejects month values outside the native table", () => {
  assert.throws(() => nativeMonthStars0x15caa0({ normalizedLunarMonth: 0, extendedStarsFlag0x450: true }), /outside APK table/);
  assert.throws(() => nativeMonthStars0x15caa0({ normalizedLunarMonth: 13, extendedStarsFlag0x450: true }), /outside APK table/);
});
